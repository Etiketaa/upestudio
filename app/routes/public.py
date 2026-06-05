from flask import Blueprint, render_template, request, redirect, url_for, flash
from app.models import db, Servicio, Horario, Configuracion, Turno, Bloqueo
from datetime import datetime, time, timedelta

public_bp = Blueprint('public', __name__)

def get_config_dict():
    configs = Configuracion.query.all()
    return {c.clave: c.valor for c in configs}

def generate_slots(fecha_str, servicio_id):
    try:
        fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
    except ValueError:
        return []

    # Verificar si la fecha está bloqueada (Vacaciones/Feriados)
    if Bloqueo.query.filter_by(fecha=fecha).first():
        return []

    # dia_semana: 0=Lun...6=Dom en Python isoweekday()
    # En PHP date('w') es 0=Dom...6=Sab. 
    # Nuestro schema.sql usa 0=Dom...6=Sab.
    # Python weekday() es 0=Lun...6=Dom.
    # Para coincidir con schema.sql (0=Dom...6=Sab):
    dia_semana_php = (fecha.weekday() + 1) % 7
    
    servicio = Servicio.query.get(servicio_id)
    if not servicio:
        return []
    
    duracion = servicio.duracion
    rangos = Horario.query.filter_by(dia_semana=dia_semana_php, activo=True).all()
    if not rangos:
        return []
    
    slots = []
    for rango in rangos:
        # Convertir time a datetime para cálculos
        inicio_dt = datetime.combine(fecha, rango.hora_inicio)
        fin_dt = datetime.combine(fecha, rango.hora_fin)
        
        current = inicio_dt
        while current + timedelta(minutes=duracion) <= fin_dt:
            slots.append(current.time().strftime('%H:%M'))
            # Avanzar de a 30 min (según lógica PHP $inicio += 1800)
            current += timedelta(minutes=30)
            
    # Filtrar ocupados
    turnos_ocupados = Turno.query.filter(
        Turno.fecha == fecha,
        Turno.estado != 'cancelado'
    ).all()
    
    disponibles = []
    for slot_time_str in slots:
        slot_start = datetime.strptime(slot_time_str, '%H:%M').time()
        slot_start_dt = datetime.combine(fecha, slot_start)
        slot_end_dt = slot_start_dt + timedelta(minutes=duracion)
        
        is_ocupado = False
        for t in turnos_ocupados:
            t_start_dt = datetime.combine(fecha, t.hora)
            t_end_dt = t_start_dt + timedelta(minutes=t.servicio.duracion if t.servicio else 30)
            
            # Solapamiento: (start1 < end2) and (end1 > start2)
            if slot_start_dt < t_end_dt and slot_end_dt > t_start_dt:
                is_ocupado = True
                break
        
        if not is_ocupado:
            disponibles.append(slot_time_str)
            
    return disponibles

@public_bp.route('/')
def index():
    servicios = Servicio.query.filter_by(activo=True).order_by(Servicio.nombre).all()
    config_data = get_config_dict()
    return render_template('public/index.html', servicios=servicios, config_data=config_data)

from app.services.resend_mail import send_confirmation_email

@public_bp.route('/booking', methods=['GET', 'POST'])
def booking():
    servicios = Servicio.query.filter_by(activo=True).order_by(Servicio.nombre).all()
    hoy = datetime.now().strftime('%Y-%m-%d')
    
    # Datos de la búsqueda/formulario
    servicio_id = request.args.get('servicio') or request.form.get('servicio_id')
    fecha = request.args.get('fecha') or request.form.get('fecha')
    
    slots = []
    if servicio_id and fecha:
        slots = generate_slots(fecha, int(servicio_id))
    
    datos = {
        'servicio_id': servicio_id,
        'fecha': fecha,
        'nombre': request.form.get('nombre', ''),
        'email': request.form.get('email', ''),
        'telefono': request.form.get('telefono', ''),
        'notas': request.form.get('notas', ''),
        'hora': request.form.get('hora', '')
    }
    
    mensaje = None
    error = None
    
    if request.method == 'POST':
        # Validar
        errores = []
        if not datos['nombre'].strip(): errores.append("El nombre es obligatorio.")
        if not datos['email'].strip(): errores.append("Email es obligatorio.")
        if not datos['fecha']: errores.append("La fecha es obligatoria.")
        if not datos['hora']: errores.append("La hora es obligatoria.")
        if not datos['servicio_id']: errores.append("Seleccioná un servicio.")
        
        if not errores:
            try:
                servicio_obj = Servicio.query.get(int(datos['servicio_id']))
                nuevo_turno = Turno(
                    nombre=datos['nombre'],
                    email=datos['email'],
                    telefono=datos['telefono'],
                    servicio_id=int(datos['servicio_id']),
                    fecha=datetime.strptime(datos['fecha'], '%Y-%m-%d').date(),
                    hora=datetime.strptime(datos['hora'], '%H:%M').time(),
                    notas=datos['notas'],
                    estado='pendiente'
                )
                db.session.add(nuevo_turno)
                db.session.commit()
                
                # Enviar confirmación vía Resend
                send_confirmation_email(
                    datos['email'], 
                    datos['nombre'], 
                    datos['fecha'], 
                    datos['hora'], 
                    servicio_obj.nombre if servicio_obj else "Servicio"
                )
                
                flash("¡Turno registrado con éxito! Revisá tu email.", "success")
                return redirect(url_for('public.booking'))
            except Exception as e:
                db.session.rollback()
                error = f"Error al registrar el turno: {str(e)}"
        else:
            error = " <br> ".join(errores)

    return render_template('public/booking.html', 
                           servicios=servicios, 
                           hoy=hoy, 
                           datos=datos, 
                           slots=slots,
                           mensaje=mensaje,
                           error=error)

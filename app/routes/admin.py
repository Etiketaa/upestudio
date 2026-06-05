from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from app.models import db, Usuario, Turno, Servicio, Horario, Configuracion, Bloqueo
from datetime import datetime

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('admin.dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = Usuario.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('admin.dashboard'))
        else:
            flash('Usuario o contraseña incorrectos.', 'error')
            
    return render_template('admin/login.html')

@admin_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('admin.login'))

@admin_bp.route('/')
@login_required
def dashboard():
    # Conteos
    total = Turno.query.count()
    pendientes = Turno.query.filter_by(estado='pendiente').count()
    confirmados = Turno.query.filter_by(estado='confirmado').count()
    completados = Turno.query.filter_by(estado='completado').count()
    cancelados = Turno.query.filter_by(estado='cancelado').count()
    
    conteos = {
        'total': total,
        'pendientes': pendientes,
        'confirmados': confirmados,
        'completados': completados,
        'cancelados': cancelados
    }
    
    hoy_date = datetime.now().date()
    turnos_hoy = Turno.query.filter(
        Turno.fecha == hoy_date,
        Turno.estado.in_(['pendiente', 'confirmado'])
    ).order_by(Turno.hora.asc()).all()
    
    return render_template('admin/dashboard.html', 
                           conteos=conteos, 
                           turnos_hoy=turnos_hoy, 
                           hoy=hoy_date.strftime('%d/%m/%Y'))

@admin_bp.route('/appointments')
@login_required
def appointments():
    # Simplificado por ahora
    turnos = Turno.query.order_by(Turno.fecha.desc(), Turno.hora.desc()).all()
    return render_template('admin/dashboard.html', turnos=turnos)

from app.services.whatsapp import notify_appointment_confirmation

@admin_bp.route('/change_status/<int:id>/<string:estado>')
@login_required
def change_status(id, estado):
    turno = Turno.query.get_or_404(id)
    if estado in ['pendiente', 'confirmado', 'cancelado', 'completado']:
        turno.estado = estado
        db.session.commit()
        flash(f'Estado del turno actualizado a {estado}.', 'success')
        
        if estado == 'confirmado':
            notify_appointment_confirmation(turno)
        
    return redirect(request.referrer or url_for('admin.dashboard'))

@admin_bp.route('/servicios', methods=['GET', 'POST'])
@login_required
def servicios():
    editar_id = request.args.get('editar_id')
    editar = None
    if editar_id:
        editar = Servicio.query.get(editar_id)

    if request.method == 'POST':
        nombre = request.form.get('nombre')
        duracion = int(request.form.get('duracion', 0))
        precio = request.form.get('precio')
        precio = float(precio) if precio else None
        id_serv = request.form.get('id')

        if not nombre or duracion <= 0:
            flash('Nombre y duración son obligatorios.', 'error')
        elif id_serv:
            s = Servicio.query.get(id_serv)
            if s:
                s.nombre = nombre
                s.duracion = duracion
                s.precio = precio
                db.session.commit()
                flash('Servicio actualizado.', 'success')
                return redirect(url_for('admin.servicios'))
        else:
            nuevo = Servicio(nombre=nombre, duracion=duracion, precio=precio)
            db.session.add(nuevo)
            db.session.commit()
            flash('Servicio creado.', 'success')
            return redirect(url_for('admin.servicios'))

    servicios_list = Servicio.query.order_by(Servicio.nombre).all()
    return render_template('admin/servicios.html', servicios=servicios_list, editar=editar)

@admin_bp.route('/servicios/eliminar/<int:id>')
@login_required
def eliminar_servicio(id):
    s = Servicio.query.get_or_404(id)
    try:
        db.session.delete(s)
        db.session.commit()
        flash('Servicio eliminado.', 'success')
    except:
        db.session.rollback()
        flash('No se puede eliminar el servicio porque tiene turnos asociados.', 'error')
    return redirect(url_for('admin.servicios'))

@admin_bp.route('/horarios', methods=['GET', 'POST'])
@login_required
def horarios():
    if request.method == 'POST':
        dia = int(request.form.get('dia_semana'))
        inicio = datetime.strptime(request.form.get('hora_inicio'), '%H:%M').time()
        fin = datetime.strptime(request.form.get('hora_fin'), '%H:%M').time()
        
        if inicio >= fin:
            flash('La hora de inicio debe ser menor a la de fin.', 'error')
        else:
            nuevo = Horario(dia_semana=dia, hora_inicio=inicio, hora_fin=fin)
            db.session.add(nuevo)
            db.session.commit()
            flash('Horario agregado correctamente.', 'success')
            return redirect(url_for('admin.horarios'))

    horarios_list = Horario.query.order_by(Horario.dia_semana, Horario.hora_inicio).all()
    return render_template('admin/horarios.html', horarios=horarios_list)

@admin_bp.route('/horarios/toggle/<int:id>')
@login_required
def toggle_horario(id):
    h = Horario.query.get_or_404(id)
    h.activo = not h.activo
    db.session.commit()
    flash('Estado del horario actualizado.', 'success')
    return redirect(url_for('admin.horarios'))

@admin_bp.route('/horarios/eliminar/<int:id>')
@login_required
def eliminar_horario(id):
    h = Horario.query.get_or_404(id)
    db.session.delete(h)
    db.session.commit()
    flash('Horario eliminado.', 'success')
    return redirect(url_for('admin.horarios'))

@admin_bp.route('/bloqueos', methods=['GET', 'POST'])
@login_required
def bloqueos():
    if request.method == 'POST':
        fecha_str = request.form.get('fecha')
        motivo = request.form.get('motivo')
        
        try:
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
            if Bloqueo.query.filter_by(fecha=fecha).first():
                flash('Esa fecha ya está bloqueada.', 'error')
            else:
                nuevo = Bloqueo(fecha=fecha, motivo=motivo)
                db.session.add(nuevo)
                db.session.commit()
                flash('Fecha bloqueada correctamente.', 'success')
        except ValueError:
            flash('Fecha inválida.', 'error')
            
        return redirect(url_for('admin.bloqueos'))

    bloqueos_list = Bloqueo.query.filter(Bloqueo.fecha >= datetime.now().date()).order_by(Bloqueo.fecha.asc()).all()
    hoy_str = datetime.now().strftime('%Y-%m-%d')
    return render_template('admin/bloqueos.html', bloqueos=bloqueos_list, hoy=hoy_str)

@admin_bp.route('/bloqueos/eliminar/<int:id>')
@login_required
def eliminar_bloqueo(id):
    b = Bloqueo.query.get_or_404(id)
    db.session.delete(b)
    db.session.commit()
    flash('Bloqueo eliminado. La fecha vuelve a estar disponible.', 'success')
    return redirect(url_for('admin.bloqueos'))

@admin_bp.route('/about')
@login_required
def about():
    return "Gestión de Quienes Somos - Próximamente"

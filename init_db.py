from app import create_app
from app.models import db, Usuario, Servicio, Horario, Configuracion
from datetime import time

app = create_app()

def init_db():
    with app.app_context():
        # Crear tablas
        db.create_all()
        
        # Verificar si ya existen datos
        if Usuario.query.filter_by(username='admin').first():
            print("La base de datos ya está inicializada.")
            return

        # 1. Crear Usuario Admin
        admin = Usuario(
            username='admin',
            nombre='Administradora',
            email='admin@upestudio.com'
        )
        admin.set_password('admin123')
        db.session.add(admin)

        # 2. Crear Servicios (Enfocados a Maquillaje y Uñas)
        servicios = [
            Servicio(nombre='Maquillaje Social', duracion=60, precio=15000),
            Servicio(nombre='Maquillaje de Novia', duracion=90, precio=25000),
            Servicio(nombre='Esmaltado Semipermanente', duracion=45, precio=8000),
            Servicio(nombre='Uñas Esculpidas (Set Nuevo)', duracion=120, precio=18000),
            Servicio(nombre='Service de Esculpidas', duracion=90, precio=12000),
            Servicio(nombre='Kapping Gel', duracion=60, precio=10000),
        ]
        db.session.add_all(servicios)

        # 3. Crear Horarios (Ejemplo: Solo Jueves, Viernes y Sábados)
        horarios = [
            Horario(dia_semana=4, hora_inicio=time(14, 0), hora_fin=time(20, 0)), # Jueves tarde
            Horario(dia_semana=5, hora_inicio=time(10, 0), hora_fin=time(20, 0)), # Viernes todo el día
            Horario(dia_semana=6, hora_inicio=time(9, 0), hora_fin=time(13, 0)),  # Sábado mañana
        ]
        db.session.add_all(horarios)

        # 4. Configuración inicial
        configs = [
            Configuracion(clave='about_title', valor='Maquillaje & Uñas'),
            Configuracion(clave='about_text', valor='En UP! Estudio me especializo en realzar tu belleza natural para esos momentos especiales. Experta en maquillaje social, de novias y estética de uñas con productos de alta gama.'),
            Configuracion(clave='contact_whatsapp', valor='5492914000000'),
            Configuracion(clave='contact_instagram', valor='@up.estudio_'),
            Configuracion(clave='contact_direccion', valor='Bahía Blanca, Buenos Aires'),
            Configuracion(clave='contact_horarios', valor='Jue a Sáb (Cita previa)'),
        ]
        db.session.add_all(configs)

        db.session.commit()
        print("Base de datos inicializada correctamente.")

if __name__ == '__main__':
    init_db()

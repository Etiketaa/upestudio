import os
import resend
from flask import render_template
from app.models import Configuracion

resend.api_key = os.getenv('RESEND_API_KEY')

def get_config_dict():
    configs = Configuracion.query.all()
    return {c.clave: c.valor for c in configs}

def send_confirmation_email(to_email, nombre_cliente, fecha, hora, servicio):
    if not resend.api_key:
        print("RESEND_API_KEY no configurada. Saltando envío de mail.")
        return False

    config_data = get_config_dict()
    instagram = config_data.get('contact_instagram', '@up.estudio_')
    
    try:
        # Mapeo de variables según el template HTML
        html_content = render_template('emails/confirmacion.html', 
                                       NOMBRE_CLIENTE=nombre_cliente, 
                                       FECHA=fecha, 
                                       HORA=hora, 
                                       SERVICIO=servicio,
                                       DIRECCION=config_data.get('contact_direccion', 'Bahía Blanca'),
                                       WHATSAPP=config_data.get('contact_whatsapp', ''),
                                       INSTAGRAM=instagram,
                                       INSTAGRAM_SIN_ARROBA=instagram.replace('@', ''))
        
        params = {
            "from": os.getenv('MAIL_FROM', "UP! Estudio <turnos@upestudio.com>"),
            "to": [to_email],
            "subject": f"Confirmación de turno - {servicio}",
            "html": html_content,
        }

        r = resend.Emails.send(params)
        return r
    except Exception as e:
        print(f"Error enviando email via Resend: {str(e)}")
        return False

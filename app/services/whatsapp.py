import os
import requests

def send_whatsapp_message(number, message):
    url = os.getenv('EVOLUTION_API_URL')
    api_key = os.getenv('EVOLUTION_API_KEY')
    instance = os.getenv('EVOLUTION_INSTANCE_NAME')

    if not all([url, api_key, instance]):
        print("Configuración de Evolution API incompleta. Saltando WhatsApp.")
        return False

    # Limpiar número (solo dígitos)
    clean_number = "".join(filter(str.isdigit, number))
    
    endpoint = f"{url}/message/sendText/{instance}"
    headers = {
        "Content-Type": "application/json",
        "apikey": api_key
    }
    
    payload = {
        "number": clean_number,
        "options": {
            "delay": 1200,
            "presence": "composing"
        },
        "textMessage": {
            "text": message
        }
    }

    try:
        response = requests.post(endpoint, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error enviando mensaje de WhatsApp: {str(e)}")
        return False

def notify_appointment_confirmation(turno):
    mensaje = (
        f"¡Hola {turno.nombre}! 👋\n\n"
        f"Te confirmamos tu turno en *UP! Estudio*:\n"
        f"🗓️ Fecha: {turno.fecha.strftime('%d/%m/%Y')}\n"
        f"⏰ Hora: {turno.hora.strftime('%H:%M')} hs\n"
        f"💇‍♀️ Servicio: {turno.servicio.nombre if turno.servicio else 'No especificado'}\n\n"
        f"📍 Te esperamos en Bahía Blanca.\n"
        f"Si necesitás cancelar, por favor avisamos con anticipación."
    )
    return send_whatsapp_message(turno.telefono, mensaje)

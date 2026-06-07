# UP! Estudio - Sistema de Turnos (Flask + Turso)

Este proyecto es una aplicación de reserva de turnos migrada de PHP a **Python (Flask)**, optimizada para funcionar en **Vercel** utilizando una arquitectura de base de datos híbrida basada en **SQLite/Turso (LibSQL)**.

## 📌 Contexto del Negocio
- **Rubro:** Maquillaje social/novias y Estética de Uñas.
- **Flujo de Trabajo:** El profesional no trabaja diariamente. El sistema permite gestionar rangos horarios específicos por día y bloquear fechas (vacaciones/feriados).
- **Integraciones:** Notificaciones automáticas por Email (Resend) y WhatsApp (Evolution API).

## 🛠️ Stack Tecnológico
- **Framework:** Flask 3.x
- **ORM:** SQLAlchemy con soporte para LibSQL.
- **Base de Datos:** 
  - **Local:** SQLite (`database.db`).
  - **Producción (Vercel):** Turso (Cloud SQLite).
- **Despliegue:** Vercel (Serverless Functions).

## 📋 Requerimientos Implementados
1.  **CRUD de Servicios:** Panel admin para gestionar nombres, duraciones y precios de servicios de maquillaje y uñas.
2.  **Gestión de Horarios:** Sistema flexible para definir qué días y en qué horarios se atiende (ej: solo Jueves y Viernes).
3.  **Bloqueador de Fechas:** Interfaz para cargar fechas específicas donde no hay atención (vacaciones/feriados), invalidando los slots automáticos.
4.  **Generador de Slots:** Lógica inteligente que calcula turnos disponibles basados en la duración del servicio, horarios laborales y turnos ya ocupados.
5.  **Notificaciones:**
    - Email de confirmación inmediato vía API de Resend.
    - Notificación por WhatsApp vía Evolution API al confirmar un turno desde el admin.

## 🚀 Guía para Agentes / Desarrolladores

### Variables de Entorno (.env)
```bash
SECRET_KEY=clave-secreta-provisoria
# Para Turso en Vercel:
DATABASE_URL=libsql://tu-db.turso.io
DATABASE_AUTH_TOKEN=tu-token
# Para Mails/WA:
RESEND_API_KEY=re_...
EVOLUTION_API_URL=...
EVOLUTION_INSTANCE_NAME=...
```

### Comandos Clave
- **Inicializar DB (Local/Nube):** `python init_db.py` (Crea tablas y carga datos base de maquillaje/uñas).
- **Ejecutar Localmente:** `export PYTHONPATH=$PYTHONPATH:. && python api/index.py` (o `flask run --port=5001`).

### Estructura del Proyecto
- `api/index.py`: Punto de entrada para Vercel.
- `app/models.py`: Modelos SQLAlchemy (Usuario, Servicio, Horario, Turno, Bloqueo).
- `app/routes/`: Lógica separada por Blueprints (`public` y `admin`).
- `app/services/`: Clientes para Resend y WhatsApp.
- `app/templates/`: Vistas Jinja2 con arquitectura de herencia.

## ⚠️ Notas de Mantenimiento
- Al usar Vercel, el sistema de archivos es de solo lectura. El `instance_path` se redirige a `/tmp` en `app/__init__.py`.
- El filtro `nl2br` está registrado globalmente en la app para manejar saltos de línea en descripciones desde la DB.

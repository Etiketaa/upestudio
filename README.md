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

## 🤖 Instrucciones para el Próximo Agente (IA Context)

### Lógica de Negocio Crítica
- **Cálculo de Slots (`app/routes/public.py`):** La función `generate_slots` cruza tres fuentes: 
    1. El día de la semana (`Horario`).
    2. La duración del `Servicio`.
    3. Exclusiones por `Bloqueo` (fechas específicas) y `Turno` (ocupados). 
    *Ojo:* Se utiliza un incremento de 30 min entre slots, ajustable en el bucle `while` de dicha función.
- **Diferencia de Días:** PHP usa `0=Dom` y Python `0=Lun`. El código en `public.py` ya hace la conversión `(fecha.weekday() + 1) % 7` para ser compatible con el esquema de base de datos original.

### Patrones de Implementación
- **Seguridad:** Se usa `Flask-Login` para proteger el Blueprint `admin`. Las contraseñas se gestionan con `Werkzeug.security` (scrypt).
- **Frontend:** Estilos basados en variables CSS de la marca (dorados/negros). Los formularios usan validación nativa de HTML5 + lógica en Python.
- **Emails:** El servicio en `app/services/resend_mail.py` procesa el template `templates/emails/confirmacion.html` inyectando variables dinámicas de la configuración global.

### 🚩 Roadmap / Tareas Pendientes
1.  **Edición de "Quiénes Somos":** El Blueprint `admin` ya tiene la ruta `/about`, falta crear el template y la lógica para guardar en la tabla `configuracion`.
2.  **Dashboard Extendido:** El dashboard actual muestra turnos de hoy; se podría añadir una vista de calendario o historial.
3.  **Logs de WhatsApp:** Añadir registro en base de datos de si el mensaje de Evolution API se envió con éxito o falló.

---
*Nota: Este proyecto fue migrado quirúrgicamente de PHP. Evitar reintroducir lógica de archivos `.php` o configuraciones de Apache `.htaccess`.*

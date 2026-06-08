# UP! Estudio - Sistema de Gestión de Turnos

## 📝 Descripción
**UP! Estudio Turnero** es una plataforma integral de gestión de reservas diseñada específicamente para estudios de estética y belleza. La aplicación permite a los clientes reservar turnos de manera autónoma para servicios de maquillaje y manicuría, mientras que proporciona a los administradores herramientas robustas para la gestión de servicios, clientes y agenda.

## 🏗️ Arquitectura y Tecnologías
La aplicación está construida con un stack moderno enfocado en la velocidad, seguridad y escalabilidad:

- **Frontend:** [Next.js 15+](https://nextjs.org) (App Router) con TypeScript.
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com) con una estética "Premium Black & Gold".
- **Backend-as-a-Service:** [Supabase](https://supabase.com) (PostgreSQL, Auth, RLS).
- **Notificaciones:** [Resend](https://resend.com) para el envío de confirmaciones por correo electrónico.
- **Iconografía:** [Lucide React](https://lucide.dev).

## 🚀 Funcionalidades Clave

### Para Clientes
- **Landing Page Premium:** Presentación elegante de los servicios de Maquillaje y Nails.
- **Reserva Inteligente:** Flujo de reserva en 3 pasos con validación de disponibilidad en tiempo real.
- **Confirmación Automática:** Recepción de detalles del turno vía email inmediatamente después de la reserva.

### Para el Administrador
- **Dashboard de Gestión:** Vista rápida de los próximos turnos y estado de la agenda.
- **Gestión de Servicios (CRUD):** Control total sobre el catálogo de servicios, precios y duraciones.
- **Base de Datos de Clientes:** Registro centralizado de clientes para seguimiento y marketing.
- **Control de Disponibilidad:** Configuración de horarios semanales y bloqueos de fechas específicas (feriados, vacaciones).

## 🛠️ Configuración del Desarrollador

### Requisitos Previos
- Node.js 20 o superior.
- Una cuenta en Supabase y Resend.

### Instalación
1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar las variables de entorno en `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
   RESEND_API_KEY=tu_api_key_de_resend
   ```

### Preparación de la Base de Datos
Ejecuta el script contenido en `supabase/schema.sql` en el SQL Editor de tu proyecto Supabase para crear las tablas y políticas de seguridad (RLS).

### Ejecución
```bash
npm run dev
```

## 🌐 Despliegue
La aplicación está optimizada para ser desplegada en **Vercel**. Simplemente conecta tu repositorio de GitHub y configura las variables de entorno mencionadas anteriormente.

## 📄 Licencia
Este proyecto es privado y propiedad de UP! Estudio.


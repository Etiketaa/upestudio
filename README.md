# UP! Estudio - Turnero

Sistema de gestión de reservas para el estudio de estética UP! Estudio. Los clientes reservan turnos de maquillaje y manicuría online, y los administradores gestionan servicios, clientes y agenda desde un panel.

## Tecnologías

- [Next.js 15+](https://nextjs.org) (App Router) con TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [Supabase](https://supabase.com) (PostgreSQL, Auth, RLS)
- [Resend](https://resend.com) para emails de confirmación
- [Lucide React](https://lucide.dev) para iconografía

## Funcionalidades

### Clientes
- Landing con presentación de servicios de Maquillaje y Nails.
- Reserva en 3 pasos con control de disponibilidad en tiempo real.
- Confirmación por email al reservar.

### Administrador
- Panel con turnos próximos y estado de agenda.
- ABM de servicios, precios y duraciones.
- Base de clientes para seguimiento.
- Configuración de horarios semanales y bloqueos de fechas.

## Configuración

### Requisitos
- Node.js 20+
- Cuenta en Supabase y Resend

### Instalación
1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno en `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
   RESEND_API_KEY=tu_api_key_de_resend
   ```

### Base de datos
Ejecutá el script de `supabase/schema.sql` en el SQL Editor de Supabase para crear las tablas y políticas RLS.

### Desarrollo
```bash
npm run dev
```

## Despliegue
La app se despliega en Vercel. Conectá el repositorio de GitHub y configurá las variables de entorno.

## Licencia
Proyecto privado de UP! Estudio.


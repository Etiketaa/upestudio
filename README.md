# UP! Estudio - Sistema de Reservas

Este proyecto es una aplicación moderna de gestión de turnos para **UP! Estudio**, especializada en maquillaje y nails. Construida con **Next.js 14**, **Supabase** y **Resend**.

## 🚀 Tecnologías
- **Frontend:** Next.js (App Router), Tailwind CSS (v4), Lucide React.
- **Backend/Database:** Supabase (PostgreSQL, Auth, Storage).
- **Notificaciones:** Resend (Email).
- **Estilo:** Premium (Black & Gold).

## 🛠️ Configuración Inicial

### 1. Base de Datos (Supabase)
1. Crea un proyecto en [Supabase](https://supabase.com).
2. Ve al **SQL Editor** y ejecuta el contenido del archivo `supabase/schema.sql`. Esto creará las tablas de servicios, clientes, turnos y las políticas de seguridad (RLS).

### 2. Variables de Entorno
Crea un archivo `.env.local` basado en `.env.example` y completa las siguientes claves:
- `NEXT_PUBLIC_SUPABASE_URL`: URL de tu proyecto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon key de Supabase.
- `RESEND_API_KEY`: API Key de Resend.

### 3. Ejecución Local
```bash
npm install
npm run dev
```

## 📋 Estructura del Proyecto
- `/src/app`: Rutas de la aplicación (Landing, Booking, Admin).
- `/src/app/admin`: Panel de administración (Dashboard, Servicios, Clientes).
- `/src/lib`: Utilidades, cliente de Supabase y lógica de emails.
- `/supabase`: Scripts SQL para la base de datos.

## 🌟 Funcionalidades
- **Landing Page:** Diseño elegante con separación de rubros (Maquillaje y Nails).
- **Reserva Online:** Flujo de 3 pasos con selección dinámica de slots.
- **Base de Clientes:** Registro automático de clientes al reservar para marketing futuro.
- **Panel Admin:** Gestión de servicios (CRUD), vista de próximos turnos y lista de clientes.
- **Emails:** Confirmación automática vía Resend.

## 🚀 Despliegue en Vercel
1. Sube el código a un repositorio de GitHub.
2. Conecta el repo en Vercel.
3. Agrega las variables de entorno en la configuración de Vercel.
4. ¡Listo!

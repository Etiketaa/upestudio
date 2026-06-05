# UP! Estudio — Turnero

Sistema de reservas online para **UP! Estudio** (Bahía Blanca).
Pensado para un único profesional, sin empleados, listo para subir a
hosting gratuito (InfinityFree o similar).

---

## Estructura del proyecto

```
turnero/
├── index.php                  ← Landing + formulario de reserva
├── .htaccess                  ← Configuración de Apache
├── debug.php                  ← Página de diagnóstico (borrar después)
├── admin/                     ← Panel de administración
│   ├── index.php              ← Login
│   ├── dashboard.php
│   ├── appointments.php
│   ├── servicios.php
│   ├── horarios.php
│   ├── about.php              ← Edita "Quienés Somos" + contacto
│   └── logout.php
├── config/
│   ├── config.php             ← ⬅️ EDITAR con tus credenciales
│   ├── database.php
│   └── mail.php
├── includes/                  ← Librería PHP (no tocar)
│   ├── functions.php
│   ├── header.php
│   └── footer.php
├── assets/
│   ├── css/style.css
│   ├── js/script.js
│   └── email/                 ← Template del email de confirmación
└── sql/
    └── schema.sql             ← Importar en MySQL
```

---

## Deploy paso a paso en InfinityFree

### 1. Crear cuenta y dominio

1. Ir a <https://www.infinityfree.net> y registrarte.
2. Crear una nueva cuenta de hosting (free). Te asigna un subdominio
   del estilo `tunombre.infinityfreeapp.com` o un dominio propio
   si lo apuntás.
3. Anotar:
   - **URL del sitio**
   - Datos de **MySQL** que te muestra el panel (ver paso 2)

### 2. Crear la base de datos

1. En el panel de InfinityFree, ir a **"MySQL Databases"**.
2. Click en **"Create New Database"**. Te va a generar:
   - Database name: `epiz_XXXXXXX_turnero` (o el nombre que elijas)
   - Username: `epiz_XXXXXXX`
   - Password: la que pongas
   - Hostname: `sqlXXX.infinityfree.com`
3. **Anotar todos esos datos**, los vas a necesitar en el paso 4.

### 3. Subir los archivos vía FTP o File Manager

**Opción A — File Manager (más fácil):**
1. En el panel de InfinityFree, abrir **"File Manager"** o **"Control Panel" → "File Manager"**.
2. Navegar a la carpeta `htdocs/` (es la raíz pública del sitio).
3. **Borrar** el `index.html` por defecto que pone InfinityFree.
4. Subir TODO el contenido de esta carpeta (`turnero/`) dentro de `htdocs/`.
   Es decir: el `index.php`, la carpeta `admin/`, `config/`, `includes/`,
   `assets/`, `sql/`, y el `.htaccess` tienen que quedar en la raíz
   de `htdocs/`.

**Opción B — FTP (recomendado para subir todo de una):**
1. En el panel, ir a **"FTP Accounts"** y crear una cuenta (o usar
   la que viene por defecto).
2. Conectarte con FileZilla o similar:
   - Host: el que te da InfinityFree (ej. `ftpupload.net`)
   - Usuario / contraseña: los de la cuenta FTP
   - Puerto: 21
3. Subir todo el contenido de `turnero/` a `htdocs/`.

> ⚠️  **Importante:** que el `.htaccess` también se suba. En FileZilla
> activá "Mostrar archivos ocultos" para que se vea, porque los
> archivos que empiezan con punto están ocultos.

### 4. Editar `config/config.php`

Abrir el archivo `config/config.php` que ya subiste (podés usar el
File Manager de InfinityFree, click derecho → Edit) y completar:

```php
$DB_HOST     = 'sqlXXX.infinityfree.com';   // el que te dio InfinityFree
$DB_NAME     = 'epiz_XXXXXXX_turnero';       // nombre completo de la BD
$DB_USER     = 'epiz_XXXXXXX';
$DB_PASSWORD = 'la-password-que-pusiste';

$RESEND_API_KEY = 're_xxxxxxxxxxxxxxxxxxxxxx';
$RESEND_FROM    = 'UP! Estudio <onboarding@resend.dev>';
```

> 🔒  El `.htaccess` de la carpeta `config/` ya bloquea el acceso web
> a este archivo, pero igual: **no lo subas a GitHub** ni lo compartas.

### 5. Importar el schema SQL

1. En el panel de InfinityFree, abrir **"phpMyAdmin"** (lo encontrás
   dentro de MySQL Databases).
2. Seleccionar tu base de datos en el panel izquierdo.
3. Ir a la pestaña **"Import"** (o "Importar").
4. Click en "Elegir archivo" y seleccionar `sql/schema.sql` de este
   proyecto.
5. Click en **"Continuar"** / **"Go"**.
6. Deberían aparecer las tablas: `usuarios`, `servicios`, `horarios`,
   `configuracion`, `turnos`.

### 6. Configurar Resend (envío de email)

1. Ir a <https://resend.com> y crear una cuenta gratis
   (te deja enviar 100 mails por día y 3000 por mes, sin tarjeta).
2. Una vez logueado, ir a **"API Keys"** → **"Create API Key"**.
   Darle un nombre (ej. "UP Estudio Produccion") y permisos de
   "Sending access". Copiar la key (empieza con `re_`).
3. Pegarla en `config/config.php` en la variable `$RESEND_API_KEY`.
4. **Sobre el `FROM`:** por defecto usa `onboarding@resend.dev` que
   es un sandbox de Resend. Tiene estas limitaciones:
   - Solo podés enviar mails **al mismo email con el que te
     registraste en Resend**, hasta que verifiques tu propio dominio.
   - Para producción real, andá a **"Domains"** en Resend, agregá
     tu dominio (ej. `upestudio.com.ar`) y seguí las instrucciones
     DNS. Después cambiá `$RESEND_FROM` por algo como:
     `UP! Estudio <turnos@upestudio.com.ar>`.

### 7. Probar

1. Abrir tu sitio en el navegador: `https://tunombre.infinityfreeapp.com/`
2. Tendrías que ver la landing.
3. Probar reservar un turno.
4. Entrar al admin: `https://tunombre.infinityfreeapp.com/admin/`
   - Usuario: `admin`
   - Contraseña: `admin123`
5. **Cambiar la contraseña del admin inmediatamente** (editando el
   hash bcrypt en la BD con phpMyAdmin, o agregando una pantalla de
   "cambiar contraseña" en el admin).

### 8. Personalizar contenido

Desde el panel admin:

- **Quienés Somos** (`/admin/about.php`): editá título, texto,
  imagen, WhatsApp, Instagram, dirección y horarios.
- **Servicios** (`/admin/servicios.php`): agregá, editá o quitá
  servicios, duraciones y precios.
- **Horarios** (`/admin/horarios.php`): definí en qué horarios
  tu señora atiende cada día.

### 9. Borrar el debug.php

Una vez que todo funcione, **borrá `debug.php` del servidor**.
No es necesario para el funcionamiento y queda abierto a cualquiera
que sepa la URL.

---

## Cambiar la contraseña del admin

1. En tu PC, ejecutá:
   ```bash
   php -r "echo password_hash('TU_NUEVA_CONTRASEÑA', PASSWORD_BCRYPT);"
   ```
2. En phpMyAdmin, ir a la tabla `usuarios`.
3. Click en "Edit" en la fila del admin.
4. Pegar el hash nuevo en la columna `password`.
5. Guardar.

---

## Problemas frecuentes

### Pantalla en blanco / Error 500

- Abrí `https://tunombre.infinityfreeapp.com/debug.php` y mirá qué
  dice. Lo más probable es que falte completar alguna variable en
  `config/config.php` (el debug te marca con ⚠️ cuál está vacía).

### No llegan los emails

- Verificá que la API key de Resend esté bien copiada (sin espacios).
- Mirá los logs en <https://resend.com/logs> para ver el error exacto.
- Si usás `onboarding@resend.dev` como FROM, el mail solo puede
  llegar al email con el que te registraste en Resend.

### "display_errors" / warnings molestos

InfinityFree suele mostrar los warnings de PHP en pantalla. Para
apagarlos, agregá al inicio de `config/config.php`:

```php
ini_set('display_errors', 0);
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
```

### Límite de inactividad (free hosting)

InfinityFree mata procesos PHP después de ~30 segundos. La
generación de slots es liviana, no debería haber problemas.
Si llegara a haberlos, abrí un ticket de soporte.

---

## Estructura del schema

- `usuarios` — un solo usuario admin
- `servicios` — los servicios que ofrece el estudio
- `horarios` — franjas horarias por día de la semana
- `turnos` — cada reserva hecha por un cliente
- `configuracion` — pares clave/valor editables desde el admin
  (`about_title`, `about_text`, `about_img`, `contact_whatsapp`,
  `contact_instagram`, `contact_direccion`, `contact_horarios`)

---

## Licencia

Proyecto privado para UP! Estudio. Hecho con PHP + MySQL + Resend.

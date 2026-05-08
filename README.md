# Subground Agency — MVC Web App

Booking agency · España. We don't book DJs. We build nights. Techno · House · Hard Techno · Urbano · booking@subgroundagency.com

Base del proyecto reorganizada para trabajar con arquitectura MVC profesional en Node.js + Express.

## Estructura

- `app/controllers`: controladores HTTP
- `app/models`: modelos de dominio/datos
- `app/routes`: definicion de rutas
- `app/views/pages`: vistas HTML actuales
- `public`: recursos publicos (favicon, assets, etc.)
- `server.js`: punto de arranque

## Arranque local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Iniciar en desarrollo:

   ```bash
   npm run dev
   ```

3. Iniciar en produccion:

   ```bash
   npm start
   ```

Copia `.env.example` a `.env` y configura SMTP para el formulario de contacto.

## Rutas iniciales

- `/` → home
- `/artists/f3ly` → perfil del artista F3LY

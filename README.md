# Subground Agency - MVC Web App

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
   - `npm install`
2. Iniciar en desarrollo:
   - `npm run dev`
3. Iniciar en produccion:
   - `npm start`

## Rutas iniciales

- `/` -> home
- `/artists/f3ly` -> perfil del artista F3LY

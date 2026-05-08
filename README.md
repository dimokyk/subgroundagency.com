# Subground Agency — Web

Booking agency · España. We don't book DJs. We build nights. Techno · House · Hard Techno · Urbano · booking@subgroundagency.com

## Qué tienes aquí

- **`index.html`**, **`f3ly.html`** y **`favicon.ico` en la raíz del repo**: es lo que muestra **GitHub Pages** (sitio público igual que antes, estático).
- **Express + `npm run dev`**: si quieres previsualizar en local con servidor propio sirve los mismos HTML de la raíz (no ejecuta SMTP).
- **Formulario de contacto**: envío con **FormSubmit** al correo `booking@subgroundagency.com` (no hace falta Node en GitHub).

### Primera vez con FormSubmit

La primera vez que alguien envía el formulario, puede llegar un **correo de activación** a `booking@subgroundagency.com`; hay que confirmarlo para activar los envíos.

Para cambiar la web de vuelta tras enviar:

- El formulario lleva **`_next`** apuntando a `https://subgroundagency.com/#contact`. Si usas otro dominio o subdominio, edita ese valor dentro de **`index.html`**.

### GitHub Pages + dominio (Squarespace)

1. Repo → **Settings** → **Pages** → Source **main** branch, carpeta **`/` (root)**.
2. El archivo **`CNAME`** debe contener `subgroundagency.com` (ya está en el repo si lo subiste así).
3. En **DNS de Squarespace** (o donde gestiones el dominio), apunta a GitHub Pages según [la ayuda oficial de dominios personalizados](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site).

### Arranque local (opcional)

```bash
npm install
npm run dev
```

Abre http://localhost:3000 El formulario igual hará POST a FormSubmit desde local (debe estar activado en FormSubmit).

## Estructura de carpetas útil

- `app/controllers`, `app/routes`, `server.js`: servidor Express opcional para desarrollo/preview.
- `public`: recursos estáticos opcionales (Express los sirve bajo `/`).

## ES — Resumen breve (versión en español)

- Frontend: aplicación React + Vite en `src/` (entrada: `main.jsx`). Servidor de desarrollo: Vite en http://localhost:5173. Usa `npm run dev` o el helper PowerShell `start_frontend.ps1` que instala dependencias y crea `.env.local` si falta.
- Backend: API Django REST en `c:/proyectos/tienda_repuestos` (entrada: `manage.py`, ajustes en `config/settings.py`). Usa `start_backend.ps1` para instalar dependencias, aplicar migraciones y arrancar en http://localhost:8000.

### Arquitectura (por qué y cómo)

- Dos procesos: frontend SPA (React) y backend API (Django REST). Comunicación por HTTP/JSON. La base de la API la lee el frontend desde la variable Vite `VITE_API_URL` (ver `src/apiConfig.js`).
- Autenticación: token almacenado en `localStorage` bajo la clave `authToken`. Las peticiones autenticadas usan el header `Authorization: Token <token>` (ver `src/context/AuthContext.jsx`).

### Flujos y comandos concretos

- Frontend (PowerShell):
  - `.\tienda-frontend\start_frontend.ps1 [-SkipInstall] [-ApiUrl 'http://host:8000/api']` — instala (si falta) y arranca Vite.
  - NPM: `npm run dev`, `npm run build`, `npm run lint`.
- Backend (PowerShell):
  - `.\tienda_repuestos\start_backend.ps1 [-SkipInstall]` — instala requirements, `migrate`, y `runserver`.
  - Manual: dentro de `tienda_repuestos` usar el venv y ejecutar `python -m pip install -r requirements.txt`, `python manage.py migrate`, `python manage.py runserver`.

### Convenciones y patrones clave

- Variables de entorno: `VITE_API_URL` (frontend). `src/apiConfig.js` exporta `API_URL` y `SERVER_BASE_URL` (usa `API_URL` en todos los fetch).
- Endpoints de autenticación (consumidos por el frontend): `/auth/login/`, `/auth/registration/`, `/auth/user/`.
- Estructura de usuario esperada: `user.perfil` contiene campos como `debe_cambiar_password` — muchos componentes dependen de esa forma (`PasswordChangeBanner.jsx`, `AuthContext`).
- Mensajes de UI: `react-hot-toast` es la convención para notificaciones.

### Archivos importantes (revisar antes de cambiar comportamiento)

- Frontend: `src/apiConfig.js`, `src/context/AuthContext.jsx`, `src/context/CarritoContext.jsx`, `src/components/*`, `src/pages/*`.
- Backend: `tienda_repuestos/inventario/{models.py,serializers.py,views.py,urls.py}`, `config/settings.py`, `requirements.txt`.

### Puntos frecuentes de fallo y tips rápidos

- CORS / orígenes: `vite.config.js` permite `.trycloudflare.com`; el backend debe permitir `http://localhost:5173` (revisar `CORS_ALLOWED_ORIGINS` en `.env`).
- `.env.local` es local y puede sobrescribirse por `start_frontend.ps1` — no lo comitees.
- Cuando modifiques payloads/API shapes: actualiza `src/context/AuthContext.jsx` y busca todos los `fetch(`${API_URL}`)`.

---

### Checklist de cambios directo a main (sin staging)

- Desarrollo local:
  - Backend: usa DB local (`tienda_repuestos_db`) y corre migraciones localmente antes de subir cambios.
  - Frontend: ejecuta `./start_frontend.ps1 -ApiUrl 'http://localhost:8000/api'` y valida login, listado de productos y creación/edición de producto.
- Antes de hacer push a main:
  - Respalda la DB de producción con `pg_dump` (conexión Render, SSL requerido). Conserva al menos 2 dumps recientes.
  - Si hay migraciones: asegúrate de que corren bien en local; planifica si el cambio no es retro-compatible.
  - Revisa CORS/ENV: `CORS_ALLOWED_ORIGINS` debe incluir `https://solomotor3k.com` y `VITE_API_URL` de prod debe apuntar a la API de prod.
  - Build local del frontend: `npm run build` (opcional para detectar errores obvios de compilación).
  - Verifica que no se commitea `.env.local` ni credenciales.
- Deploy (producción):
  - Hace push a `main` (Render desplegará si está configurado con esa rama).
  - Ejecuta migraciones en prod: `python manage.py migrate` (desde el servicio de Render o shell) y observa logs.
  - Smoke tests en prod: login, `/auth/user/`, lista de `productos`, crear/editar producto; si hay media, sube una imagen de prueba.
- Rollback:
  - Si algo falla: usa el dump más reciente para restaurar, y vuelve al despliegue anterior en Render o revierte el commit en `main`.

### DB local (atajos útiles)

- Crear dump desde Render (PostgreSQL 17):
  - Con `pg_dump` y SSL activando `PGSSLMODE=require`. Formato recomendado: `-F c`.
- Restaurar en local:
  - Crear DB `tienda_repuestos_db` y usar `pg_restore --clean --no-owner --no-privileges`. Ajusta `DATABASE_URL=postgres://postgres:<pass>@localhost:5432/tienda_repuestos_db` en `tienda_repuestos/.env`.
- Imágenes (media):
  - Puedes trabajar sin media al principio. Para ver imágenes, copia un subconjunto a `tienda_repuestos/media`.

## EN — Short reference (English)

- Frontend: React + Vite app in `src/` (entry `main.jsx`). Dev server: Vite at http://localhost:5173. Use `npm run dev` or the PowerShell helper `start_frontend.ps1` which installs deps and creates `.env.local` if missing.
- Backend: Django REST API in `c:/proyectos/tienda_repuestos` (entry `manage.py`, settings in `config/settings.py`). Use `start_backend.ps1` to install deps, run migrations and launch dev server at http://localhost:8000.

### Architecture (what matters)

- Two-process architecture: React SPA (frontend) talks to Django REST (backend) via HTTP/JSON. Frontend reads the API base from Vite env `VITE_API_URL` (`src/apiConfig.js`).
- Token auth: frontend stores token in `localStorage` under `authToken` and uses header `Authorization: Token <token>` (see `src/context/AuthContext.jsx`).

### Concrete workflows / commands

- Frontend (PowerShell):
  - `.\tienda-frontend\start_frontend.ps1 [-SkipInstall] [-ApiUrl 'http://host:8000/api']` — installs (if missing) and runs Vite.
  - NPM scripts: `npm run dev`, `npm run build`, `npm run lint`.
- Backend (PowerShell):
  - `.\tienda_repuestos\start_backend.ps1 [-SkipInstall]` — installs requirements, runs `migrate`, and `runserver`.

### Conventions to follow

- Env / API URL: use `VITE_API_URL` in `src/apiConfig.js`. Prefer `API_URL` constant for fetch calls.
- Auth endpoints used by frontend: `/auth/login/`, `/auth/registration/`, `/auth/user/`.
- Keep notifications consistent using `react-hot-toast` and keep the `user.perfil` shape intact when creating test fixtures.

### Quick checks before changing APIs

- Update `src/context/AuthContext.jsx` and search for `API_URL` usages.
- Ensure token header format remains `Authorization: Token <token>`.

---

Si quieres, traduzco más secciones específicas o añado una checklist de PR para cambios de API (p.ej. archivos a actualizar y pruebas básicas). ¿Lo añado ahora?

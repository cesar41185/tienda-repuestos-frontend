# Tienda de Repuestos - Frontend

Aplicación React + Vite para la gestión de una tienda de repuestos automotrices.

## Características

- Catálogo de productos con filtros avanzados
- Carrito de compras
- Gestión de clientes
- Gestión de pedidos
- Perfiles de usuario con diferentes roles
- Diseño responsive para móvil y desktop

## Tecnologías

- React 19
- Vite 7
- React Router DOM
- React Hot Toast

## Desarrollo Local

```bash
npm install
npm run dev
```

### Trabajando con backend local (Django)

Este frontend consume una API definida por `VITE_API_URL` (ver `src/apiConfig.js`). Para desarrollo local, ya incluimos un `.env.local` con:

```
VITE_API_URL=http://localhost:8000/api
```

Si corres el backend local en `http://localhost:8000`, el frontend se conectará sin problemas.

Pasos sugeridos para levantar todo localmente:

1) Backend (desde `c:\proyectos\tienda_repuestos`):

```powershell
# Instalar dependencias
./ven/Scripts/python.exe -m pip install -r requirements.txt

# Migraciones
./ven/Scripts/python.exe manage.py migrate

# Iniciar servidor
./ven/Scripts/python.exe manage.py runserver 0.0.0.0:8000
```

2) Frontend (desde `c:\proyectos\tienda-frontend`):

```powershell
npm install
npm run dev
```

### Tareas de VS Code

Se agregó `.vscode/tasks.json` en el workspace con estas tareas:

- Backend: Django runserver
- Frontend: Vite dev
- Start: Frontend + Backend (lanza ambos)

Ejecuta: Command Palette → "Tasks: Run Task" → elige una.

### Scripts de conveniencia (PowerShell)

En la raíz de cada proyecto hay scripts opcionales para facilitar el arranque:

- `c:\proyectos\tienda_repuestos\start_backend.ps1`
- `c:\proyectos\tienda-frontend\start_frontend.ps1`

Uso:

```powershell
# Backend
cd c:\proyectos\tienda_repuestos
./start_backend.ps1

# Frontend
cd c:\proyectos\tienda-frontend
./start_frontend.ps1
```

Nota: si es la primera vez, los scripts instalarán dependencias (npm/pip) si detectan que faltan.

### Modo rápido (todo en paralelo)

También puedes usar la tarea compuesta desde VS Code para evitar abrir dos terminales: `Start: Frontend + Backend`.

Si prefieres observar los logs por separado, ejecuta cada script en su propia terminal PowerShell.

## Acceso en Red Local (LAN)

Para que otras PCs en tu red accedan al frontend y backend usando tu IP (ej. `192.168.1.55`):

### Script unificado

En la carpeta del backend `c:\proyectos\tienda_repuestos` existe `lan_dev.ps1` que levanta ambos servicios:

```powershell
cd C:\proyectos\tienda_repuestos
./lan_dev.ps1 -DetectLanIP
```

IMPORTANTE: Debes escribir `./lan_dev.ps1` (o `.\`). No uses el texto con corchetes `[lan_dev.ps1]` que aparece a veces como enlace; eso causa errores de parseo.

### Qué hace
- Backend: Django en `http://TU_IP:8000` con flags de desarrollo (DEBUG, CORS y ALLOWED_HOSTS abiertos solo en local).
- Frontend: Vite en `http://TU_IP:5173` apuntando a `VITE_API_URL=http://TU_IP:8000/api`.

### Flags automáticos
- `DEBUG=True`
- `DEV_HOSTS_ALL=1` → `ALLOWED_HOSTS=['*']` (solo en debug)
- `DEV_CORS_ALL=1` → permite cualquier origen (solo en debug)

Puedes desactivar esta apertura editando `start_backend.ps1` y quitando el parámetro `-Dev` si deseas restringir hosts/orígenes.

### Problemas comunes

| Problema | Causa | Solución |
|----------|-------|----------|
| CORS bloqueado | No se agregaron flags debug o IP en origen | Usa el script con `-Dev` (implícito en lan_dev) o añade `DEV_LAN_FRONTEND=IP:PORT` manualmente. |
| `DisallowedHost` | Tu IP no está en ALLOWED_HOSTS | Asegura `DEV_HOSTS_ALL=1` o añade IP a `APP_HOSTS`. |
| Base de datos vacía | DB sin migraciones o datos | Ejecuta `./db_local.ps1 -Migrate -Superuser` y (opcional) importación de datos. |
| Contraseña con caracteres especiales | URL mal formateada | En `.env` usa % encoding (ej: `*` → `%2A`) en `DATABASE_URL`. |
| Comando no ejecuta | Se usó `[lan_dev.ps1]` | Invoca `./lan_dev.ps1` directamente. |

### Verificación
1. Otra PC abre `http://TU_IP:5173`.
2. Revisa consola del navegador: no deben aparecer errores CORS.
3. Prueba llamada a `http://TU_IP:8000/api/marcas/` (network tab) → Debe devolver 200.

### Seguridad
Estas opciones (ALLOW ALL HOSTS / CORS ALL) son SOLO para desarrollo interno. No usar en producción.

## Base de Datos Local Rápida

Script utilitario: `c:\proyectos\tienda_repuestos\db_local.ps1`

Ejemplos:

```powershell
# Migraciones + superusuario
./db_local.ps1 -Migrate -Superuser

# Reset completo
./db_local.ps1 -Reset
```

Si necesitas importar válvulas (si existe comando personalizado):
```powershell
./db_local.ps1 -ImportValvulas
```

## Nota Final
Para volver a modo “solo localhost” cierra las ventanas y usa los scripts individuales sin `-DetectLanIP`.

## Build para Producción

```bash
npm run build
```

El output se genera en la carpeta `dist/`.

## Despliegue en Cloudflare Pages

Este proyecto está configurado para funcionar correctamente en Cloudflare Pages:

### Archivos de Configuración

- **`public/_redirects`**: Maneja las redirecciones para el SPA (Single Page Application)
  - Redirige todas las rutas a `index.html` con código 200
  - Necesario para que las rutas de React funcionen correctamente al recargar la página

- **`public/_routes.json`**: Define qué rutas deben ser manejadas por Cloudflare Pages Functions
  - Incluye todas las rutas (`/*`)
  - Excluye archivos estáticos y recursos

### Configuración del Proyecto en Cloudflare

1. **Build command**: `npm run build`
2. **Build output directory**: `dist`
3. **Root directory**: `/` (raíz del proyecto)

### Problemas Comunes

**Problema**: Al recargar una ruta específica (ej: `/clientes`), aparece un error 404.

**Solución**: Verifica que `public/_redirects` contenga:
```
/*    /index.html   200
```

**Problema**: Los clientes desaparecen en resolución móvil.

**Solución**: Esto puede ser un problema de permisos. Verifica que el usuario tenga los roles correctos (`Administrador` o `Vendedor`).

## Estructura de Carpetas

```
src/
├── components/      # Componentes reutilizables
│   ├── Header.jsx
│   ├── TablaResultados.jsx
│   ├── ModalDetalleCliente.jsx
│   └── ...
├── pages/           # Páginas de la aplicación
│   ├── TiendaPage.jsx
│   ├── ListaClientesPage.jsx
│   └── ...
├── context/         # Contextos de React
│   ├── AuthContext.jsx
│   └── CarritoContext.jsx
├── App.jsx          # Componente principal
├── main.jsx         # Punto de entrada
└── index.css        # Estilos globales
```

## Variables de Entorno

Crea un archivo `.env.local` con:

```
VITE_API_URL=https://tu-api-backend.com
```

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Compila para producción
- `npm run preview`: Previsualiza el build de producción
- `npm run lint`: Ejecuta el linter

## Licencia

Privado - SoloMotor3K

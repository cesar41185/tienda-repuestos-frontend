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

// En: src/apiConfig.js

// 1. Lee la variable de entorno del archivo .env.local
const API_URL = import.meta.env.VITE_API_URL;

// 2. Exporta la variable para que otros archivos puedan usarla.
export default API_URL;

export const JUEGO_UNIDADES = 8; // Define el tamaño del juego de válvulas
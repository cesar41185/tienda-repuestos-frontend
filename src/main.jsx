import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'; // Soporte dual según entorno
import { CarritoProvider } from './context/CarritoContext';
import { AuthProvider } from './context/AuthContext';
import './index.css'
import App from './App.jsx'

// Usa HashRouter si el hosting no soporta rewrites a index.html
const RouterComponent = import.meta.env.VITE_USE_HASH_ROUTER === 'true' ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterComponent>
      <AuthProvider>
        <CarritoProvider>
          <App />
        </CarritoProvider>
      </AuthProvider>
    </RouterComponent>
  </StrictMode>,
);

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'; // <-- 1. Importa el Router
import { CarritoProvider } from './context/CarritoContext';
import { AuthProvider } from './context/AuthContext';
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 3. Envuelve tu App con estos dos componentes */}
    <BrowserRouter>
      <AuthProvider>
        <CarritoProvider>
          <App />
        </CarritoProvider>
      </AuthProvider>  
    </BrowserRouter>
  </StrictMode>,
);  

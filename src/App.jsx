// En src/App.jsx
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';


// Componentes que actuarán como páginas
import Header from './components/Header';
import TiendaPage from './pages/TiendaPage'; // <-- Página principal (la crearemos ahora)
import CarritoPage from './pages/CarritoPage'; // <-- Página del carrito (la crearemos ahora)
import ProductoPage from './pages/ProductoPage';
import LoginPage from './pages/LoginPage'; // <-- Importa
import RegisterPage from './pages/RegisterPage'; // <-- Importa

function App() {
  return (
    <div className="app-container">
      <Toaster position="top-right" />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<TiendaPage />} />
          <Route path="/carrito" element={<CarritoPage />} />
          <Route path="/valvula/:id" element={<ProductoPage />} />
          <Route path="/login" element={<LoginPage />} /> {/* <-- Añade */}
          <Route path="/registro" element={<RegisterPage />} /> {/* <-- Añade */}
        </Routes>
      </main>
    </div>
  );
}

export default App;
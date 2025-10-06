// En src/components/Header.jsx
import { Link } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { carrito } = useCarrito();
  const { token, logoutUser } = useAuth();
  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <header className="app-header">
      {/* Grupo Izquierdo: Logo y Título */}
      <div className="header-brand">
        <Link to="/">
          <img src="/logo.png" alt="Logo de la tienda" className="logo" />
        </Link>
        <h1>Verificador de Válvulas</h1>
      </div>

      {/* Grupo Derecho: Navegación y Acciones */}
      <nav className="header-nav">
        <Link to="/carrito" className="nav-link cart-link">
          🛒 Carrito ({totalItems})
        </Link>
        
        {token ? (
          <button onClick={logoutUser} className="nav-button">Cerrar Sesión</button>
        ) : (
          <>
            <Link to="/login" className="nav-link">Iniciar Sesión</Link>
            <Link to="/registro" className="nav-button register-btn">Registrarse</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;
// Código completo para Header.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { carrito, clienteActivo, limpiarCliente } = useCarrito();
  const { token, user, logoutUser } = useAuth();
  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const menuUsuarioRef = useRef(null);

  const esCliente = user && user.groups.length === 0;
  const esPersonal = user && user.groups.length > 0; // 'esPersonal' es el equivalente a 'isStaff'
  const esAdmin = user && user.groups.includes('Administrador');
  const esVendedor = user && user.groups.includes('Vendedor');
  
  // Obtener nombre del usuario
  const nombreUsuario = user?.perfil?.nombre_completo || user?.username || '';

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuUsuarioRef.current && !menuUsuarioRef.current.contains(event.target)) {
        setMenuUsuarioAbierto(false);
      }
    };

    if (menuUsuarioAbierto) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuUsuarioAbierto]);

  return (
    <>
      {clienteActivo && (
        <div style={{backgroundColor: '#007bff', color: 'white', textAlign: 'center', padding: '5px'}}>
          Atendiendo a: <strong>{clienteActivo.perfil.nombre_completo}</strong>
          <button onClick={limpiarCliente} style={{marginLeft: '15px', border: 'none', background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: 'bold'}}>X</button>
        </div>
      )}
    <header className="app-header">
      <div className="header-brand">
        <Link to="/">
          <img src="/logo.png" alt="Logo de la tienda" className="logo" />
        </Link>
        <h1>Verificador de Válvulas</h1>
      </div>

      <div className="header-user-section">
        {user && (
          <>
            <span className="welcome-message">Bienvenido, {nombreUsuario}</span>
            <div className="menu-usuario-container" ref={menuUsuarioRef}>
              <button 
                className="menu-usuario-btn" 
                onClick={() => setMenuUsuarioAbierto(!menuUsuarioAbierto)}
                aria-label="Menu usuario"
              >
                ☰
              </button>
              {menuUsuarioAbierto && (
                <div className="menu-usuario-dropdown">
                  <Link to="/mi-perfil" className="menu-usuario-item" onClick={() => setMenuUsuarioAbierto(false)}>
                    Mi Perfil
                  </Link>
                  {esCliente && (
                    <Link to="/mis-pedidos" className="menu-usuario-item" onClick={() => setMenuUsuarioAbierto(false)}>
                      Mis Pedidos
                    </Link>
                  )}
                  <button onClick={logoutUser} className="menu-usuario-item menu-usuario-logout">
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </>
        )}
        {/* Carrito solo para Clientes y Admin/Cajero en POS */}
        {(esCliente || (esPersonal && clienteActivo) || !token) && (
          <Link to="/carrito" className="nav-link cart-link">🛒 ({totalItems})</Link>
        )}
      </div>

      <button className="menu-hamburger" onClick={() => setMenuAbierto(!menuAbierto)} aria-label="Menu">
        {menuAbierto ? '✕' : '☰'}
      </button>

      <nav className={`header-nav ${menuAbierto ? 'nav-abierto' : ''}`}>
        {/* --- VISTA PARA VISITANTES --- */}
        {!token && (
          <>
            <Link to="/login" className="nav-link">Iniciar Sesión</Link>
            <Link to="/registro" className="nav-button register-btn">Registrarse</Link>
          </>
        )}
        {/* --- VISTA PARA USUARIOS LOGUEADOS --- */}
        {user && (
          <>
            {/* Enlaces de Personal */}
            {esPersonal && (
                <Link to="/gestion-pedidos" className="nav-link">Gestionar Pedidos</Link>
            )}
            {(user.groups.includes('Administrador') || user.groups.includes('Vendedor')) && (
              <Link to="/clientes" className="nav-link">Clientes</Link>
            )}
            {user.groups.includes('Administrador') && (
              <Link to="/gestor-marcas" className="nav-link">Gestionar Marcas</Link>
            )}
          </>
        )}
      </nav>
    </header>
    </>
  );
}
export default Header;
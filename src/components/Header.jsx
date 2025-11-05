// Código completo para Header.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

function Header() {
  const { carrito, clienteActivo, limpiarCliente } = useCarrito();
  const { token, user, logoutUser } = useAuth();
  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef(null);
  const hamburgerRef = useRef(null);

  const esCliente = user && user.groups.length === 0;
  const esPersonal = user && user.groups.length > 0; // 'esPersonal' es el equivalente a 'isStaff'
  const esAdmin = user && user.groups.includes('Administrador');
  const esVendedor = user && user.groups.includes('Vendedor');
  
  // Obtener nombre del usuario
  const nombreUsuario = user?.perfil?.nombre_completo || user?.username || '';

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Si el menú está abierto y el click no fue dentro del menú ni en el botón hamburguesa
      if (menuAbierto && 
          menuRef.current && 
          !menuRef.current.contains(event.target) &&
          hamburgerRef.current &&
          !hamburgerRef.current.contains(event.target)) {
        setMenuAbierto(false);
      }
    };

    // Agregar listener cuando el menú está abierto
    if (menuAbierto) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Limpiar listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuAbierto]);

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

      <div className="header-right">
        {user && (
          <span className="welcome-message">Bienvenido, {nombreUsuario}</span>
        )}
        {user && <NotificationBell />}
        {/* Carrito solo para Clientes y Admin/Cajero en POS - visible en desktop */}
        {(esCliente || (esPersonal && clienteActivo) || !token) && (
          <Link to="/carrito" className="nav-link cart-link desktop-cart">🛒 ({totalItems})</Link>
        )}
        <button 
          ref={hamburgerRef}
          className="menu-hamburger" 
          onClick={() => setMenuAbierto(!menuAbierto)} 
          aria-label="Menu"
        >
          {menuAbierto ? '✕' : '☰'}
        </button>
      </div>

      <nav ref={menuRef} className={`header-nav ${menuAbierto ? 'nav-abierto' : ''}`}>
        {/* --- VISTA PARA VISITANTES --- */}
        {!token && (
          <>
            <Link to="/carrito" className="nav-link cart-link" onClick={() => setMenuAbierto(false)}>🛒 ({totalItems})</Link>
            <Link to="/login" className="nav-link" onClick={() => setMenuAbierto(false)}>Iniciar Sesión</Link>
            <Link to="/registro" className="nav-button register-btn" onClick={() => setMenuAbierto(false)}>Registrarse</Link>
          </>
        )}
        {/* --- VISTA PARA USUARIOS LOGUEADOS --- */}
        {user && (
          <>
            {/* Carrito solo para Clientes y Admin/Cajero en POS */}
            {(esCliente || (esPersonal && clienteActivo)) && (
              <Link to="/carrito" className="nav-link cart-link" onClick={() => setMenuAbierto(false)}>🛒 ({totalItems})</Link>
            )}
            <Link to="/mi-perfil" className="nav-link" onClick={() => setMenuAbierto(false)}>Mi Perfil</Link>
            {/* Mis Pedidos solo para Clientes */}
            {esCliente && (
              <>
                <Link to="/mis-pedidos" className="nav-link" onClick={() => setMenuAbierto(false)}>Mis Pedidos</Link>
                <Link to="/devoluciones" className="nav-link" onClick={() => setMenuAbierto(false)}>Mis Devoluciones</Link>
              </>
            )}
            {/* Enlaces de Personal */}
            {esPersonal && (
              <>
                <Link to="/gestion-pedidos" className="nav-link" onClick={() => setMenuAbierto(false)}>Gestionar Pedidos</Link>
                <Link to="/devoluciones" className="nav-link" onClick={() => setMenuAbierto(false)}>Devoluciones</Link>
              </>
            )}
            {user.groups.includes('Administrador') && (
              <Link to="/dashboard" className="nav-link" onClick={() => setMenuAbierto(false)}>Dashboard</Link>
            )}
            {(user.groups.includes('Administrador') || user.groups.includes('Vendedor')) && (
              <>
                <Link to="/clientes" className="nav-link" onClick={() => setMenuAbierto(false)}>Clientes</Link>
                <Link to="/presupuestos" className="nav-link" onClick={() => setMenuAbierto(false)}>Presupuestos</Link>
                <Link to="/comisiones" className="nav-link" onClick={() => setMenuAbierto(false)}>Comisiones</Link>
                <Link to="/interacciones-crm" className="nav-link" onClick={() => setMenuAbierto(false)}>Interacciones</Link>
              </>
            )}
            {user.groups.includes('Administrador') && (
              <Link to="/gestor-marcas" className="nav-link" onClick={() => setMenuAbierto(false)}>Gestionar Marcas</Link>
            )}
            {(user.groups.includes('Administrador') || user.groups.includes('Almacen')) && (
              <>
                <Link to="/movimientos-stock" className="nav-link" onClick={() => setMenuAbierto(false)}>Movimientos Stock</Link>
                <Link to="/conteos-fisicos" className="nav-link" onClick={() => setMenuAbierto(false)}>Conteos Físicos</Link>
              </>
            )}
            <button onClick={() => { setMenuAbierto(false); logoutUser(); }} className="nav-button">Cerrar Sesión</button>
          </>
        )}
      </nav>
    </header>
    </>
  );
}
export default Header;
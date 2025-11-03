// Código completo para Header.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

function Header() {
  const { carrito, clienteActivo, limpiarCliente } = useCarrito();
  const { token, user, logoutUser } = useAuth();
  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const esCliente = user && user.groups.length === 0;
  const esPersonal = user && user.groups.length > 0; // 'esPersonal' es el equivalente a 'isStaff'
  const esAdmin = user && user.groups.includes('Administrador');
  const esVendedor = user && user.groups.includes('Vendedor');
  
  // Obtener nombre del usuario
  const nombreUsuario = user?.perfil?.nombre_completo || user?.username || '';

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
        <button className="menu-hamburger" onClick={() => setMenuAbierto(!menuAbierto)} aria-label="Menu">
          {menuAbierto ? '✕' : '☰'}
        </button>
      </div>

      <nav className={`header-nav ${menuAbierto ? 'nav-abierto' : ''}`}>
        {/* --- VISTA PARA VISITANTES --- */}
        {!token && (
          <>
            <Link to="/carrito" className="nav-link cart-link">🛒 ({totalItems})</Link>
            <Link to="/login" className="nav-link">Iniciar Sesión</Link>
            <Link to="/registro" className="nav-button register-btn">Registrarse</Link>
          </>
        )}
        {/* --- VISTA PARA USUARIOS LOGUEADOS --- */}
        {user && (
          <>
            {/* Carrito solo para Clientes y Admin/Cajero en POS */}
            {(esCliente || (esPersonal && clienteActivo)) && (
              <Link to="/carrito" className="nav-link cart-link">🛒 ({totalItems})</Link>
            )}
            <Link to="/mi-perfil" className="nav-link">Mi Perfil</Link>
            {/* Mis Pedidos solo para Clientes */}
            {esCliente && (
              <>
                <Link to="/mis-pedidos" className="nav-link">Mis Pedidos</Link>
                <Link to="/devoluciones" className="nav-link">Mis Devoluciones</Link>
              </>
            )}
            {/* Enlaces de Personal */}
            {esPersonal && (
              <>
                <Link to="/gestion-pedidos" className="nav-link">Gestionar Pedidos</Link>
                <Link to="/devoluciones" className="nav-link">Devoluciones</Link>
              </>
            )}
            {user.groups.includes('Administrador') && (
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
            )}
            {(user.groups.includes('Administrador') || user.groups.includes('Vendedor')) && (
              <>
                <Link to="/clientes" className="nav-link">Clientes</Link>
                <Link to="/presupuestos" className="nav-link">Presupuestos</Link>
                <Link to="/comisiones" className="nav-link">Comisiones</Link>
                <Link to="/interacciones-crm" className="nav-link">Interacciones</Link>
              </>
            )}
            {user.groups.includes('Administrador') && (
              <Link to="/gestor-marcas" className="nav-link">Gestionar Marcas</Link>
            )}
            {(user.groups.includes('Administrador') || user.groups.includes('Almacen')) && (
              <>
                <Link to="/movimientos-stock" className="nav-link">Movimientos Stock</Link>
                <Link to="/conteos-fisicos" className="nav-link">Conteos Físicos</Link>
              </>
            )}
            <button onClick={logoutUser} className="nav-button">Cerrar Sesión</button>
          </>
        )}
      </nav>
    </header>
    </>
  );
}
export default Header;
// En src/pages/HomePage.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function HomePage() {
  const { user } = useAuth();
  
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '4rem 2rem',
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#212529' }}>
        Verificador de Válvulas
      </h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '3rem', color: '#6c757d', maxWidth: '600px' }}>
        Bienvenido al sistema de gestión y consulta de válvulas para motores
      </p>
      
      <Link 
        to="/tienda" 
        style={{
          display: 'inline-block',
          padding: '1rem 3rem',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          backgroundColor: '#ac1b1b',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '8px',
          transition: 'background-color 0.2s',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#8a1616'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#ac1b1b'}
      >
        Ir a la Tienda →
      </Link>

      {user && (
        <div style={{ marginTop: '3rem', padding: '2rem', backgroundColor: '#f8f9fa', borderRadius: '8px', maxWidth: '600px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#212529' }}>
            Bienvenido, {user.perfil?.nombre_completo || user.username}
          </h2>
          <p style={{ color: '#6c757d' }}>
            Accede rápidamente a tus secciones preferidas
          </p>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/mi-perfil" style={{ textDecoration: 'none', color: '#007bff' }}>Mi Perfil</Link>
            {user.groups.length === 0 && (
              <Link to="/mis-pedidos" style={{ textDecoration: 'none', color: '#007bff' }}>Mis Pedidos</Link>
            )}
            {user.groups.includes('Administrador') && (
              <Link to="/dashboard" style={{ textDecoration: 'none', color: '#007bff' }}>Dashboard</Link>
            )}
            {(user.groups.includes('Administrador') || user.groups.includes('Vendedor')) && (
              <>
                <Link to="/gestion-pedidos" style={{ textDecoration: 'none', color: '#007bff' }}>Gestionar Pedidos</Link>
                <Link to="/clientes" style={{ textDecoration: 'none', color: '#007bff' }}>Clientes</Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;


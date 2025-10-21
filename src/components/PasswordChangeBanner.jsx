// En src/components/PasswordChangeBanner.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PasswordChangeBanner() {
  const { user } = useAuth();

  // Si el usuario no ha cargado o no necesita cambiar la contraseña, no mostramos nada.
  if (!user || !user.perfil.debe_cambiar_password) {
    return null;
  }

  const bannerStyle = {
    backgroundColor: '#ffc107', // Un color de advertencia amarillo
    color: '#333',
    textAlign: 'center',
    padding: '10px',
    fontWeight: 'bold',
  };

  const linkStyle = {
    color: '#0056b3',
    textDecoration: 'underline',
    marginLeft: '10px',
  };

  return (
    <div style={bannerStyle}>
      <span>Por tu seguridad, necesitas establecer una nueva contraseña.</span>
      <Link to="/mi-perfil" style={linkStyle}>
        Ir a mi perfil para cambiarla
      </Link>
    </div>
  );
}

export default PasswordChangeBanner;
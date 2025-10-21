// En src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, roles }) {
  const { user, token } = useAuth();
  const location = useLocation();

  // Si no hay token, no está logueado, lo mandamos a la página de login.
  // Guardamos la ubicación a la que intentaba ir para redirigirlo allí después.
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si hay token pero todavía no se ha cargado la info del usuario, mostramos un mensaje.
  // (Esto evita que se redirija antes de saber si tiene permiso o no).
  if (!user) {
    return <div>Verificando permisos...</div>;
  }

  // Comprobamos si el array de roles del usuario tiene alguno de los roles permitidos.
  const tienePermiso = !roles || roles.length === 0 || user.groups.some(rol => roles.includes(rol));

  if (tienePermiso) {
    return children; // Si tiene permiso, mostramos la página solicitada.
  }

  // Si el usuario está logueado pero no tiene el rol correcto, lo mandamos al inicio.
  return <Navigate to="/" replace />;
}

export default ProtectedRoute;
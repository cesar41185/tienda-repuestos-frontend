// En src/pages/LoginPage.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function LoginPage() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const { loginUser } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loginUser(formData);
  };

  return (
    <div className="auth-container">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <label htmlFor="username">Usuario o Correo Electrónico</label>
        <input id="username" type="text" name="username" placeholder="usuario o email@ejemplo.com" onChange={handleChange} required />
        
        <label htmlFor="password">Contraseña</label>
        <input id="password" type="password" name="password" onChange={handleChange} required />
        
        <button type="submit">Entrar</button>
      </form>
      <div className="auth-links">
        <Link to="/registro">¿No tienes una cuenta? Regístrate</Link>
        <Link to="#">¿Olvidaste tu contraseña?</Link> {/* De adorno, como pediste */}
        <Link to="/">Volver a la tienda</Link>
      </div>
    </div>
  );
}
export default LoginPage;
// En src/pages/RegisterPage.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function RegisterPage() {
  const [formData, setFormData] = useState({ email: '', username: '', password1: '', password2: '' });
  const { registerUser } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password1 !== formData.password2) {
      alert('Las contraseñas no coinciden');
      return;
    }
    registerUser(formData);
  };

  return (
    <div className="auth-container">
      <h2>Crear una Cuenta</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <label htmlFor="email">Correo Electrónico</label>
        <input id="email" type="email" name="email" onChange={handleChange} required />
        
        <label htmlFor="username">Nombre de Usuario</label>
        <input id="username" type="text" name="username" onChange={handleChange} required />
        
        <label htmlFor="password1">Contraseña</label>
        <input id="password1" type="password" name="password1" onChange={handleChange} required />
        
        <label htmlFor="password2">Confirmar Contraseña</label>
        <input id="password2" type="password" name="password2" onChange={handleChange} required />
        
        <button type="submit">Registrarse</button>
      </form>
      <div className="auth-links">
        <Link to="/login">¿Ya tienes una cuenta? Inicia Sesión</Link>
        <Link to="/">Volver a la tienda</Link>
      </div>
    </div>
  );
}
export default RegisterPage;
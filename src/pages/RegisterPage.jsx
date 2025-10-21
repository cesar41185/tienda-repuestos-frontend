import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password1: '', // <-- CORREGIDO
    password2: '',
    nombre_completo: '',
    cedula_rif_prefijo: 'V',
    cedula_rif_numero: '',
    telefono: '',
    estado: '',
    ciudad: '',
    direccion: '',
  });
  const { registerUser } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password1 !== formData.password2) { // <-- CORREGIDO
      alert('Las contraseñas no coinciden');
      return;
    }

    // Creamos el objeto final para la API, combinando la cédula
    const datosParaApi = {
      ...formData,
      cedula_rif: `${formData.cedula_rif_prefijo}${formData.cedula_rif_numero}`
    };
    
    registerUser(datosParaApi);
  };

  return (
    <div className="auth-container">
      <h2>Crear una Cuenta</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <label htmlFor="nombre_completo">Nombre Completo</label>
        <input id="nombre_completo" type="text" name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} required />
        
        <label htmlFor="cedula_rif_numero">Cédula o RIF</label>
        <div className="cedula-rif-input">
          <select name="cedula_rif_prefijo" value={formData.cedula_rif_prefijo} onChange={handleChange}>
            <option value="V">V</option>
            <option value="E">E</option>
            <option value="P">P</option>
            <option value="J">J</option>
          </select>
          <input id="cedula_rif_numero" type="text" name="cedula_rif_numero" value={formData.cedula_rif_numero} onChange={handleChange} required />
        </div>
        
        <label htmlFor="telefono">Teléfono</label>
        <input id="telefono" type="text" name="telefono" value={formData.telefono} onChange={handleChange} required />
        
        <label htmlFor="direccion">Dirección</label>
        <textarea id="direccion" name="direccion" value={formData.direccion} onChange={handleChange} required />
        <input name="estado" type="text" placeholder="Estado" value={formData.estado} onChange={handleChange} />
        <input name="ciudad" type="text" placeholder="Ciudad" value={formData.ciudad} onChange={handleChange} />
        <hr/>
        
        <label htmlFor="username">Nombre de Usuario</label>
        <input id="username" type="text" name="username" value={formData.username} onChange={handleChange} required />

        <label htmlFor="email">Correo Electrónico</label>
        <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required />
        
        <label htmlFor="password1">Contraseña</label>
        <input id="password1" type="password" name="password1" value={formData.password1} onChange={handleChange} required /> {/* <-- CORREGIDO */}
        
        <label htmlFor="password2">Confirmar Contraseña</label>
        <input id="password2" type="password" name="password2" value={formData.password2} onChange={handleChange} required />
        
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
// En src/pages/PerfilPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import API_URL from '../apiConfig'; // <-- 1. IMPORTAMOS LA CONFIGURACIÓN CENTRAL
import { SERVER_BASE_URL } from '../apiConfig';

function PerfilPage() {
  const { user, token, logoutUser, fetchUser } = useAuth(); // Asumimos que fetchUser está disponible en el contexto para refrescar
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password1: '', new_password2: '' });
  const fileInputRef = useRef(null);

  // --- 2. BORRAMOS LA CONSTANTE API_URL LOCAL ---

  useEffect(() => {
    // Usamos el 'user' que ya está cargado en el AuthContext
    if (user) {
      setFormData({
        ...user,
        perfil: { ...user.perfil }
      });
      setCargando(false);
    } else if (!token) {
      // Si no hay token, no hay nada que cargar
      setCargando(false);
    }
    // Si hay token pero no usuario, el useEffect principal de AuthContext lo está cargando.
  }, [user, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['telefono', 'direccion', 'estado', 'ciudad'].includes(name)) {
        setFormData(prev => ({ ...prev, perfil: { ...prev.perfil, [name]: value } }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        toast.loading('Actualizando perfil...');
        // --- 3. USAMOS LA VARIABLE IMPORTADA ---
        const response = await fetch(`${API_URL}/auth/user/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
            body: JSON.stringify(formData)
        });
        if (!response.ok) throw new Error('Error al actualizar el perfil.');
        
        // Refrescamos el usuario global
        if (fetchUser) await fetchUser();

        toast.dismiss();
        toast.success('¡Perfil actualizado!');
    } catch (error) {
        toast.dismiss();
        toast.error(error.message);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.new_password1 !== passwordData.new_password2) {
      return toast.error('Las contraseñas nuevas no coinciden.');
    }
    try {
      toast.loading('Cambiando contraseña...');
      const response = await fetch(`${API_URL}/auth/password/change/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify(passwordData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(Object.values(errorData).flat().join(' '));
      }
      toast.dismiss();
      toast.success('Contraseña cambiada. Inicia sesión de nuevo.');
      setTimeout(() => { logoutUser(); }, 2000);
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const dataFoto = new FormData();
    dataFoto.append('foto_perfil', file);
    try {
      toast.loading('Subiendo foto...');
      await fetch(`${API_URL}/perfil/foto/`, {
        method: 'PATCH',
        headers: { 'Authorization': `Token ${token}` },
        body: dataFoto,
      });
      toast.dismiss();
      toast.success('¡Foto de perfil actualizada!');
      
      // Refrescamos el usuario global para ver la nueva foto
      if (fetchUser) await fetchUser();

    } catch (error) {
      toast.dismiss();
      toast.error('No se pudo subir la foto.');
    }
  };

  if (cargando) return <p>Cargando perfil...</p>;
  if (!formData) return <p>No se encontró tu perfil. Por favor, <Link to="/login">inicia sesión</Link> de nuevo.</p>;

  return (
    <div className="auth-container">
       {user && user.perfil.debe_cambiar_password && (
        <div style={{backgroundColor: '#ffc107', padding: '1rem', borderRadius: '5px', marginBottom: '1rem', textAlign: 'center'}}>
          <strong>Atención:</strong> Debes establecer una nueva contraseña para continuar usando la aplicación.
        </div>
      )}
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Mi Perfil</h2>

        <div className="perfil-foto-container">
          <img 
            // Construye la URL absoluta si existe la foto, si no usa el placeholder
            src={formData.perfil?.foto_perfil || '/placeholder-avatar.png'}            alt="Foto de perfil" 
            className="perfil-foto"
            onClick={() => fileInputRef.current.click()}
          />
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFotoChange}
            style={{ display: 'none' }} // Ocultamos el input feo
            accept="image/*"
          />
        </div>
        
        <label>Código de Cliente:</label>
        <input type="text" value={formData.perfil?.codigo_cliente || 'N/A'} readOnly disabled />
        
        <label>Nombre de Usuario:</label>
        <input type="text" value={formData.username || ''} readOnly disabled />
        
        <label>Nombre Completo:</label>
        <input type="text" value={formData.perfil?.nombre_completo || ''} readOnly disabled />
        
        <label>Cédula o RIF:</label>
        <input type="text" value={formData.perfil?.cedula_rif || ''} readOnly disabled />
        
        <hr/>

        <label htmlFor="email">Correo Electrónico:</label>
        <input id="email" type="email" name="email" value={formData.email || ''} onChange={handleChange} />

        <label htmlFor="telefono">Teléfono:</label>
        <input id="telefono" type="text" name="telefono" value={formData.perfil?.telefono || ''} onChange={handleChange} />
        
        <label htmlFor="direccion">Dirección:</label>
        <textarea id="direccion" name="direccion" value={formData.perfil?.direccion || ''} onChange={handleChange} />
        
        <button type="submit">Actualizar Perfil</button>
      </form>

      <hr style={{ margin: '2rem 0', border: '1px solid #eee' }} />

      <form onSubmit={handlePasswordSubmit} className="auth-form">
        <h2>Cambiar Contraseña</h2>
        <label htmlFor="old_password">Contraseña Actual</label>
        <input id="old_password" type="password" name="old_password" value={passwordData.old_password} onChange={handlePasswordInputChange} required />
        
        <label htmlFor="new_password1">Nueva Contraseña</label>
        <input id="new_password1" type="password" name="new_password1" value={passwordData.new_password1} onChange={handlePasswordInputChange} required />
        
        <label htmlFor="new_password2">Confirmar Nueva Contraseña</label>
        <input id="new_password2" type="password" name="new_password2" value={passwordData.new_password2} onChange={handlePasswordInputChange} required />
        
        <button type="submit">Cambiar Contraseña</button>
      </form>
    </div>
  );
}

export default PerfilPage;
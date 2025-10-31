// En src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API_URL from '../apiConfig';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [user, setUser] = useState(null); 
  const navigate = useNavigate();

  const logoutUser = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const fetchUser = async () => {
    if (token) {
      try {
        // --- CORRECCIÓN AQUÍ ---
        // La URL correcta para obtener el usuario es '/api/auth/user/'
        const userResponse = await fetch(`${API_URL}/auth/user/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        if (!userResponse.ok) {
          throw new Error('Token inválido');
        }
        const userData = await userResponse.json();
        setUser(userData);

        if (userData.perfil && userData.perfil.debe_cambiar_password) {
          toast.error('Por tu seguridad, debes cambiar tu contraseña.', { duration: 6000 });
        }  
      } catch (e) {
        logoutUser();
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
      fetchUser();
  }, [token]);
  
  const registerUser = async (formData) => {
    try {
      // La URL de registro también va bajo /auth/
      const response = await fetch(`${API_URL}/auth/registration/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (!response.ok) { throw data; }

      toast.success('¡Registro exitoso! Por favor, inicia sesión.');
      navigate('/login');
    } catch (error) {
      let errorMessage = 'Error en el registro. Revisa los datos.';
      if (error && typeof error === 'object') {
        const messages = Object.keys(error)
          .map(key => `${key}: ${Array.isArray(error[key]) ? error[key].join(' ') : error[key]}`)
          .join('\n');
        if (messages) {
            errorMessage = messages;
        }
      }
      toast.error(errorMessage, { duration: 6000 });
    }
  };

  const loginUser = async (formData) => {
    try {
        const loginResponse = await fetch(`${API_URL}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        const loginData = await loginResponse.json();
        if (!loginResponse.ok) { throw new Error('Usuario o contraseña incorrectos.'); }

        setToken(loginData.key);
        localStorage.setItem('authToken', loginData.key);
        
        toast.success('¡Bienvenido!');
        navigate('/');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const manualLogoutUser = () => {
      logoutUser();
      toast.success('Has cerrado sesión.');
  }

  const value = {
    token,
    user,
    loginUser,
    registerUser,
    logoutUser: manualLogoutUser,
    fetchUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
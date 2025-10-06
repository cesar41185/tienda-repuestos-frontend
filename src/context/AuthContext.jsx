// En src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [user, setUser] = useState(null); 
  const navigate = useNavigate();

  const API_URL = 'http://192.168.1.55:8000/api/auth';

  // Función para registrar un usuario
const registerUser = async (formData) => {
    try {
      const response = await fetch(`${API_URL}/registration/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json(); // Leemos la respuesta, sea de éxito o error

      if (!response.ok) {
        // Si la respuesta no es OK, lanzamos un error con los datos del backend
        throw data; 
      }

      toast.success('¡Registro exitoso! Por favor, inicia sesión.');
      navigate('/login');
    } catch (error) {
      console.error('Error de registro:', error);
      
      // Creamos un mensaje de error legible a partir de la respuesta del backend
      let errorMessage = 'Error en el registro. Revisa los datos.';
      if (error && typeof error === 'object') {
        // Extraemos los mensajes de error de cada campo y los unimos
        const messages = Object.keys(error)
          .map(key => `${key}: ${error[key].join(' ')}`)
          .join('\n');
        if (messages) {
            errorMessage = messages;
        }
      }
      toast.error(errorMessage, { duration: 6000 }); // Mostramos el error por más tiempo
    }
};
  // Función para iniciar sesión
  const loginUser = async (formData) => {
    try {
      const response = await fetch(`${API_URL}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error('Usuario o contraseña incorrectos.');
      }
      setToken(data.key);
      localStorage.setItem('authToken', data.key);
      // Aquí podrías también pedir y guardar los datos del usuario
      // setUser(userData); 
      toast.success('¡Bienvenido!');
      navigate('/'); // Redirige a la tienda
    } catch (error) {
      console.error('Error de login:', error);
      toast.error(error.message);
    }
  };

  // Función para cerrar sesión
  const logoutUser = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    toast.success('Has cerrado sesión.');
    navigate('/login');
  };

  const value = {
    token,
    user,
    loginUser,
    registerUser,
    logoutUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
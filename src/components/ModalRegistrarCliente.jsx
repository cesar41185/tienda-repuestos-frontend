// En src/components/ModalRegistrarCliente.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function ModalRegistrarCliente({ isOpen, onClose, onClienteRegistrado }) {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    nombre_completo: '',
    cedula_rif: '',
    telefono: '',
    // --- NUEVA ESTRUCTURA DE DIRECCIÓN ---
    estado: '',
    ciudad: '',
    direccion: '',
  });
  const { token } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      toast.loading('Registrando cliente...');
      const response = await fetch(`${API_URL}/vendedores/registrar-cliente/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      toast.dismiss();
      if (!response.ok) {
        const errorMsg = Object.values(data).flat().join('\n');
        throw new Error(errorMsg);
      }

      toast.success(data.success);
      onClienteRegistrado();
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || 'No se pudo registrar al cliente.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <h2>Registrar Nuevo Cliente</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input name="nombre_completo" type="text" placeholder="Nombre Completo" onChange={handleChange} required />
          <input name="cedula_rif" type="text" placeholder="Cédula o RIF" onChange={handleChange} required />
          <input name="telefono" type="text" placeholder="Teléfono" onChange={handleChange} required />

          {/* --- NUEVOS CAMPOS DE DIRECCIÓN --- */}
          <input name="estado" type="text" placeholder="Estado" onChange={handleChange} />
          <input name="ciudad" type="text" placeholder="Ciudad" onChange={handleChange} />
          <textarea name="direccion" placeholder="Dirección Detallada (Calle, Av, Casa...)" onChange={handleChange} required />

          <hr/>
          <input name="username" type="text" placeholder="Nombre de Usuario" onChange={handleChange} required />
          <input name="email" type="email" placeholder="Correo Electrónico" onChange={handleChange} required />

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Registrar Cliente</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalRegistrarCliente;
// En src/components/ModalDetalleCliente.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import API_URL from '../apiConfig';

function ModalDetalleCliente({ clienteId, isOpen, onClose, onSave, vendedores, categorias }) {
  const [cliente, setCliente] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [editMode, setEditMode] = useState(false); 
  const [formData, setFormData] = useState(null);
  const { user, token } = useAuth();
  
  const API_URL = import.meta.env.VITE_API_URL;;

  const esAdmin = user && user.groups.includes('Administrador');

  const fetchCliente = async () => {
      if (!clienteId || !token) return;
      setCargando(true);
      try {
        const response = await fetch(`${API_URL}/clientes/${clienteId}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        const data = await response.json();
        setCliente(data);
      } catch (error) {
        console.error("Error al cargar detalle del cliente:", error);
      } finally {
        setCargando(false);
      }
    };

  useEffect(() => {
    if (isOpen) {
      fetchCliente();
      setEditMode(false);
    }
  }, [clienteId, isOpen, token]);

  useEffect(() => {
    if (cliente) {
      setFormData({
        email: cliente.email,
        perfil: { 
          ...cliente.perfil,
          categoria_id: cliente.perfil.categoria?.id || '',
          vendedor_asignado_id: cliente.perfil.vendedor_asignado || ''
        }
      });
    }
  }, [cliente]);

  const handleChange = (e) => {
      const { name, value } = e.target;
      if (name === 'email') {
          setFormData(prev => ({ ...prev, email: value }));
      } else {
          // Actualizamos los datos dentro del objeto 'perfil'
          setFormData(prev => ({
              ...prev,
              perfil: { ...prev.perfil, [name]: value }
          }));
      }
  };

  const handleSave = async () => {
    // 1. Creamos un objeto 'perfil' limpio con SOLO los campos que queremos enviar
    const perfilParaEnviar = {
      nombre_completo: formData.perfil.nombre_completo,
      telefono: formData.perfil.telefono,
      estado: formData.perfil.estado,
      ciudad: formData.perfil.ciudad,
      direccion: formData.perfil.direccion,
      // 2. Usamos los nombres correctos que el backend espera
      categoria_id: formData.perfil.categoria_id,
      vendedor_asignado_id: formData.perfil.vendedor_asignado_id,
    };

    // 3. Creamos el objeto final para la API
    const datosLimpios = {
        email: formData.email,
        perfil: perfilParaEnviar
    };

    try {
        toast.loading('Guardando cambios...');
        const response = await fetch(`${API_URL}/clientes/${clienteId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
            body: JSON.stringify(datosLimpios),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw errorData;
        }

        toast.dismiss();
        toast.success('Cliente actualizado con éxito.');
        setEditMode(false);
        await fetchCliente();
        onSave();

    } catch (errorData) {
        toast.dismiss();
        let errorMessage = 'No se pudieron guardar los cambios.';
        if (typeof errorData === 'object' && errorData !== null) {
            errorMessage = Object.entries(errorData).map(([field, messages]) => {
                const messageText = Array.isArray(messages) ? messages.join(' ') : messages;
                return `${field}: ${messageText}`;
            }).join('\n');
        }
        toast.error(errorMessage, { duration: 6000 });
        console.error("Error detallado del servidor:", errorData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        {cargando || !formData ? (
          <p>Cargando datos del cliente...</p>
        ) : (
          <>
            <h2>{editMode ? 'Editando Cliente' : 'Detalle del Cliente'}: {formData.perfil.nombre_completo}</h2>
            
            {/* --- CORRECCIÓN: Formulario unificado y reorganizado --- */}
            <div className="form-grid">
              <div><label>Código:</label><span>{formData.perfil.codigo_cliente || 'N/A'}</span></div>
              <div><label>Cédula/RIF:</label><span>{formData.perfil.cedula_rif || 'N/A'}</span></div>
              
              <div><label>Nombre Completo:</label>
                {editMode ? <input name="nombre_completo" value={formData.perfil.nombre_completo || ''} onChange={handleChange} /> : <span>{formData.perfil.nombre_completo}</span>}
              </div>
              <div><label>Email:</label>
                {editMode ? <input name="email" value={formData.email || ''} onChange={handleChange} /> : <span>{formData.email}</span>}
              </div>
              <div><label>Teléfono:</label>
                {editMode ? <input name="telefono" value={formData.perfil.telefono || ''} onChange={handleChange} /> : <span>{formData.perfil.telefono}</span>}
              </div>
              <div><label>Estado:</label>
                {editMode ? <input name="estado" value={formData.perfil.estado || ''} onChange={handleChange} /> : <span>{formData.perfil.estado}</span>}
              </div>
              <div><label>Ciudad:</label>
                {editMode ? <input name="ciudad" value={formData.perfil.ciudad || ''} onChange={handleChange} /> : <span>{formData.perfil.ciudad}</span>}
              </div>
              
              <div><label>Categoría:</label>
                {editMode ? (
                  <select name="categoria_id" value={formData.perfil.categoria_id || ''} onChange={handleChange}>
                    <option value="">-- Sin Categoría --</option>
                    {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                  </select>
                ) : (
                  <span>{formData.perfil.categoria?.nombre || 'N/A'}</span>
                )}
              </div>

              <div><label>Vendedor Asignado:</label>
                {editMode ? (
                  <select name="vendedor_asignado_id" value={formData.perfil.vendedor_asignado_id || ''} onChange={handleChange}>
                    <option value="">-- Sin Asignar --</option>
                    {vendedores.map(vend => <option key={vend.id} value={vend.id}>{vend.username}</option>)}
                  </select>
                ) : (
                  <span>{formData.perfil.vendedor_asignado_nombre || 'N/A'}</span>
                )}
              </div>
            </div>
            
            <div style={{marginTop: '1rem'}}>
              <label>Dirección Detallada:</label>
              {editMode ? <textarea name="direccion" value={formData.perfil.direccion || ''} onChange={handleChange} rows="3" style={{width: '100%'}}/> :
                <p style={{margin: '0.5rem 0', padding: '0.5rem', background: '#f8f9fa', borderRadius: '4px'}}>
                  {formData.perfil.direccion || 'N/A'}
                </p>
              }
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
              {esAdmin && (
                <>
                  {editMode ? (
                    <button type="button" className="btn btn-primary" onClick={handleSave}>Guardar Cambios</button>
                  ) : (
                    <button type="button" className="btn btn-primary" onClick={() => setEditMode(true)}>Editar</button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ModalDetalleCliente;
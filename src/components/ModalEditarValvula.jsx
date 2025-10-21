import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import API_URL from '../apiConfig';

function ModalEditarValvula({ producto, onClose, onSave, onRefresh, marcas, onDelete }) {
  const { user, token } = useAuth(); 
  const [activeTab, setActiveTab] = useState('datos');
  // Aseguramos un estado inicial completo para evitar errores
  const initialState = {
      stock: '',
      precio_costo: '',
      precio_venta: '',
      especificaciones: {
        tipo: '', diametro_cabeza: '', diametro_vastago: '',
        longitud_total: '', ranuras: '', angulo_asiento: '',
        distancia_primera_ranura: ''
      },
      fotos: [], numeros_de_parte: [], aplicaciones: []
    };
  const [formData, setFormData] = useState(initialState);
  const [nuevaReferencia, setNuevaReferencia] = useState({ marca: '', numero_de_parte: '' });
  const [nuevaAplicacion, setNuevaAplicacion] = useState({
    marca_vehiculo: '',
    modelo_vehiculo: '',
    cilindrada: '',
    cantidad_cilindros: '',
    detalle_motor: '',
    ano_desde: '',
    ano_hasta: '',
    cantidad_valvulas: ''
});
  useEffect(() => {
      if (producto) {
        let specs = {};
        if (producto.especificaciones) {
          // 2. Comprobamos si es un string y, si es así, lo convertimos a objeto
          if (typeof producto.especificaciones === 'string') {
            try {
              specs = JSON.parse(producto.especificaciones);
            } catch (e) {
              console.error("Error al parsear JSON de especificaciones:", e);
              specs = {}; // Si falla, usamos un objeto vacío para evitar un crash
            }
          } else {
            // Si ya es un objeto, lo usamos directamente
            specs = producto.especificaciones;
          }
        }
        // 3. Rellenamos el formulario asegurando que todos los campos existan
        setFormData({
          ...initialState,
          ...producto,
          especificaciones: {
            ...initialState.especificaciones,
            ...specs
          }
        });
      }
    }, [producto]);

  if (!producto) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSpecChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      especificaciones: { ...prev.especificaciones, [name]: value }
    }));
  };
  
  const handleNuevaAplicacionChange = (e) => {
    const { name, value } = e.target;
    setNuevaAplicacion(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNuevaReferenciaChange = (e) => {
    const { name, value } = e.target;
    setNuevaReferencia(prev => ({ ...prev, [name]: value }));
  };

  const handleGlobalSave = async () => {
    try {
      toast.loading('Guardando...');
      const url = `${API_URL}/productos/${producto.id}/`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Error al guardar');
      toast.dismiss();
      onSave();
    } catch (error) {
      toast.dismiss();
      toast.error('Hubo un error al guardar los datos.');
    }
  };

 const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    toast.loading('Subiendo fotos...');

    // Creamos una promesa para cada subida de archivo
    const uploadPromises = Array.from(files).map(file => {
        const dataFoto = new FormData();
        dataFoto.append('producto', producto.id);
        dataFoto.append('imagen', file);
        
        // Devolvemos la promesa del fetch
            return fetch(`${API_URL}/fotos/`, {
            method: 'POST',
            headers: { 'Authorization': `Token ${token}` },
            body: dataFoto,
        }).then(response => {
            if (!response.ok) {
                // Si una foto falla, lanzamos un error para que Promise.all lo capture
                throw new Error(`Error al subir ${file.name}`);
            }
            return response.json();
        });
    });

    try {
        // Promise.all espera a que TODAS las promesas de subida se completen
        await Promise.all(uploadPromises);
        toast.dismiss(); // Cierra el toast de "Subiendo..."
        toast.success('¡Todas las fotos se subieron con éxito!');
        
        onRefresh(); // <-- Llamamos a refrescar SOLO cuando todo ha terminado
    } catch (error) {
        toast.dismiss();
        toast.error(error.message || 'Algunas fotos no se pudieron subir.');
    }
};

  const handleDeleteFoto = async (fotoId) => {
      await fetch(`${API_URL}/fotos/${fotoId}/`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Token ${token}` } // <-- TOKEN AÑADIDO
    });
    toast.success('Foto eliminada.');
    onRefresh();
  };
  
  const handleAddReferencia = async (e) => {
    e.preventDefault();
    const data = { ...nuevaReferencia, producto: producto.id };
    await fetch(`${API_URL}/numeros-parte/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json','Authorization': `Token ${token}` },
        body: JSON.stringify(data),
    });
    setNuevaReferencia({ marca: '', numero_de_parte: '' });
    onRefresh();
  };
  
  const handleDeleteReferencia = async (id) => {
        await fetch(`${API_URL}/numeros-parte/${id}/`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` } // <-- TOKEN AÑADIDO
      });
      toast.success('Referencia eliminada.');
      onRefresh();
  };
  
  const handleAddAplicacion = async (e) => {
    e.preventDefault();
    const data = { ...nuevaAplicacion, producto: producto.id };
    await fetch(`${API_URL}/aplicaciones/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}` // <-- AÑADIDO
        },
        body: JSON.stringify(data),
    });
    setNuevaAplicacion({ marca_vehiculo: '', modelo_vehiculo: '' }); // Resetear formulario
    onRefresh(); // Refrescar datos
  };
  
  const handleDeleteAplicacion = async (id) => {
        await fetch(`${API_URL}/aplicaciones/${id}/`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` } // <-- TOKEN AÑADIDO
      });
      toast.success('Aplicación eliminada.');
      onRefresh();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <h2>Editar Producto: {producto.codigo_interno}</h2>
        <div className="modal-tabs">
          <button onClick={() => setActiveTab('datos')} className={`modal-tab-button ${activeTab === 'datos' ? 'active' : ''}`}>Datos y Fotos</button>
          <button onClick={() => setActiveTab('referencias')} className={`modal-tab-button ${activeTab === 'referencias' ? 'active' : ''}`}>Números de Parte</button>
          <button onClick={() => setActiveTab('aplicaciones')} className={`modal-tab-button ${activeTab === 'aplicaciones' ? 'active' : ''}`}>Aplicaciones</button>
        </div>

        {activeTab === 'datos' && (
          <div className="tab-content">
            <form className="edit-form">
              <h4>Datos Generales</h4>
              <div className="form-grid">
                <div><label>Stock:</label><input name="stock" type="number" value={formData.stock || ''} onChange={handleChange} /></div>
                {/* ▼▼▼ ESTOS CAMPOS SOLO LOS VERÁ EL ADMIN ▼▼▼ */}
                {user && user.groups.includes('Administrador') && (
                  <>
                    <div><label>Precio Costo:</label><input name="precio_costo" type="number" step="0.01" value={formData.precio_costo || ''} onChange={handleChange} /></div>
                    <div><label>Precio Venta:</label><input name="precio_venta" type="number" step="0.01" value={formData.precio_venta || ''} onChange={handleChange} /></div>
                  </>
                )}
              </div>
              <hr />
              
              <h4>Especificaciones de Válvula</h4>
              <div className="form-grid">
                <div><label>Tipo:</label>
                  <select 
                    name="tipo" 
                    value={formData.especificaciones.tipo || ''} 
                    onChange={handleSpecChange}
                  >
                    <option value="">-- Seleccione --</option>
                    <option value="INTAKE">Admisión</option>
                    <option value="EXHAUST">Escape</option>
                  </select>
                </div>
                <div><label>Cabeza (mm):</label><input name="diametro_cabeza" type="number" step="0.01" value={formData.especificaciones.diametro_cabeza || ''} onChange={handleSpecChange} /></div>
                <div><label>Vástago (mm):</label><input name="diametro_vastago" type="number" step="0.01" value={formData.especificaciones.diametro_vastago || ''} onChange={handleSpecChange} /></div>
                <div><label>Longitud (mm):</label><input name="longitud_total" type="number" step="0.01" value={formData.especificaciones.longitud_total || ''} onChange={handleSpecChange} /></div>
                <div><label>Ranuras:</label><input name="ranuras" type="number" value={formData.especificaciones.ranuras || ''} onChange={handleSpecChange} /></div>
                <div><label>Angulo Asiento (°):</label><input name="angulo_asiento" type="number" step="0.1" value={formData.especificaciones.angulo_asiento} onChange={handleSpecChange} /></div>
                <div><label>Distancia Ranura (mm):</label><input name="distancia_primera_ranura" type="number" step="0.01" value={formData.especificaciones.distancia_primera_ranura} onChange={handleSpecChange} /></div>
              </div>
              <hr />
              <h4>Fotos</h4>
              <div className="fotos-actuales">
                {formData.fotos && formData.fotos.map(foto => (
                  <div key={foto.id} className="foto-container">
                    <img src={foto.imagen} alt="Miniatura" />
                    <button type="button" className="delete-foto-btn" onClick={() => handleDeleteFoto(foto.id)}>X</button>
                  </div>
                ))}
              </div>
              <input name="fotos" type="file" multiple onChange={handleFileChange} />
            </form>
          </div>
        )}

        {activeTab === 'referencias' && (
          <div className="tab-content">
            <h4>Referencias Existentes</h4>
            <ul className="related-list">
              {formData.numeros_de_parte && formData.numeros_de_parte.map(part => (
                <li key={part.id}>
                  <span>{part.marca} - {part.numero_de_parte}</span>
                  <button onClick={() => handleDeleteReferencia(part.id)}>Borrar</button>
                </li>
              ))}
            </ul><hr />
            <h4>Añadir Nueva Referencia</h4>
            <form onSubmit={handleAddReferencia} className="add-form">
              <input name="marca" type="text" placeholder="Marca (ej: TRW)" value={nuevaReferencia.marca} onChange={handleNuevaReferenciaChange} required />
              <input name="numero_de_parte" type="text" placeholder="Código" value={nuevaReferencia.numero_de_parte} onChange={handleNuevaReferenciaChange} required />
              <button type="submit">Añadir</button>
            </form>
          </div>
        )}
        
        {activeTab === 'aplicaciones' && (
          <div className="tab-content">
            <h4>Aplicaciones Existentes</h4>
            <ul className="related-list">
              {formData.aplicaciones && formData.aplicaciones.map(app => (
                <li key={app.id}>
                  <span>{`${app.marca_vehiculo_nombre} ${app.modelo_vehiculo}`}</span>
                  <button onClick={() => handleDeleteAplicacion(app.id)}>Borrar</button>
                </li>
              ))}
            </ul><hr />
            <h4>Añadir Nueva Aplicación</h4>
            <form onSubmit={handleAddAplicacion} className="add-form">
                {/* Fila 1 */}
                <select name="marca_vehiculo" value={nuevaAplicacion.marca_vehiculo} onChange={handleNuevaAplicacionChange} required>
                  <option value="">-- Marca --</option>
                  {Array.isArray(marcas) && marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
                <input name="modelo_vehiculo" type="text" placeholder="Modelo Vehículo" value={nuevaAplicacion.modelo_vehiculo} onChange={handleNuevaAplicacionChange} required />
                <input name="detalle_motor" type="text" placeholder="Detalle Motor (ej: Zetec)" value={nuevaAplicacion.detalle_motor} onChange={handleNuevaAplicacionChange} />

                {/* Fila 2 */}
                <input name="cilindrada" type="number" step="0.1" placeholder="Cilindrada (ej: 1.6)" value={nuevaAplicacion.cilindrada} onChange={handleNuevaAplicacionChange} />
                <input name="cantidad_cilindros" type="number" placeholder="N° Cilindros" value={nuevaAplicacion.cantidad_cilindros} onChange={handleNuevaAplicacionChange} />
                <input name="ano_desde" type="number" placeholder="Año Desde" value={nuevaAplicacion.ano_desde} onChange={handleNuevaAplicacionChange} />
                <input name="ano_hasta" type="number" placeholder="Año Hasta" value={nuevaAplicacion.ano_hasta} onChange={handleNuevaAplicacionChange} />
                <input name="cantidad_valvulas" type="number" placeholder="Cant. Válvulas" value={nuevaAplicacion.cantidad_valvulas} onChange={handleNuevaAplicacionChange} />

                <button type="submit">Añadir Aplicación</button>
              </form>
          </div>
        )}

       
        <div className="modal-actions">
          <button type="button" className="btn btn-danger" onClick={() => onDelete(producto.id)}>
            Eliminar Producto
          </button>

          {/* Botones existentes */}
          <div style={{ marginLeft: 'auto' }}> {/* Empuja los otros botones a la derecha */}
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
            <button type="button" className="btn btn-primary" onClick={handleGlobalSave}>Guardar Cambios</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalEditarValvula;
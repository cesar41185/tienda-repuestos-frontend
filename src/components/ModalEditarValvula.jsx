import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ModalFoto from './ModalFoto';

// Ahora el componente también recibe "onRefresh"
function ModalEditarValvula({ valvula, onClose, onSave, onRefresh, marcas }) {
  // --- ESTADOS (La "memoria" del componente) ---
  const [activeTab, setActiveTab] = useState('datos');
  const [formData, setFormData] = useState({});
  const [nuevasFotos, setNuevasFotos] = useState([]);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [nuevaReferencia, setNuevaReferencia] = useState({ marca: '', numero_de_parte: '' });
  const [nuevaAplicacion, setNuevaAplicacion] = useState({
    marca_vehiculo: '', modelo_vehiculo: '', cilindrada: '', cantidad_cilindros: '',
    detalle_motor: '', ano_desde: '', ano_hasta: '', cantidad_valvulas: ''
  });
  const [editingAppId, setEditingAppId] = useState(null);

  // Efecto para rellenar el formulario cuando se abre el modal con una válvula
  useEffect(() => {
    if (valvula) {
      const { fotos, numeros_de_parte, aplicaciones, ...datosValvula } = valvula;
      setFormData(datosValvula);
    }
  }, [valvula]);

  if (!valvula) return null;

  // --- MANEJADORES DE FORMULARIOS (sin cambios) ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
   const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    toast.loading('Subiendo fotos...');

    const uploadPromises = Array.from(files).map(file => {
      const dataFoto = new FormData();
      dataFoto.append('imagen', file);
      dataFoto.append('valvula', valvula.id);
      
      return fetch('http://192.168.1.55:8000/api/fotos/', {
        method: 'POST',
        body: dataFoto,
      });
    });

    try {
      const responses = await Promise.all(uploadPromises);
      const allOk = responses.every(res => res.ok);

      if (!allOk) {
        throw new Error('Algunas fotos no se pudieron subir.');
      }

      toast.dismiss();
      toast.success('¡Fotos subidas con éxito!');
      onRefresh(); // Refresca el modal para mostrar las nuevas fotos
    } catch (error) {
      toast.dismiss();
      toast.error('Error al subir las fotos.');
      console.error(error);
    }
  };
  const handleNuevaReferenciaChange = (e) => {
    const { name, value } = e.target;
    setNuevaReferencia(prev => ({ ...prev, [name]: value }));
  };
  const handleNuevaAplicacionChange = (e) => {
    const { name, value } = e.target;
    setNuevaAplicacion(prev => ({ ...prev, [name]: value }));
  };
  const handleEditAplicacionClick = (app) => {
    setEditingAppId(app.id);
    setNuevaAplicacion({
      marca_vehiculo: app.marca_vehiculo,
      modelo_vehiculo: app.modelo_vehiculo || '',
      cilindrada: app.cilindrada || '',
      cantidad_cilindros: app.cantidad_cilindros || '',
      detalle_motor: app.detalle_motor || '',
      ano_desde: app.ano_desde || '',
      ano_hasta: app.ano_hasta || '',
      cantidad_valvulas: app.cantidad_valvulas || '',
    });
  };
  const resetFormularioAplicacion = () => {
    setEditingAppId(null);
    setNuevaAplicacion({ marca_vehiculo: '', modelo_vehiculo: '', cilindrada: '', cantidad_cilindros: '', detalle_motor: '', ano_desde: '', ano_hasta: '', cantidad_valvulas: ''});
  };

  // --- FUNCIONES DE API (ACTUALIZADAS PARA USAR onRefresh) ---
  const handleUpdateDatosPrincipales = async () => {
    await fetch(`http://192.168.1.55:8000/api/valvulas/${valvula.id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
  };


  const handleDeleteFoto = async (fotoId) => {
    await fetch(`http://192.168.1.55:8000/api/fotos/${fotoId}/`, { method: 'DELETE' });
    toast.success('Foto eliminada.');
    onRefresh(); // <-- CAMBIO: Refresca en lugar de cerrar
  };

  const handleAddReferencia = async (e) => {
    e.preventDefault();
    const data = { ...nuevaReferencia, valvula_maestra: valvula.id };
    await fetch('http://192.168.1.55:8000/api/numeros-parte/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setNuevaReferencia({ marca: '', numero_de_parte: '' });
    onRefresh(); // <-- CAMBIO: Refresca en lugar de cerrar
  };

  const handleDeleteReferencia = async (id) => {
    await fetch(`http://192.168.1.55:8000/api/numeros-parte/${id}/`, { method: 'DELETE' });
    toast.success('Referencia eliminada.');
    onRefresh(); // <-- CAMBIO: Refresca en lugar de cerrar
  };
  
  const handleSaveAplicacion = async (e) => {
    e.preventDefault();
    const isEditing = editingAppId !== null;
    const url = isEditing
      ? `http://192.168.1.55:8000/api/aplicaciones/${editingAppId}/`
      : 'http://192.168.1.55:8000/api/aplicaciones/';
    const method = isEditing ? 'PATCH' : 'POST';
    const data = { ...nuevaAplicacion, valvula_maestra: valvula.id };

    await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    
    resetFormularioAplicacion();
    onRefresh(); // <-- CAMBIO: Refresca en lugar de cerrar
  };

  const handleDeleteAplicacion = async (id) => {
    await fetch(`http://192.168.1.55:8000/api/aplicaciones/${id}/`, { method: 'DELETE' });
    toast.success('Aplicación eliminada.');
    onRefresh(); // <-- CAMBIO: Refresca en lugar de cerrar
  };
  
  // --- FUNCIONES GLOBALES (sin cambios) ---
  const handleGlobalSave = async () => {
    try {
      toast.loading('Guardando datos...');
      await handleUpdateDatosPrincipales();
      toast.dismiss();
      onSave(); // Llama a la función del padre para cerrar y notificar
    } catch (error) {
      toast.dismiss();
      toast.error('Hubo un error al guardar los datos.');
      console.error(error);
    }
  };

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content large">
          <h2>Editar Válvula: {valvula.codigo_interno}</h2>
          
          <div className="modal-tabs">
            <button onClick={() => setActiveTab('datos')} className={activeTab === 'datos' ? 'active' : ''}>Datos y Fotos</button>
            <button onClick={() => setActiveTab('referencias')} className={activeTab === 'referencias' ? 'active' : ''}>Números de Parte</button>
            <button onClick={() => setActiveTab('aplicaciones')} className={activeTab === 'aplicaciones' ? 'active' : ''}>Aplicaciones</button>
          </div>

          {/* --- PESTAÑA 1: DATOS PRINCIPALES Y FOTOS --- */}
          {activeTab === 'datos' && (
            <div className="tab-content">
              <form className="edit-form">
                <div className="form-grid">
                  <div><label>Stock:</label><input name="stock" type="number" value={formData.stock || ''} onChange={handleChange} /></div>
                  <div><label>Precio Costo:</label><input name="precio_costo" type="number" step="0.01" value={formData.precio_costo || ''} onChange={handleChange} /></div>
                  <div><label>Precio Venta:</label><input name="precio_venta" type="number" step="0.01" value={formData.precio_venta || ''} onChange={handleChange} /></div>
                  <div><label>Tipo:</label>
                      <select name="tipo" value={formData.tipo || ''} onChange={handleChange}>
                          <option value="ADMISION">Admisión</option>
                          <option value="ESCAPE">Escape</option>
                      </select>
                  </div>
                  <div><label>Cabeza (mm):</label><input name="diametro_cabeza" type="number" step="0.01" value={formData.diametro_cabeza || ''} onChange={handleChange} /></div>
                  <div><label>Vástago (mm):</label><input name="diametro_vastago" type="number" step="0.01" value={formData.diametro_vastago || ''} onChange={handleChange} /></div>
                  <div><label>Longitud (mm):</label><input name="longitud_total" type="number" step="0.01" value={formData.longitud_total || ''} onChange={handleChange} /></div>
                  <div><label>Ranuras:</label><input name="ranuras" type="number" value={formData.ranuras || ''} onChange={handleChange} /></div>
                  <div><label>Distancia Ranura (mm):</label><input name="distancia_primera_ranura" type="number" step="0.01" value={formData.distancia_primera_ranura || ''} onChange={handleChange} /></div>
                </div>
                <hr/>
                <h4>Fotos</h4>
                <div className="fotos-actuales">
                  {valvula.fotos && valvula.fotos.map(foto => (
                    <div key={foto.id} className="foto-container">
                      <img src={foto.imagen} alt="Miniatura" onClick={() => setFotoAmpliada(foto.imagen)} style={{cursor: 'pointer'}}/>
                      <button type="button" className="delete-foto-btn" onClick={() => handleDeleteFoto(foto.id)}>X</button>
                    </div>
                  ))}
                </div>
                <label>Añadir Nuevas Fotos:</label>
                <input name="fotos" type="file" multiple onChange={handleFileChange} />
              </form>
            </div>
          )}

          {/* --- PESTAÑA 2: NÚMEROS DE PARTE --- */}
          {activeTab === 'referencias' && (
            <div className="tab-content">
              <h4>Referencias Existentes</h4>
              <ul className="related-list">
                {valvula.numeros_de_parte.map(part => (
                  <li key={part.id}>
                    <span>{part.marca} - {part.numero_de_parte}</span>
                    <button onClick={() => handleDeleteReferencia(part.id)}>Borrar</button>
                  </li>
                ))}
              </ul>
              <hr/>
              <h4>Añadir Nueva Referencia</h4>
              <form onSubmit={handleAddReferencia} className="add-form">
                <input name="marca" type="text" placeholder="Marca (ej: TRW)" value={nuevaReferencia.marca} onChange={handleNuevaReferenciaChange} required/>
                <input name="numero_de_parte" type="text" placeholder="Código de referencia" value={nuevaReferencia.numero_de_parte} onChange={handleNuevaReferenciaChange} required/>
                <button type="submit">Añadir Referencia</button>
              </form>
            </div>
          )}
          
          {/* --- PESTAÑA 3: APLICACIONES --- */}
          {activeTab === 'aplicaciones' && (
            <div className="tab-content">
              <h4>Aplicaciones Existentes</h4>
              <ul className="related-list">
                  {valvula.aplicaciones.map(app => (
                      <li key={app.id}>
                          <span>{`${app.marca_vehiculo_nombre} ${app.modelo_vehiculo} (${app.ano_desde || '?'} - ${app.ano_hasta || 'Pres.'})`}</span>
                          <div>
                            <button className="edit-btn" onClick={() => handleEditAplicacionClick(app)}>Editar</button>
                            <button onClick={() => handleDeleteAplicacion(app.id)}>Borrar</button>
                          </div>
                      </li>
                  ))}
              </ul>
              <hr/>
              <h4>{editingAppId ? 'Editando Aplicación' : 'Añadir Nueva Aplicación'}</h4>
              <form onSubmit={handleSaveAplicacion} className="add-form grid-form">
                  <select name="marca_vehiculo" value={nuevaAplicacion.marca_vehiculo} onChange={handleNuevaAplicacionChange} required>
                      <option value="">-- Marca --</option>
                      {marcas && marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                  <input name="modelo_vehiculo" type="text" placeholder="Modelo Vehículo" value={nuevaAplicacion.modelo_vehiculo} onChange={handleNuevaAplicacionChange} required />
                  <input name="detalle_motor" type="text" placeholder="Detalle Motor (ej: Zetec)" value={nuevaAplicacion.detalle_motor} onChange={handleNuevaAplicacionChange} />
                  <input name="ano_desde" type="number" placeholder="Año Desde" value={nuevaAplicacion.ano_desde} onChange={handleNuevaAplicacionChange} />
                  <input name="ano_hasta" type="number" placeholder="Año Hasta" value={nuevaAplicacion.ano_hasta} onChange={handleNuevaAplicacionChange} />
                  <input name="cilindrada" type="number" step="0.1" placeholder="Cilindrada (ej: 1.6)" value={nuevaAplicacion.cilindrada} onChange={handleNuevaAplicacionChange} />
                  <input name="cantidad_cilindros" type="number" placeholder="N° Cilindros" value={nuevaAplicacion.cantidad_cilindros} onChange={handleNuevaAplicacionChange} />
                  <input name="cantidad_valvulas" type="number" placeholder="Cant. Válvulas" value={nuevaAplicacion.cantidad_valvulas} onChange={handleNuevaAplicacionChange} />
                  <button type="submit">{editingAppId ? 'Actualizar Aplicación' : 'Añadir Aplicación'}</button>
                  {editingAppId && <button type="button" className="cancel-btn" onClick={resetFormularioAplicacion}>Cancelar Edición</button>}
              </form>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={handleGlobalSave}>Guardar Todos los Cambios</button>
            <button type="button" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
      
      <ModalFoto imageUrl={fotoAmpliada} onClose={() => setFotoAmpliada(null)} />
    </>
  );
}

export default ModalEditarValvula;
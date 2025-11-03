// En src/pages/ConteoFisicoPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import API_URL from '../apiConfig';

// Modal para crear conteo físico
function ModalCrearConteo({ onClose, onSuccess }) {
  const [observaciones, setObservaciones] = useState('');
  const [cargando, setCargando] = useState(false);
  const { token } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/conteos-fisicos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          observaciones: observaciones
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el conteo');
      }

      toast.success('Conteo físico iniciado con éxito.');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Iniciar Conteo Físico</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Observaciones (opcional):</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows="3"
              placeholder="Notas generales sobre este conteo..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={cargando}>
              {cargando ? 'Creando...' : 'Iniciar Conteo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal para agregar discrepancia
function ModalAgregarDiscrepancia({ conteo, onClose, onSuccess }) {
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [stockContado, setStockContado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [cargando, setCargando] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch(`${API_URL}/productos/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        const data = await response.json();
        setProductos(data.results || data);
      } catch (error) {
        console.error('Error al cargar productos:', error);
      }
    };
    fetchProductos();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productoSeleccionado || stockContado === '') {
      toast.error('Por favor completa todos los campos requeridos.');
      return;
    }

    // Buscar el stock actual del producto
    const producto = productos.find(p => p.id === parseInt(productoSeleccionado));

    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/conteos-fisicos/${conteo.id}/agregar_discrepancia/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          producto: productoSeleccionado,
          stock_contado: parseInt(stockContado),
          observaciones: observaciones
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al agregar la discrepancia');
      }

      toast.success('Discrepancia agregada con éxito.');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Agregar Discrepancia</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Producto:</label>
            <select
              value={productoSeleccionado}
              onChange={(e) => setProductoSeleccionado(e.target.value)}
              required
            >
              <option value="">Seleccionar producto...</option>
              {productos.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.codigo_interno} - {prod.modelo || prod.nombre || 'Sin nombre'} (Sistema: {prod.stock})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Stock Contado Físicamente:</label>
            <input
              type="number"
              value={stockContado}
              onChange={(e) => setStockContado(e.target.value)}
              required
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Observaciones (opcional):</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows="3"
              placeholder="Notas sobre esta discrepancia..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={cargando}>
              {cargando ? 'Agregando...' : 'Agregar Discrepancia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const statusLabels = {
  EN_PROCESO: 'En Proceso',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
};

function ConteoFisicoPage() {
  const [conteos, setConteos] = useState([]);
  const [conteoDetalle, setConteoDetalle] = useState(null);
  const [modalCrear, setModalCrear] = useState(false);
  const [modalDiscrepancia, setModalDiscrepancia] = useState(false);
  const [cargando, setCargando] = useState(true);
  const { token, user } = useAuth();

  const puedeGestionar = user && (user.groups.includes('Administrador') || user.groups.includes('Almacen'));

  const fetchConteos = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/conteos-fisicos/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      setConteos(data.results || data);
    } catch (error) {
      toast.error('No se pudieron cargar los conteos.');
    } finally {
      setCargando(false);
    }
  };

  const fetchConteoDetalle = async (conteoId) => {
    try {
      const response = await fetch(`${API_URL}/conteos-fisicos/${conteoId}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      setConteoDetalle(data);
    } catch (error) {
      toast.error('No se pudo cargar el detalle del conteo.');
    }
  };

  useEffect(() => {
    fetchConteos();
  }, [token]);

  const handleCompletarConteo = async (conteoId) => {
    if (!window.confirm('¿Estás seguro de completar este conteo? Se aplicarán los ajustes de stock automáticamente.')) {
      return;
    }

    try {
      toast.loading('Completando conteo...');
      const response = await fetch(`${API_URL}/conteos-fisicos/${conteoId}/completar/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
      toast.dismiss();

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al completar el conteo');
      }

      toast.success('Conteo completado. Stock actualizado automáticamente.');
      fetchConteos();
      if (conteoDetalle && conteoDetalle.id === conteoId) {
        fetchConteoDetalle(conteoId);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (cargando) return <p>Cargando conteos físicos...</p>;

  return (
    <div className="gestor-container" style={{maxWidth: '1400px'}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Conteos Físicos de Inventario</h2>
        {puedeGestionar && (
          <button className="btn btn-primary" onClick={() => setModalCrear(true)}>
            ➕ Iniciar Conteo
          </button>
        )}
      </div>

      {/* Lista de conteos */}
      <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
        {conteos.map((conteo) => (
          <div 
            key={conteo.id} 
            style={{
              padding: '1rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: conteoDetalle && conteoDetalle.id === conteo.id ? '#f0f0f0' : 'white'
            }}
            onClick={() => fetchConteoDetalle(conteo.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>Conteo #{conteo.id}</h3>
                <p style={{ margin: '0.5rem 0 0 0' }}>Fecha: {new Date(conteo.fecha_inicio).toLocaleString()}</p>
                <p style={{ margin: '0.5rem 0' }}>Estado: {statusLabels[conteo.status]}</p>
              </div>
              <span className="badge badge-info">{statusLabels[conteo.status]}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detalle del conteo seleccionado */}
      {conteoDetalle && (
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Detalle del Conteo #{conteoDetalle.id}</h3>
            {conteoDetalle.status === 'EN_PROCESO' && puedeGestionar && (
              <button 
                className="btn btn-success" 
                onClick={() => handleCompletarConteo(conteoDetalle.id)}
              >
                ✓ Completar Conteo
              </button>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <p><strong>Fecha inicio:</strong> {new Date(conteoDetalle.fecha_inicio).toLocaleString()}</p>
            {conteoDetalle.fecha_fin && (
              <p><strong>Fecha fin:</strong> {new Date(conteoDetalle.fecha_fin).toLocaleString()}</p>
            )}
            {conteoDetalle.observaciones && (
              <p><strong>Observaciones:</strong> {conteoDetalle.observaciones}</p>
            )}
          </div>

          {/* Agregar discrepancia */}
          {conteoDetalle.status === 'EN_PROCESO' && puedeGestionar && (
            <button 
              className="btn btn-secondary" 
              onClick={() => setModalDiscrepancia(true)}
              style={{ marginBottom: '1rem' }}
            >
              ➕ Agregar Discrepancia
            </button>
          )}

          {/* Tabla de discrepancias */}
          {conteoDetalle.discrepancias && conteoDetalle.discrepancias.length > 0 ? (
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Stock Sistema</th>
                  <th>Stock Contado</th>
                  <th>Diferencia</th>
                  <th>Procesada</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {conteoDetalle.discrepancias.map((disc) => (
                  <tr key={disc.id}>
                    <td>{disc.producto_codigo}</td>
                    <td>{disc.stock_sistema}</td>
                    <td>{disc.stock_contado}</td>
                    <td style={{ 
                      color: disc.diferencia > 0 ? 'green' : disc.diferencia < 0 ? 'red' : 'black',
                      fontWeight: 'bold'
                    }}>
                      {disc.diferencia > 0 ? '+' : ''}{disc.diferencia}
                    </td>
                    <td>{disc.procesada ? '✓ Sí' : '✗ No'}</td>
                    <td>{disc.observaciones || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No hay discrepancias registradas.</p>
          )}
        </div>
      )}

      {/* Modales */}
      {modalCrear && (
        <ModalCrearConteo
          onClose={() => setModalCrear(false)}
          onSuccess={fetchConteos}
        />
      )}

      {modalDiscrepancia && conteoDetalle && (
        <ModalAgregarDiscrepancia
          conteo={conteoDetalle}
          onClose={() => setModalDiscrepancia(false)}
          onSuccess={() => fetchConteoDetalle(conteoDetalle.id)}
        />
      )}
    </div>
  );
}

export default ConteoFisicoPage;


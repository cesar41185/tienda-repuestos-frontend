// En src/pages/MovimientosStockPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import API_URL from '../apiConfig';

// Modal para crear movimiento manual
function ModalCrearMovimiento({ onClose, onSuccess }) {
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [tipo, setTipo] = useState('AJUSTE');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [cargando, setCargando] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    // Cargar productos
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
    if (!productoSeleccionado || !cantidad || !motivo) {
      toast.error('Por favor completa todos los campos.');
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/movimientos-stock/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          producto: productoSeleccionado,
          tipo: tipo,
          cantidad: parseInt(cantidad),
          motivo: motivo
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el movimiento');
      }

      toast.success('Movimiento creado con éxito.');
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
        <h3>Crear Movimiento de Stock</h3>
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
                  {prod.codigo_interno} - {prod.modelo || prod.nombre || 'Sin nombre'} (Stock: {prod.stock})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tipo de Movimiento:</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              required
            >
              <option value="COMPRA">Compra</option>
              <option value="AJUSTE">Ajuste Manual</option>
              <option value="ROBO">Robo/Pérdida</option>
              <option value="DETERIORO">Deterioro</option>
            </select>
          </div>

          <div className="form-group">
            <label>Cantidad:</label>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Positiva para entradas, negativa para salidas"
              required
            />
          </div>

          <div className="form-group">
            <label>Motivo:</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows="3"
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={cargando}>
              {cargando ? 'Creando...' : 'Crear Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const tipoLabels = {
  COMPRA: 'Compra',
  VENTA: 'Venta',
  AJUSTE: 'Ajuste Manual',
  ROBO: 'Robo/Pérdida',
  DETERIORO: 'Deterioro',
  DEVOLUCION: 'Devolución',
};

function MovimientosStockPage() {
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [modalCrear, setModalCrear] = useState(false);
  const { token, user } = useAuth();

  const fetchMovimientos = async () => {
    if (!token) return;
    let url = `${API_URL}/movimientos-stock/`;
    if (filtroTipo) {
      url += `?tipo=${filtroTipo}`;
    }
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      setMovimientos(data.results || data);
    } catch (error) {
      toast.error('No se pudieron cargar los movimientos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchMovimientos();
  }, [token, filtroTipo]);

  if (cargando) return <p>Cargando movimientos...</p>;

  // Verificar si el usuario puede crear movimientos
  const puedeCrear = user && (user.groups.includes('Administrador') || user.groups.includes('Almacen'));

  return (
    <div className="gestor-container" style={{maxWidth: '1200px'}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Movimientos de Stock</h2>
        {puedeCrear && (
          <button className="btn btn-primary" onClick={() => setModalCrear(true)}>
            ➕ Crear Movimiento
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="modal-tabs" style={{marginBottom: '1rem'}}>
        <button
          onClick={() => setFiltroTipo('')}
          className={`modal-tab-button ${filtroTipo === '' ? 'active' : ''}`}
        >
          Todos
        </button>
        {Object.entries(tipoLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFiltroTipo(key)}
            className={`modal-tab-button ${filtroTipo === key ? 'active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tabla Desktop */}
      <table style={{width: '100%', marginBottom: '2rem'}}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Producto</th>
            <th>Tipo</th>
            <th>Cantidad</th>
            <th>Stock Anterior</th>
            <th>Stock Nuevo</th>
            <th>Realizado Por</th>
            <th>Motivo</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((mov) => (
            <tr key={mov.id}>
              <td>{new Date(mov.fecha).toLocaleString()}</td>
              <td>{mov.producto_codigo}</td>
              <td>{tipoLabels[mov.tipo]}</td>
              <td style={{color: mov.cantidad < 0 ? 'red' : 'green'}}>
                {mov.cantidad > 0 ? '+' : ''}{mov.cantidad}
              </td>
              <td>{mov.stock_anterior}</td>
              <td>{mov.stock_nuevo}</td>
              <td>{mov.realizado_por_nombre || 'N/A'}</td>
              <td style={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                {mov.motivo}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {movimientos.length === 0 && <p>No hay movimientos registrados.</p>}

      {/* Modal para crear movimiento */}
      {modalCrear && (
        <ModalCrearMovimiento
          onClose={() => setModalCrear(false)}
          onSuccess={fetchMovimientos}
        />
      )}
    </div>
  );
}

export default MovimientosStockPage;


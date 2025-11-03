// En src/pages/MovimientosStockPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import API_URL from '../apiConfig';

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
  const { token } = useAuth();

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

  return (
    <div className="gestor-container" style={{maxWidth: '1200px'}}>
      <h2>Movimientos de Stock</h2>

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
    </div>
  );
}

export default MovimientosStockPage;


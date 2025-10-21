// En src/pages/GestionPedidosPage.jsx
import { useState, useEffect } from 'react';  
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import API_URL from '../apiConfig'; // <-- CORRECCIÓN

const statusLabels = {
  PENDIENTE_PAGO: "Pendiente de Pago",
  EN_PREPARACION: "En Preparación",
  LISTO_PARA_RETIRO: "Listo para Retiro",
  ENTREGADO: "Entregado",
  CERRADO: "Cerrado",
  CANCELADO: "Cancelado",
  POR_ASIGNAR: "Por Asignar"
};

const FILTROS_STATUS = [
  { key: '', label: 'Todos' },
  { key: 'POR_ASIGNAR', label: 'Por Asignar' },
  { key: 'PENDIENTE_PAGO', label: 'Pendiente Pago' },
  { key: 'EN_PREPARACION', label: 'En Preparación' },
  { key: 'LISTO_PARA_RETIRO', label: 'Listo para Retiro' },
];

function GestionPedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const { user, token } = useAuth();

  const esAlmacen = user && user.groups.includes('Almacen');

  const fetchPedidos = async () => {
    if (!token) return;
    const url = `${API_URL}/ventas/?status=${filtroStatus}`;
    try {
      const response = await fetch(url, { headers: { 'Authorization': `Token ${token}` } });
      const data = await response.json();
      setPedidos(data.results || data);
    } catch (error) {
      toast.error("No se pudieron cargar los pedidos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, [token, filtroStatus]);

  if (cargando) return <p>Cargando gestión de pedidos...</p>;

  return (
    <div className="gestor-container" style={{maxWidth: '1200px'}}>
        <h2>Gestión de Pedidos</h2>

        <div className="modal-tabs" style={{marginBottom: '1rem'}}>
          {FILTROS_STATUS.map(filtro => (
            <button 
              key={filtro.key}
              onClick={() => setFiltroStatus(filtro.key)}
              className={`modal-tab-button ${filtroStatus === filtro.key ? 'active' : ''}`}
            >
              {filtro.label}
            </button>
          ))}
        </div>

        <table id="resultsTable">
        <thead>
          <tr>
            <th className="col-id">ID Pedido</th>
            <th className="col-cliente">Cliente</th>
            <th className="col-vendedor">Vendedor</th>
            <th className="col-fecha">Fecha</th>
            {!esAlmacen && <th className="col-total">Total</th>}
            {!esAlmacen && <th className="col-pago">Estado Pago</th>}
            <th className="col-estado">Estado Pedido</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map(pedido => (
            <tr key={pedido.id}>
              <td className="celda-clicable">
                <Link to={`/gestion-pedidos/${pedido.id}`}>#{pedido.id}</Link>
              </td>
              <td>{pedido.usuario?.username || 'N/A'}</td>
              <td>{pedido.vendedor_asignado?.username || '---'}</td>
              <td>{new Date(pedido.fecha).toLocaleDateString()}</td>
              {!esAlmacen && <td>${pedido.total}</td>}
              {!esAlmacen && <td style={{fontWeight: 'bold'}}>{pedido.status_pago.replace(/_/g, ' ')}</td>}
              <td>{statusLabels[pedido.status] || pedido.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default GestionPedidosPage;
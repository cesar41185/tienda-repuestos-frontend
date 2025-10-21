// En src/pages/GestionPedidosPage.jsx
import { useState, useEffect, useMemo } from 'react';  
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ModalGestionarPago from '../components/ModalGestionarPago';
import { Link } from 'react-router-dom';

const workflow = {
  EN_PREPARACION: {
    siguientes: ['LISTO_PARA_RETIRO', 'CANCELADO'],
    roles: ['Administrador', 'Almacen'],
  },
  LISTO_PARA_RETIRO: {
    siguientes: ['ENTREGADO'],
    roles: ['Administrador', 'Vendedor'],
  },
  ENTREGADO: {
    siguientes: ['CERRADO'],
    roles: ['Administrador', 'Cajero'],
  }
  // Nota: No definimos PENDIENTE_PAGO aquí porque se maneja con el modal de Pago.
};

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
  const [pedidoParaPago, setPedidoParaPago] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState(''); // Estado para el filtro activo
  const { user, token } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;;

  const esAdmin = user && user.groups.includes('Administrador');
  const esVendedor = user && user.groups.includes('Vendedor');
  const esCajero = user && user.groups.includes('Cajero');
  const esAlmacen = user && user.groups.includes('Almacen');

  // --- 3. FUNCIÓN QUE CALCULA LAS OPCIONES DISPONIBLES ---
  const getOpcionesDisponibles = (pedido) => {
    if (!user) return [];
    const regla = workflow[pedido.status];
    if (!regla) return [];

    const tienePermisoDeRol = user.groups.some(rol => regla.roles.includes(rol));
    if (!tienePermisoDeRol) return [];

    let opciones = regla.siguientes;

    // REGLA NUEVA: Solo el admin puede Cancelar o Cerrar
    if (!esAdmin) {
      opciones = opciones.filter(opcion => opcion !== 'CANCELADO' && opcion !== 'CERRADO');
    }
    
    return opciones;
  };


  const fetchPedidos = async () => {
    if (!token) return;
    // La URL ahora incluye el filtro de status
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

  // El useEffect ahora se ejecuta cuando cambia el token O el filtro
  useEffect(() => {
    fetchPedidos();
  }, [token, filtroStatus]);

  const handleTomarPedido = async (pedidoId) => {
    try {
      toast.loading('Asignando pedido...');
      const response = await fetch(`${API_URL}/ventas/${pedidoId}/asignar_vendedor/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` },
      });
      toast.dismiss();
      if (!response.ok) throw new Error('No se pudo tomar el pedido.');
      const data = await response.json();
      toast.success(data.status);
      fetchPedidos(); // Recarga la lista
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  const handleStatusChange = async (pedidoId, nuevoStatus) => {
    try {
      toast.loading('Actualizando estado...');
      const response = await fetch(`${API_URL}/ventas/${pedidoId}/actualizar_estado/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({ status: nuevoStatus }),
      });
      
      const data = await response.json();
      toast.dismiss();

      if (!response.ok) throw new Error(data.error || 'No se pudo actualizar el estado.');
      
      toast.success(data.status);
      fetchPedidos(); // Recarga la lista de pedidos para mostrar el cambio
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  const handleCloseModalPago = () => {
    setPedidoParaPago(null);
    fetchPedidos(); // Refresca la lista al cerrar el modal
  };

  if (cargando) return <p>Cargando gestión de pedidos...</p>;

  return (
    <div className="gestor-container" style={{maxWidth: '1200px'}}>
        <h2>Gestión de Pedidos</h2>

        {/* --- Pestañas de Filtro --- */}
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
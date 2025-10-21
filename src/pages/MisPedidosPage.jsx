// En src/pages/MisPedidosPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import API_URL from '../apiConfig';

function MisPedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { token } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;;

  useEffect(() => {
    const fetchPedidos = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/ventas/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        if (!response.ok) throw new Error('No se pudieron cargar los pedidos.');
        const data = await response.json();
        setPedidos(data.results || data);
      } catch (error) {
        console.error(error);
      } finally {
        setCargando(false);
      }
    };
    fetchPedidos();
  }, [token]);

  if (cargando) return <p>Cargando tus pedidos...</p>;

  return (
    <div className="gestor-container">
      <h2>Mis Pedidos</h2>
      {pedidos.length === 0 ? (
        <p>Aún no has realizado ninguna compra.</p>
      ) : (
        <ul className="gestor-lista">
          {pedidos.map(pedido => (
            <li key={pedido.id}>
              <div>
                <strong>Pedido #{pedido.id}</strong>
                <p>Fecha: {new Date(pedido.fecha).toLocaleDateString()}</p>
                <p>Total: ${pedido.total}</p>
              </div>
              <Link to={`/pedidos/${pedido.id}`}>Ver Detalles</Link> {/* Futura página de detalle */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MisPedidosPage;
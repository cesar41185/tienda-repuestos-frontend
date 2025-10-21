// En src/pages/DetallePedidoPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function DetallePedidoPage() {
  const { id } = useParams(); // Obtiene el ID del pedido de la URL
  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const { token } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;;

  useEffect(() => {
    const fetchPedido = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/ventas/${id}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        if (!response.ok) throw new Error('Pedido no encontrado.');
        const data = await response.json();
        setPedido(data);
      } catch (error) {
        console.error(error);
      } finally {
        setCargando(false);
      }
    };
    fetchPedido();
  }, [id, token]);

  if (cargando) return <p>Cargando detalle del pedido...</p>;
  if (!pedido) return <p>No se pudo encontrar el pedido.</p>;

  return (
    <div className="gestor-container">
      <h2>Detalle del Pedido #{pedido.id}</h2>
      <p><strong>Fecha:</strong> {new Date(pedido.fecha).toLocaleDateString()}</p>
      <p><strong>Total:</strong> ${pedido.total}</p>
      <hr />
      <h4>Productos en este pedido:</h4>
      <ul className="gestor-lista">
        {pedido.detalles.map(detalle => (
          <li key={detalle.producto.id}>
            <span>
                {detalle.cantidad} x ({detalle.producto.codigo_interno}) {detalle.producto.modelo}      
            </span>
            <span>
              Subtotal: ${detalle.subtotal}
            </span>
          </li>
        ))}
      </ul>
      <Link to="/mis-pedidos" className="btn btn-primary" style={{marginTop: '20px'}}>Volver a Mis Pedidos</Link>
    </div>
  );
}

export default DetallePedidoPage;
// En src/pages/DetallePedidoPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_URL from '../apiConfig';
import ModalCrearDevolucion from '../components/ModalCrearDevolucion';


function DetallePedidoPage() {
  const { id } = useParams(); // Obtiene el ID del pedido de la URL
  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modalDevolucion, setModalDevolucion] = useState(false);
  const { token } = useAuth();

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

  const handleGenerarPDF = async () => {
    try {
      const response = await fetch(`${API_URL}/ventas/${id}/generar_pdf/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('No se pudo generar el PDF.');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `venta_${pedido.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    }
  };

  if (cargando) return <p>Cargando detalle del pedido...</p>;
  if (!pedido) return <p>No se pudo encontrar el pedido.</p>;

  return (
    <>
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
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '20px' }}>
        <button 
          className="btn btn-info"
          onClick={handleGenerarPDF}
        >
          📄 Generar PDF
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => setModalDevolucion(true)}
        >
          Solicitar Devolución
        </button>
        <Link to="/mis-pedidos" className="btn btn-primary">Volver a Mis Pedidos</Link>
      </div>
    </div>
    
    {modalDevolucion && pedido && (
      <ModalCrearDevolucion
        venta={pedido}
        onClose={() => setModalDevolucion(false)}
        onSuccess={() => {
          setModalDevolucion(false);
        }}
      />
    )}
    </>
  );
}

export default DetallePedidoPage;
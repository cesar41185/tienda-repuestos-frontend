import { Link, useNavigate } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext';

function CarritoPage() {
  const { carrito, eliminarDelCarrito, actualizarCantidad, finalizarCompra } = useCarrito();
  const navigate = useNavigate();

  const handleFinalizarCompra = async () => {
    const exito = await finalizarCompra();
    if (exito) {
      navigate('/');
    }
  };

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + (item.precio_venta * item.cantidad), 0).toFixed(2);
  };

  if (!carrito || carrito.length === 0) {
    return (
      <div className="carrito-container carrito-vacio">
        <h2>Tu carrito está vacío</h2>
        <p>No has añadido ningún producto todavía.</p>
        <Link to="/" className="finalizar-compra-btn" style={{ textDecoration: 'none' }}>
          ← Volver a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="carrito-container">
      <h2>🛒 Tu Carrito de Compras</h2>
      <ul className="carrito-lista">
        {carrito.map(item => (
          <li key={item.id} className="carrito-item">
                <img 
                src={item.fotos?.[0]?.imagen || '/placeholder.png'} // Muestra la primera foto o una imagen por defecto
                alt={item.codigo_interno} 
                className="carrito-item-img"
            />
            
            {/* Columna de Detalles del Producto */}
            <div className="carrito-item-details">
                <span className="carrito-item-modelo">{item.aplicaciones?.[0]?.modelo_vehiculo || item.codigo_interno}</span>
                <span className="carrito-item-codigo">{item.codigo_interno}</span>
                <span className="carrito-item-precio-unitario">${item.precio_venta} c/u</span>
            </div>

            {/* Columna de Controles */}
            <div className="carrito-item-controles">
                <input 
                type="number" 
                className="carrito-cantidad-input"
                value={item.cantidad}
                onChange={(e) => actualizarCantidad(item.id, parseInt(e.target.value, 10))}
                min="1"
                />
                <span className="carrito-item-subtotal">
                ${(item.precio_venta * item.cantidad).toFixed(2)}
                </span>
                <button 
                className="carrito-eliminar-btn" 
                onClick={() => eliminarDelCarrito(item.id)}
                title="Eliminar producto"
                >
                🗑️
                </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="carrito-acciones">
        <Link to="/" className="seguir-comprando-btn">
          ← Seguir Comprando
        </Link>
        <div className="carrito-checkout">
          <strong>Total: ${calcularTotal()}</strong>
          <button onClick={handleFinalizarCompra} className="finalizar-compra-btn">
            Finalizar Compra
          </button>
        </div>
      </div>
    </div>
  );
}

export default CarritoPage;
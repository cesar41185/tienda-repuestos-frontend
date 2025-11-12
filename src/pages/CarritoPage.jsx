import { Link, useNavigate } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext';
import { useAuth } from '../context/AuthContext';
import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { JUEGO_UNIDADES } from '../apiConfig';

function CarritoPage() {
  const { carrito, clienteActivo, eliminarDelCarrito, actualizarCantidadJuegos, finalizarCompra } = useCarrito();  
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const isStaff = user && user.groups.length > 0;

  const itemsSinStock = useMemo(() =>
    carrito.filter(item => item.cantidad > item.stock),
    [carrito]
  );
  const compraEsPosible = itemsSinStock.length === 0;

  const handleFinalizarCompra = async () => {
    if (!compraEsPosible) {
      toast.error("Ajusta las cantidades antes de continuar.");
      return;
    }
    const exito = await finalizarCompra(token);
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
            <img src={item.fotos?.[0]?.imagen || '/placeholder.png'} alt={item.codigo_interno} className="carrito-item-img" />
            <div className="carrito-item-details">
              <span className="carrito-item-modelo">{item.vehiculos?.[0]?.modelo || item.codigo_interno}</span>
              <span className="carrito-item-codigo">{item.cantidad} unidades ({item.cantidad / JUEGO_UNIDADES} juego/s)</span>
              {item.cantidad > item.stock && (
                <span className="carrito-item-advertencia">Stock insuficiente</span>
              )}
            </div>
            <div className="carrito-item-controles">
              <input 
                type="number" 
                className="carrito-cantidad-input"
                // El valor es la cantidad de JUEGOS
                value={item.cantidad / JUEGO_UNIDADES}
                // Al cambiar, llamamos a la nueva función
                onChange={(e) => actualizarCantidadJuegos(item.id, parseInt(e.target.value, 10))}
                min="1"
              />
              <span style={{ whiteSpace: 'nowrap' }}> juego(s)</span>
              <span className="carrito-item-subtotal">${(item.precio_venta * item.cantidad).toFixed(2)}</span>
              <button className="carrito-eliminar-btn" onClick={() => eliminarDelCarrito(item.id)}>🗑️</button>
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
          {!compraEsPosible && (
            <p className="carrito-advertencia-general">
              Por favor, ajusta las cantidades de los productos marcados.
            </p>
          )}
          <button onClick={handleFinalizarCompra} className="finalizar-compra-btn">
            Finalizar Compra
          </button>
        </div>
      </div>
    </div>
  );
}

export default CarritoPage;
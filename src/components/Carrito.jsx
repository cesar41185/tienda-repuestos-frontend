// En src/components/Carrito.jsx

function Carrito({ items, onFinalizarCompra }) {
  if (items.length === 0) {
    return null; // No mostrar nada si el carrito está vacío
  }

  const calcularTotal = () => {
    return items.reduce((total, item) => total + (item.precio_venta * item.cantidad), 0).toFixed(2);
  };

  return (
    <div className="carrito-container">
      <h2>🛒 Carrito de Compras</h2>
      <ul>
        {items.map(item => (
          <li key={item.id}>
            <span>{item.cantidad} x {item.codigo_interno}</span>
            <span>${(item.precio_venta * item.cantidad).toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <hr />
      <div className="carrito-total">
        <strong>Total: ${calcularTotal()}</strong>
        <button onClick={onFinalizarCompra}>Finalizar Compra</button>
      </div>
    </div>
  );
}

export default Carrito;
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import API_URL from '../apiConfig';

function ModalCrearDevolucion({ venta, onClose, onSuccess }) {
  const { user, token } = useAuth();
  const [motivo, setMotivo] = useState('');
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (venta && venta.detalles) {
      // Pre-cargar productos de la venta
      const items = venta.detalles.map(detalle => ({
        producto_id: detalle.producto,
        producto_codigo: detalle.producto_codigo,
        cantidad_vendida: detalle.cantidad,
        cantidad_devolver: 0,
        precio_unitario: detalle.precio_unitario,
        subtotal: 0
      }));
      setDetalles(items);
    }
  }, [venta]);

  const handleCantidadChange = (index, value) => {
    const newDetalles = [...detalles];
    const cantidad = Math.max(0, Math.min(parseInt(value) || 0, newDetalles[index].cantidad_vendida));
    newDetalles[index].cantidad_devolver = cantidad;
    newDetalles[index].subtotal = cantidad * parseFloat(newDetalles[index].precio_unitario);
    setDetalles(newDetalles);
  };

  const getTotalDevolucion = () => {
    return detalles.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar que haya al menos un producto a devolver
    const itemsADevolver = detalles.filter(d => d.cantidad_devolver > 0);
    if (itemsADevolver.length === 0) {
      toast.error('Debe seleccionar al menos un producto para devolver');
      return;
    }

    if (!motivo.trim()) {
      toast.error('Debe proporcionar un motivo para la devolución');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/devoluciones/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          venta: venta.id,
          motivo: motivo,
          detalles: itemsADevolver.map(item => ({
            producto: item.producto_id,
            cantidad: item.cantidad_devolver,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal
          }))
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al crear la devolución');
      }

      toast.success('Devolución creada exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Error al crear la devolución');
    } finally {
      setLoading(false);
    }
  };

  if (!venta) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <h2>Crear Devolución - Pedido #{venta.id}</h2>
        
        <form onSubmit={handleSubmit}>
          <h4>Productos del Pedido</h4>
          <div className="devolucion-productos">
            {detalles.map((detalle, index) => (
              <div key={index} className="devolucion-item">
                <div className="devolucion-item-info">
                  <strong>{detalle.producto_codigo}</strong>
                  <span>Vendidos: {detalle.cantidad_vendida}</span>
                  <span>Precio: ${parseFloat(detalle.precio_unitario).toFixed(2)}</span>
                </div>
                <div className="devolucion-item-controls">
                  <label>Cantidad a devolver:</label>
                  <input
                    type="number"
                    min="0"
                    max={detalle.cantidad_vendida}
                    value={detalle.cantidad_devolver || ''}
                    onChange={(e) => handleCantidadChange(index, e.target.value)}
                  />
                  <span className="devolucion-subtotal">
                    ${detalle.subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="devolucion-total">
            <strong>Total a Devolver: ${getTotalDevolucion().toFixed(2)}</strong>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <label htmlFor="motivo">
              <strong>Motivo de la Devolución:</strong>
            </label>
            <textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows="4"
              placeholder="Describe el motivo de la devolución..."
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Devolución'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalCrearDevolucion;

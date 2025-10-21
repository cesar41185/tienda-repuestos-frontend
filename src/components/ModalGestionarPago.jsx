// En src/components/ModalGestionarPago.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function ModalGestionarPago({ pedido, isOpen, onClose, onSave }) {
  const [statusPago, setStatusPago] = useState('');
  const [montoPagado, setMontoPagado] = useState(0);
  const [esCredito, setEsCredito] = useState(false);
  const [montoAbono, setMontoAbono] = useState('');

  const { token } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;;

  useEffect(() => {
    if (pedido) {
      setStatusPago(pedido.status_pago);
      setMontoPagado(pedido.monto_pagado);
      setEsCredito(pedido.es_credito);
      setMontoAbono('');
    }
  }, [pedido]);

  const handleSubmitOriginal = async (e) => {
    e.preventDefault();
    const payload = { status_pago: statusPago, monto_pagado: montoPagado, es_credito: esCredito };
    await actualizarPago(payload);
  };

  const handleRegistrarAbono = async (e) => {
    e.preventDefault();
    const payload = { abono: parseFloat(montoAbono) };
    await actualizarPago(payload);
  };

  // Función genérica para actualizar el pago
  const actualizarPago = async (payload) => {
    try {
      toast.loading('Actualizando pago...');
      const response = await fetch(`${API_URL}/ventas/${pedido.id}/actualizar_pago/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify(payload),
      });
      toast.dismiss();
      if (!response.ok) throw new Error('No se pudo actualizar el pago.');

      toast.success('Pago actualizado con éxito.');
      onSave();
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  if (!isOpen || !pedido) return null;

  const saldoPendiente = (pedido.total - pedido.monto_pagado).toFixed(2);

return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Gestionar Pago del Pedido #{pedido.id}</h2>

        {/* --- Lógica Condicional: Muestra un formulario u otro --- */}
        {pedido.status_pago === 'A_CREDITO' ? (
          // --- Formulario para registrar ABONOS ---
          <form onSubmit={handleRegistrarAbono} className="auth-form">
            <p><strong>Total del Pedido:</strong> ${pedido.total}</p>
            <p><strong>Monto Pagado:</strong> ${pedido.monto_pagado}</p>
            <p style={{color: 'red', fontWeight: 'bold'}}><strong>Saldo Pendiente:</strong> ${saldoPendiente}</p>
            <hr/>
            <label htmlFor="monto_abono">Monto del Abono</label>
            <input 
              id="monto_abono"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={montoAbono}
              onChange={(e) => setMontoAbono(e.target.value)}
              required
            />
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Registrar Abono</button>
            </div>
          </form>
        ) : (
          // --- Formulario ORIGINAL para cambiar estado ---
          <form onSubmit={handleSubmitOriginal} className="auth-form">
            <label htmlFor="status_pago">Estado del Pago</label>
            <select id="status_pago" value={statusPago} onChange={(e) => setStatusPago(e.target.value)}>
              <option value="PENDIENTE">Pendiente de Pago</option>
              <option value="PAGADO">Pagado</option>
              <option value="A_CREDITO">A Crédito</option>
              <option value="SOLICITUD_CREDITO">Solicitud de Crédito</option>
            </select>

            <label htmlFor="monto_pagado">Monto Pagado</label>
            <input id="monto_pagado" type="number" step="0.01" value={montoPagado} onChange={(e) => setMontoPagado(e.target.value)} />

            <label htmlFor="es_credito" style={{flexDirection: 'row', alignItems: 'center', gap: '10px'}}>
              <input id="es_credito" type="checkbox" checked={esCredito} onChange={(e) => setEsCredito(e.target.checked)} />
              Marcar como Venta a Crédito
            </label>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Guardar Cambios</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ModalGestionarPago;
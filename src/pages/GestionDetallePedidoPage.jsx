// En src/pages/GestionDetallePedidoPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import API_URL from '../apiConfig';
import ModalCrearDevolucion from '../components/ModalCrearDevolucion';

function GestionDetallePedidoPage() {
  const { id } = useParams();
  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [archivoComprobante, setArchivoComprobante] = useState(null);
  const [montoComprobante, setMontoComprobante] = useState('');
  const [modalDevolucion, setModalDevolucion] = useState(false);
  const { token, user } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;

  // --- Variables de Ayuda para Roles ---
  const esAdmin = user && user.groups.includes('Administrador');
  const esVendedor = user && user.groups.includes('Vendedor');
  const esCajero = user && user.groups.includes('Cajero');
  const esAlmacen = user && user.groups.includes('Almacen');

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
  useEffect(() => {
    fetchPedido();
  }, [id, token]);

  const handleFileSelect = (e) => {
    setArchivoComprobante(e.target.files[0]);
  };

  const handleUploadComprobante = async () => {
    if (!archivoComprobante || !montoComprobante) {
      toast.error('Por favor, selecciona un archivo y especifica el monto.');
      return;
    }


    const formData = new FormData();
    formData.append('imagen', archivoComprobante);
    formData.append('monto', montoComprobante);

    try {
      toast.loading('Subiendo comprobante...');
      const response = await fetch(`${API_URL}/ventas/${id}/subir_comprobante/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }, // No necesitas 'Content-Type'
        body: formData,
      });
      toast.dismiss();
      if (!response.ok) throw new Error('Error al subir el archivo.');

      toast.success('Comprobante subido con éxito.');
      setArchivoComprobante(null); // Limpia el input
      setMontoComprobante('');
      fetchPedido(); // Recarga los datos del pedido para mostrar el nuevo comprobante
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

   const handleAprobarComprobante = async (comprobanteId) => {
    try {
      toast.loading('Aprobando comprobante...');
      const response = await fetch(`${API_URL}/ventas/${id}/aprobar_comprobante/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({ comprobante_id: comprobanteId }),
      });
      toast.dismiss();
      if (!response.ok) throw new Error('No se pudo aprobar el comprobante.');

      toast.success('Comprobante aprobado y saldo actualizado.');
      fetchPedido();
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  const handleStatusChange = async (nuevoStatus) => {
    try {
      toast.loading(`Cambiando estado a ${nuevoStatus.replace('_', ' ')}...`);
      await fetch(`${API_URL}/ventas/${id}/actualizar_estado/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify({ status: nuevoStatus }),
      });
      toast.dismiss();
      toast.success('Estado actualizado.');
      fetchPedido();
    } catch (error) {
      toast.dismiss();
      toast.error('No se pudo cambiar el estado.');
    }
  };

  const handleDarCredito = async () => {
    try {
      toast.loading('Otorgando crédito...');
      await fetch(`${API_URL}/ventas/${id}/actualizar_pago/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify({ es_credito: true }),
      });
      toast.dismiss();
      toast.success('Crédito otorgado. El pedido pasa a preparación.');
      fetchPedido();
    } catch (error) {
      toast.dismiss();
      toast.error('No se pudo otorgar el crédito.');
    }
  };

  const handleAprobarParaPrepa = async () => {
    try {
      toast.loading('Aprobando para preparación...');
      const response = await fetch(`${API_URL}/ventas/${id}/aprobar_para_preparacion/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` },
      });
      toast.dismiss();
      if (!response.ok) throw new Error('No se pudo aprobar el pedido.');
      toast.success('Pedido enviado a preparación.');
      fetchPedido(); // Recarga los datos para ver los cambios
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    }
};

  const handleAprobarPago = async () => {
    try {
      toast.loading('Aprobando pago...');
      const response = await fetch(`${API_URL}/ventas/${id}/actualizar_pago/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({ status_pago: 'PAGADO' }),
      });
      toast.dismiss();
      if (!response.ok) throw new Error('No se pudo aprobar el pago.');

      toast.success('Pago aprobado. El pedido pasa a preparación.');
      fetchPedido(); // Recarga los datos para ver el cambio de estado
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  const handleSolicitarCredito = async () => {
    try {
      toast.loading('Solicitando crédito...');
      const response = await fetch(`${API_URL}/ventas/${id}/actualizar_pago/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify({ status_pago: 'SOLICITUD_CREDITO' }),
      });
      toast.dismiss();
      if (!response.ok) throw new Error('No se pudo solicitar el crédito.');
      toast.success('Crédito solicitado. Pendiente por aprobación de Caja.');
      fetchPedido();
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  const handleAprobarCredito = async () => {
    try {
      toast.loading('Aprobando crédito...');
      const response = await fetch(`${API_URL}/ventas/${id}/actualizar_pago/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify({ es_credito: true, status_pago: 'A_CREDITO' }),
      });
      toast.dismiss();
      if (!response.ok) throw new Error('No se pudo aprobar el crédito.');
      toast.success('Crédito aprobado. El pedido pasa a preparación.');
      fetchPedido();
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  const handleTomarPedido = async () => {
    try {
      toast.loading('Asignando pedido...');
      await fetch(`${API_URL}/ventas/${id}/asignar_vendedor/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` },
      });
      toast.dismiss();
      toast.success('Te has asignado el pedido.');
      fetchPedido(); // Recarga los datos para mostrar el cambio
    } catch (error) {
      toast.dismiss();
      toast.error('No se pudo tomar el pedido.');
    }
  };

  const handleAnularComprobante = async (comprobanteId) => {
    if (!window.confirm('¿Estás seguro de que quieres anular este comprobante? Esta acción restará el monto del total pagado.')) {
      return;
    }
    try {
      toast.loading('Anulando comprobante...');
      const response = await fetch(`${API_URL}/ventas/${id}/anular_comprobante/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify({ comprobante_id: comprobanteId }),
      });
      toast.dismiss();
      if (!response.ok) throw new Error('No se pudo anular el comprobante.');
      toast.success('Comprobante anulado con éxito.');
      fetchPedido();
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  const handleCancelarPedido = async () => {
    const motivo = window.prompt('Por favor, introduce el motivo de la cancelación:');
    
    // Si el usuario presiona "Cancelar" o no escribe nada, no hacemos nada.
    if (motivo === null || motivo.trim() === '') {
      toast.error('La cancelación fue abortada.');
      return;
    }

    try {
      toast.loading('Cancelando pedido...');
      await fetch(`${API_URL}/ventas/${id}/actualizar_estado/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        // Enviamos tanto el nuevo estado como el motivo
        body: JSON.stringify({ 
          status: 'CANCELADO',
          motivo_cancelacion: motivo 
        }),
      });
      toast.dismiss();
      toast.success('Pedido cancelado con éxito.');
      fetchPedido(); // Recargamos para ver los cambios
    } catch (error) {
      toast.dismiss();
      toast.error('No se pudo cancelar el pedido.');
    }
  };

  if (cargando) return <p>Cargando detalle del pedido...</p>;
  if (!pedido) return <p>No se pudo encontrar el pedido.</p>;

  const saldoPendiente = (pedido.total - pedido.monto_pagado).toFixed(2);

return (
    <>
    <div className="gestor-container" style={{maxWidth: '1200px'}}>
      <Link to="/gestion-pedidos" className="btn btn-secondary" style={{marginBottom: '20px', display: 'inline-block'}}>
        ← Volver a la Gestión de Pedidos
      </Link>
      <h2>Detalle del Pedido #{pedido.id}</h2>

      {pedido.status === 'CANCELADO' && (
        <div style={{ padding: '10px', background: '#fff5f5', border: '1px solid red', borderRadius: '5px', marginBottom: '1rem' }}>
          <strong style={{ color: 'red' }}>Pedido Cancelado</strong>
          <p style={{ margin: '5px 0 0 0' }}><strong>Motivo:</strong> {pedido.motivo_cancelacion || 'No especificado'}</p>
        </div>
      )}
      
      <div className="form-grid">
        <div><strong>Cliente:</strong> {pedido.usuario?.username || 'N/A'}</div>
        <div><strong>Vendedor Asignado:</strong> {pedido.vendedor_asignado?.username || 'N/A'}</div>
        <div><strong>Fecha:</strong> {new Date(pedido.fecha).toLocaleDateString()}</div>
        <div><strong>Total:</strong> ${pedido.total}</div>
        <div><strong>Monto Pagado:</strong> ${pedido.monto_pagado}</div>
        <div style={{color: saldoPendiente > 0 ? 'red' : 'green', fontWeight: 'bold'}}>
            <strong>Saldo Pendiente:</strong> ${saldoPendiente}
        </div>
        <div><strong>Estado Pedido:</strong> {pedido.status?.replace(/_/g, ' ') || 'N/A'}</div>
        <div><strong>Estado Pago:</strong> {pedido.status_pago?.replace(/_/g, ' ') || 'N/A'}</div>
      </div>

      <hr />
      <h4>Productos en este pedido:</h4>
      <ul className="gestor-lista">
        {pedido.detalles?.map((detalle, index) => (
          <li key={index}>
            <span>
              {detalle.cantidad} x ({detalle.producto?.codigo_interno}) {detalle.producto?.modelo}
            </span>
            <span>Subtotal: ${detalle.subtotal}</span>
          </li>
        ))}
      </ul>
      
      {/* --- PANEL DE ACCIONES DE PERSONAL --- */}
      <hr/>
      <h4>Panel de Acciones</h4>
      <div className="acciones-panel" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Acción para Vendedor/Admin: Tomar un pedido sin asignar */}
          {(esVendedor || esAdmin) && pedido.status === 'POR_ASIGNAR' && (
              <button className="btn btn-primary" onClick={handleTomarPedido}>Asignarme este Pedido</button>
          )}
          {/* Acción para Almacén */}
          {(esAlmacen || esAdmin) && pedido.status === 'EN_PREPARACION' && (
              <button className="btn btn-primary" onClick={() => handleStatusChange('LISTO_PARA_RETIRO')}>Marcar como Listo para Retiro</button>
          )}
          {/* Acción para Vendedor o Admin */}
          {(esVendedor || esAdmin) && pedido.status === 'LISTO_PARA_RETIRO' && (
              <button className="btn btn-primary" onClick={() => handleStatusChange('ENTREGADO')}>Marcar como Entregado</button>
          )}

          {/* === PANEL DE DECISIONES PARA VENDEDOR/ADMIN EN ESTADO 'PENDIENTE_PAGO' === */}
          {(esVendedor || esAdmin) && pedido.status === 'PENDIENTE_PAGO' && (
            <>
              <button className="btn btn-primary" onClick={handleAprobarParaPrepa}>
                Aprobar (Pago Contra Entrega)
              </button>
              <button className="btn btn-info" onClick={handleSolicitarCredito}>
                Solicitar Crédito
              </button>
            </>
          )}
          
          {(esCajero || esAdmin) && pedido.status_pago === 'SOLICITUD_CREDITO' && (
            <button className="btn btn-success" onClick={handleAprobarCredito}>
              ✓ Aprobar Crédito Solicitado
            </button>
          )}

          {/* Acciones para Administrador */}
          {esAdmin && (
            <>
              {/* --- BOTÓN DE CANCELAR (ACTUALIZADO) --- */}
              {pedido.status !== 'CANCELADO' && pedido.status !== 'CERRADO' && (
                <button className="btn btn-danger" onClick={handleCancelarPedido}>
                  Cancelar Pedido
                </button>
              )}
              <button className="btn btn-success" onClick={() => handleStatusChange('CERRADO')} disabled={pedido.status !== 'ENTREGADO' || pedido.status_pago !== 'PAGADO'} title={'Solo se puede cerrar un pedido Entregado y Pagado'}>
                Cerrar Pedido
            </button>

                  {pedido.status_pago === 'PENDIENTE_PAGO' && <button className="btn btn-info" onClick={handleDarCredito}>Otorgar Crédito Directo</button>}
              </>
          )}
      </div>
      
      <hr/>
      <h4>Comprobantes de Pago</h4>
      {pedido.comprobantes && pedido.comprobantes.length > 0 ? (
        pedido.comprobantes.map(comp => (
            // --- 2. SECCIÓN VISUAL DE COMPROBANTES (ACTUALIZADA) ---
            <div key={comp.id} style={{marginBottom: '15px', padding: '10px', border: `1px solid ${comp.status === 'ANULADO' ? 'red' : '#ddd'}`, borderRadius: '5px', background: comp.status === 'ANULADO' ? '#fff5f5' : 'white'}}>
                <a href={comp.imagen} target="_blank" rel="noopener noreferrer">Ver Comprobante #{comp.id}</a>
                <div><strong>Monto:</strong> ${comp.monto}</div>
                <div style={{fontWeight: 'bold'}}><strong>Estado:</strong> {comp.status}</div>
                <div><small>Subido por: {comp.subido_por_details?.username || 'N/A'} el {new Date(comp.fecha_subida).toLocaleDateString()}</small></div>
                
                {comp.status === 'APROBADO' && (
                    <div><small>Aprobado por: {comp.aprobado_por_details?.username || 'N/A'} el {new Date(comp.fecha_aprobacion).toLocaleDateString()}</small></div>
                )}

                {comp.status === 'ANULADO' && (
                    <div style={{color: 'red'}}><small>Anulado por: {comp.anulado_por_details?.username || 'N/A'} el {new Date(comp.fecha_anulacion).toLocaleDateString()}</small></div>
                )}

                {(esAdmin || esCajero) && comp.status === 'PENDIENTE' && (
                    <button className="btn btn-success" style={{marginTop: '10px', fontSize: '0.8rem', padding: '0.2rem 0.5rem'}} onClick={() => handleAprobarComprobante(comp.id)}>
                        ✓ Aprobar
                    </button>
                )}
                {esAdmin && comp.status === 'APROBADO' && (
                    <button className="btn btn-danger" style={{marginTop: '10px', fontSize: '0.8rem', padding: '0.2rem 0.5rem'}} onClick={() => handleAnularComprobante(comp.id)}>
                        Anular Comprobante
                    </button>
                )}
            </div>
         ))
      ) : (
        <p>Aún no se han subido comprobantes de pago.</p>
      )}

      {/* Formulario para subir comprobante (visible para Vendedor, Cajero y Admin) */}
      {(esVendedor || esCajero || esAdmin) && (
        <div className="add-form" style={{marginTop: '1rem'}}>
          <input 
            type="number" 
            placeholder="Monto del comprobante" 
            value={montoComprobante}
            onChange={(e) => setMontoComprobante(e.target.value)}
          />
          <input type="file" onChange={handleFileSelect} />
          <button 
            onClick={handleUploadComprobante} 
            disabled={!archivoComprobante || !montoComprobante}
            className="btn btn-primary"
          >
            Subir Comprobante
          </button>
        </div>
      )}
      
      <hr/>
      <div style={{ marginTop: '1rem' }}>
        <button 
          className="btn btn-secondary"
          onClick={() => setModalDevolucion(true)}
        >
          Solicitar Devolución para Cliente
        </button>
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

export default GestionDetallePedidoPage;
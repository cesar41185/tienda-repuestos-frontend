import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../apiConfig';
import toast from 'react-hot-toast';
import ModalCrearDevolucion from '../components/ModalCrearDevolucion';

function DevolucionesPage() {
  const { token, user } = useAuth();
  const [devoluciones, setDevoluciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalCrear, setModalCrear] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

  const esPersonal = user && user.groups.length > 0;
  const esAdmin = user && user.groups.includes('Administrador');

  useEffect(() => {
    fetchDevoluciones();
  }, [token]);

  const fetchDevoluciones = async () => {
    if (!token) return;
    try {
      setCargando(true);
      const response = await fetch(`${API_URL}/devoluciones/?ordering=-fecha_solicitud`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDevoluciones(data.results || data);
      }
    } catch (error) {
      console.error('Error al cargar devoluciones:', error);
      toast.error('Error al cargar las devoluciones');
    } finally {
      setCargando(false);
    }
  };

  const handleAprobar = async (id) => {
    try {
      const response = await fetch(`${API_URL}/devoluciones/${id}/aprobar/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (response.ok) {
        toast.success('Devolución aprobada');
        fetchDevoluciones();
      } else {
        throw new Error('Error al aprobar');
      }
    } catch (error) {
      toast.error('Error al aprobar la devolución');
    }
  };

  const handleRechazar = async (id, motivoRechazo) => {
    if (!motivoRechazo) {
      toast.error('Debe proporcionar un motivo de rechazo');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/devoluciones/${id}/rechazar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ motivo_rechazo: motivoRechazo })
      });
      
      if (response.ok) {
        toast.success('Devolución rechazada');
        fetchDevoluciones();
      } else {
        throw new Error('Error al rechazar');
      }
    } catch (error) {
      toast.error('Error al rechazar la devolución');
    }
  };

  const handleCompletar = async (id) => {
    try {
      const response = await fetch(`${API_URL}/devoluciones/${id}/completar/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (response.ok) {
        toast.success('Devolución completada y stock actualizado');
        fetchDevoluciones();
      } else {
        throw new Error('Error al completar');
      }
    } catch (error) {
      toast.error('Error al completar la devolución');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDIENTE: { text: 'Pendiente', class: 'badge-warning' },
      APROBADA: { text: 'Aprobada', class: 'badge-success' },
      RECHAZADA: { text: 'Rechazada', class: 'badge-danger' },
      COMPLETADA: { text: 'Completada', class: 'badge-info' }
    };
    const badge = badges[status] || badges.PENDIENTE;
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  if (cargando) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Cargando devoluciones...</p>
      </div>
    );
  }

  return (
    <div className="gestor-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>{esAdmin ? 'Gestión de Devoluciones' : 'Mis Devoluciones'}</h2>
      </div>

      {devoluciones.length === 0 ? (
        <p>No hay devoluciones registradas.</p>
      ) : (
        <div className="devoluciones-list">
          {devoluciones.map(devolucion => (
            <div key={devolucion.id} className="devolucion-card">
              <div className="devolucion-header">
                <div>
                  <strong>Devolución #{devolucion.id}</strong>
                  {getStatusBadge(devolucion.status)}
                </div>
                <div>
                  <span>{new Date(devolucion.fecha_solicitud).toLocaleDateString('es-ES')}</span>
                </div>
              </div>

              <div className="devolucion-info">
                <p><strong>Venta:</strong> #{devolucion.venta_id}</p>
                <p><strong>Cliente:</strong> {devolucion.usuario_nombre}</p>
                <p><strong>Monto:</strong> ${parseFloat(devolucion.monto_devolucion).toFixed(2)}</p>
                <p><strong>Motivo:</strong> {devolucion.motivo}</p>

                {devolucion.motivo_rechazo && (
                  <p style={{ color: '#dc3545' }}>
                    <strong>Motivo de rechazo:</strong> {devolucion.motivo_rechazo}
                  </p>
                )}

                {devolucion.detalles && devolucion.detalles.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <strong>Productos:</strong>
                    <ul>
                      {devolucion.detalles.map((det, idx) => (
                        <li key={idx}>
                          {det.producto_codigo} - Cantidad: {det.cantidad} - 
                          ${parseFloat(det.precio_unitario).toFixed(2)} c/u
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {esAdmin && devolucion.status === 'PENDIENTE' && (
                <div className="devolucion-actions">
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => handleAprobar(devolucion.id)}
                  >
                    ✓ Aprobar
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      const motivo = prompt('Motivo del rechazo:');
                      if (motivo) handleRechazar(devolucion.id, motivo);
                    }}
                  >
                    ✗ Rechazar
                  </button>
                </div>
              )}

              {esAdmin && devolucion.status === 'APROBADA' && (
                <div className="devolucion-actions">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      if (confirm('¿Completar la devolución y actualizar el stock?')) {
                        handleCompletar(devolucion.id);
                      }
                    }}
                  >
                    Completar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DevolucionesPage;

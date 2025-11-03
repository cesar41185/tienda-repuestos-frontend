// En src/pages/ComisionesPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import API_URL from '../apiConfig';

const statusLabels = {
  PENDIENTE: 'Pendiente de Pago',
  PAGADA: 'Pagada',
  CANCELADA: 'Cancelada',
};

function ComisionesPage() {
  const [comisiones, setComisiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { user, token } = useAuth();
  
  const esAdmin = user && user.groups.includes('Administrador');

  const fetchComisiones = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/comisiones/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      setComisiones(data.results || data);
    } catch (error) {
      toast.error('No se pudieron cargar las comisiones.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchComisiones();
  }, [token]);

  const handleMarcarPagada = async (comisionId) => {
    if (!window.confirm('¿Marcar esta comisión como pagada?')) {
      return;
    }

    try {
      toast.loading('Marcando como pagada...');
      const response = await fetch(`${API_URL}/comisiones/${comisionId}/marcar_pagada/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
      toast.dismiss();

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al marcar como pagada');
      }

      toast.success('Comisión marcada como pagada.');
      fetchComisiones();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (cargando) return <p>Cargando comisiones...</p>;

  // Calcular resumen
  const totalPendiente = comisiones
    .filter(c => c.status === 'PENDIENTE')
    .reduce((sum, c) => sum + parseFloat(c.monto_comision || 0), 0);
  
  const totalPagada = comisiones
    .filter(c => c.status === 'PAGADA')
    .reduce((sum, c) => sum + parseFloat(c.monto_comision || 0), 0);

  return (
    <div className="gestor-container" style={{maxWidth: '1200px'}}>
      <h2>Gestión de Comisiones</h2>

      {/* Resumen */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ padding: '1rem', backgroundColor: '#fff5f5', border: '2px solid #ffcccc', borderRadius: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Pendiente de Pago</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#cc0000' }}>
            ${totalPendiente.toFixed(2)}
          </p>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f0fff4', border: '2px solid #c6f6d5', borderRadius: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Total Pagado</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#238636' }}>
            ${totalPagada.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Tabla */}
      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>ID Venta</th>
            <th>Fecha Venta</th>
            <th>Total Venta</th>
            <th>Porcentaje</th>
            <th>Monto Comisión</th>
            <th>Estado</th>
            <th>Fecha Cálculo</th>
            {esAdmin && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {comisiones.map(comision => (
            <tr key={comision.id}>
              <td>#{comision.venta}</td>
              <td>{comision.venta_fecha ? new Date(comision.venta_fecha).toLocaleDateString() : 'N/A'}</td>
              <td>${comision.venta_total || '0.00'}</td>
              <td>{comision.porcentaje_comision}%</td>
              <td style={{ fontWeight: 'bold' }}>${comision.monto_comision}</td>
              <td>
                <span className={`badge badge-${
                  comision.status === 'PAGADA' ? 'success' :
                  comision.status === 'PENDIENTE' ? 'warning' : 'danger'
                }`}>
                  {statusLabels[comision.status]}
                </span>
              </td>
              <td>{new Date(comision.fecha_calculo).toLocaleDateString()}</td>
              {esAdmin && comision.status === 'PENDIENTE' && (
                <td>
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => handleMarcarPagada(comision.id)}
                  >
                    ✓ Marcar como Pagada
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {comisiones.length === 0 && <p>No hay comisiones registradas.</p>}
    </div>
  );
}

export default ComisionesPage;


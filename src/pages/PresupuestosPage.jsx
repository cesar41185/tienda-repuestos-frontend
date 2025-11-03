// En src/pages/PresupuestosPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import API_URL from '../apiConfig';

const statusLabels = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado por Cliente',
  RECHAZADO: 'Rechazado',
  VENCIDO: 'Vencido',
  CONVERTIDO: 'Convertido en Venta',
};

function PresupuestosPage() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { user, token } = useAuth();

  const fetchPresupuestos = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/presupuestos/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      setPresupuestos(data.results || data);
    } catch (error) {
      toast.error('No se pudieron cargar los presupuestos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchPresupuestos();
  }, [token]);

  if (cargando) return <p>Cargando presupuestos...</p>;

  return (
    <div className="gestor-container" style={{maxWidth: '1200px'}}>
      <h2>Presupuestos / Cotizaciones</h2>

      {/* Vista de tabla para desktop */}
      <table id="resultsTable">
        <thead>
          <tr>
            <th className="col-id">ID</th>
            <th className="col-cliente">Cliente</th>
            <th className="col-vendedor">Vendedor</th>
            <th className="col-fecha">Fecha Creación</th>
            <th className="col-fecha">Fecha Vencimiento</th>
            <th className="col-total">Total</th>
            <th className="col-estado">Estado</th>
          </tr>
        </thead>
        <tbody>
          {presupuestos.map(presupuesto => (
            <tr key={presupuesto.id}>
              <td className="celda-clicable">
                <Link to={`/presupuestos/${presupuesto.id}`}>#{presupuesto.id}</Link>
              </td>
              <td>{presupuesto.cliente_nombre || presupuesto.cliente || 'N/A'}</td>
              <td>{presupuesto.vendedor_nombre || presupuesto.vendedor || '---'}</td>
              <td>{new Date(presupuesto.fecha_creacion).toLocaleDateString()}</td>
              <td>{new Date(presupuesto.fecha_vencimiento).toLocaleDateString()}</td>
              <td>${presupuesto.total}</td>
              <td>{statusLabels[presupuesto.status] || presupuesto.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {presupuestos.length === 0 && <p>No hay presupuestos registrados.</p>}
    </div>
  );
}

export default PresupuestosPage;


// En src/pages/InteraccionesCRMPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import API_URL from '../apiConfig';

// Modal para crear interacción
function ModalCrearInteraccion({ cliente, onClose, onSuccess }) {
  const [tipo, setTipo] = useState('LLAMADA');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [proximaAccion, setProximaAccion] = useState('');
  const [fechaProximaAccion, setFechaProximaAccion] = useState('');
  const [cargando, setCargando] = useState(false);
  const { token } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo || !descripcion) {
      toast.error('Por favor completa los campos requeridos.');
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/interacciones/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          cliente: cliente,
          tipo: tipo,
          titulo: titulo,
          descripcion: descripcion,
          proxima_accion: proximaAccion,
          fecha_proxima_accion: fechaProximaAccion || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la interacción');
      }

      toast.success('Interacción registrada con éxito.');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Registrar Interacción</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tipo de Interacción:</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              required
            >
              <option value="LLAMADA">Llamada</option>
              <option value="REUNION">Reunión</option>
              <option value="CORREO">Correo Electrónico</option>
              <option value="VISITA">Visita</option>
              <option value="NOTA">Nota</option>
            </select>
          </div>

          <div className="form-group">
            <label>Título / Asunto:</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Descripción:</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label>Próxima Acción (opcional):</label>
            <textarea
              value={proximaAccion}
              onChange={(e) => setProximaAccion(e.target.value)}
              rows="2"
            />
          </div>

          <div className="form-group">
            <label>Fecha Próxima Acción (opcional):</label>
            <input
              type="date"
              value={fechaProximaAccion}
              onChange={(e) => setFechaProximaAccion(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={cargando}>
              {cargando ? 'Registrando...' : 'Registrar Interacción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const tipoLabels = {
  LLAMADA: 'Llamada',
  REUNION: 'Reunión',
  CORREO: 'Correo Electrónico',
  VISITA: 'Visita',
  NOTA: 'Nota',
};

function InteraccionesCRMPage() {
  const [interacciones, setInteracciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [modalCrear, setModalCrear] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const { token, user } = useAuth();

  const puedeCrear = user && (user.groups.includes('Administrador') || user.groups.includes('Vendedor'));

  const fetchInteracciones = async () => {
    if (!token) return;
    let url = `${API_URL}/interacciones/`;
    const params = new URLSearchParams();
    if (filtroCliente) params.append('cliente', filtroCliente);
    if (filtroTipo) params.append('tipo', filtroTipo);
    if (params.toString()) url += `?${params.toString()}`;

    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      setInteracciones(data.results || data);
    } catch (error) {
      toast.error('No se pudieron cargar las interacciones.');
    } finally {
      setCargando(false);
    }
  };

  const fetchClientes = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/clientes/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      setClientes(data.results || data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  useEffect(() => {
    fetchInteracciones();
    if (puedeCrear) {
      fetchClientes();
    }
  }, [token, filtroCliente, filtroTipo]);

  if (cargando) return <p>Cargando interacciones...</p>;

  return (
    <div className="gestor-container" style={{maxWidth: '1200px'}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Historial de Interacciones CRM</h2>
        {puedeCrear && clientes.length > 0 && (
          <button className="btn btn-primary" onClick={() => setModalCrear(true)}>
            ➕ Registrar Interacción
          </button>
        )}
      </div>

      {/* Filtros */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {clientes.length > 0 && (
          <select
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
            style={{ padding: '0.5rem', minWidth: '200px' }}
          >
            <option value="">Todos los Clientes</option>
            {clientes.map(cli => (
              <option key={cli.id} value={cli.id}>
                {cli.username}
              </option>
            ))}
          </select>
        )}

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          style={{ padding: '0.5rem' }}
        >
          <option value="">Todos los Tipos</option>
          {Object.entries(tipoLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        {(filtroCliente || filtroTipo) && (
          <button
            className="btn btn-secondary"
            onClick={() => {
              setFiltroCliente('');
              setFiltroTipo('');
            }}
          >
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* Lista de interacciones */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {interacciones.map(int => (
          <div
            key={int.id}
            style={{
              padding: '1rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: 'white'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{int.titulo}</h3>
                <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                  {tipoLabels[int.tipo]} con {int.cliente_nombre} - {new Date(int.fecha).toLocaleString()}
                </p>
              </div>
              <span className="badge badge-info">{tipoLabels[int.tipo]}</span>
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <p style={{ margin: 0 }}>{int.descripcion}</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#666' }}>
              <span><strong>Registrado por:</strong> {int.realizada_por_nombre || 'N/A'}</span>
              {int.venta && <span><strong>Referencia Venta:</strong> #{int.venta}</span>}
              {int.presupuesto && <span><strong>Referencia Presupuesto:</strong> #{int.presupuesto}</span>}
            </div>

            {int.proxima_accion && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                <strong>Próxima Acción:</strong> {int.proxima_accion}
                {int.fecha_proxima_accion && (
                  <span style={{ marginLeft: '1rem' }}>
                    <strong>Fecha:</strong> {new Date(int.fecha_proxima_accion).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {interacciones.length === 0 && <p>No hay interacciones registradas.</p>}

      {/* Modal para crear interacción */}
      {modalCrear && (
        <ModalCrearInteraccion
          cliente={clienteSeleccionado}
          onClose={() => {
            setModalCrear(false);
            setClienteSeleccionado('');
          }}
          onSuccess={fetchInteracciones}
        />
      )}
    </div>
  );
}

export default InteraccionesCRMPage;


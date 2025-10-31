// En src/pages/ListaClientesPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import { useNavigate } from 'react-router-dom';
import ModalRegistrarCliente from '../components/ModalRegistrarCliente';
import ModalDetalleCliente from '../components/ModalDetalleCliente';
import API_URL from '../apiConfig';

function ListaClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vendedores, setVendedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState(null);

  const { seleccionarCliente } = useCarrito();
  const navigate = useNavigate();
  const { token } = useAuth();

  const fetchClientes = async () => {
    if (!token) return;
    const url = `${API_URL}/clientes/?search=${searchTerm}`;
    try {
      setCargando(true);
      const response = await fetch(url, { headers: { 'Authorization': `Token ${token}` } });
      const data = await response.json();
      setClientes(data.results || data);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const fetchVendedores = async () => {
        try {
            const response = await fetch(`${API_URL}/vendedores/`, { headers: { 'Authorization': `Token ${token}` } });
            const data = await response.json();
            setVendedores(data.results || data);
        } catch (error) { console.error("Error al cargar vendedores:", error); }
    };

    const fetchCategorias = async () => {
        try {
            const response = await fetch(`${API_URL}/categorias-cliente/`, { headers: { 'Authorization': `Token ${token}` } });
            const data = await response.json();
            setCategorias(data.results || data);
        } catch (error) { console.error("Error al cargar categorías:", error); }
    };

    if (token) {
        fetchVendedores();
        fetchCategorias();
    }
  }, [token]);

  useEffect(() => {
    fetchClientes();
  }, [token, searchTerm]);

  const handleClienteRegistrado = () => {
    setModalRegistroAbierto(false);
    fetchClientes();
  };

  const handleSeleccionarParaVenta = (cliente) => {
    seleccionarCliente(cliente);
    navigate('/');
  };

  if (cargando && clientes.length === 0) return <p>Cargando clientes...</p>;
  
  return (
    <>
      <div className="gestor-container" style={{maxWidth: '1000px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
          <h2>Lista de Clientes</h2>
          <button className="btn btn-primary" onClick={() => setModalRegistroAbierto(true)}>
            + Registrar Cliente
          </button>
        </div>

        <div className="gestor-form" style={{marginBottom: '1rem'}}>
          <input 
            type="text"
            placeholder="Buscar por código, nombre o cédula/RIF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{width: '100%'}}
          />
        </div>

        {/* Vista de tabla para desktop */}
        <table id="resultsTable" className="tabla-clientes">
          <thead>
            <tr>
              <th className="col-cliente-codigo">Código</th>
              <th className="col-cliente-nombre">Nombre</th>
              <th className="col-cliente-categoria">Categoría</th>
              <th className="col-cliente-telefono">Teléfono</th>
              <th className="col-cliente-vendedor">Vendedor Asignado</th>
              <th className="col-cliente-ciudad">Ciudad</th>
              <th className="col-cliente-estado">Estado</th>
              <th className="col-cliente-accion">Acción</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map(cliente => (
              <tr key={cliente.pk}>
                <td className="celda-clicable col-cliente-codigo">
                  <a onClick={() => setClienteSeleccionadoId(cliente.pk)}>
                    {cliente.perfil.codigo_cliente}
                  </a>
                </td>
                <td className="col-cliente-nombre">{cliente.perfil.nombre_completo || cliente.username}</td>
                <td className="col-cliente-categoria">{cliente.perfil.categoria?.nombre || '---'}</td>
                <td className="col-cliente-telefono">{cliente.perfil.telefono}</td>
                <td className="col-cliente-vendedor">{cliente.perfil.vendedor_asignado_nombre || '---'}</td>
                <td className="col-cliente-ciudad">{cliente.perfil.ciudad}</td>
                <td className="col-cliente-estado">{cliente.perfil.estado}</td>
                <td className="col-cliente-accion">
                  <button 
                    className="btn btn-primary" 
                    style={{padding: '0.3rem 0.6rem', fontSize: '0.8rem'}}
                    onClick={() => handleSeleccionarParaVenta(cliente)}
                  >
                    Iniciar Venta
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Vista de tarjetas para móvil */}
        <div className="clientes-cards-mobile">
          {clientes.map(cliente => (
            <div key={cliente.pk} className="cliente-card">
              <div className="card-header">
                <div className="card-info-header">
                  <a onClick={() => setClienteSeleccionadoId(cliente.pk)}>
                    <h3>{cliente.perfil.nombre_completo || cliente.username}</h3>
                  </a>
                  <span className="card-codigo">Cód: {cliente.perfil.codigo_cliente}</span>
                </div>
              </div>
              
              <div className="card-specs">
                <span><strong>Categoría:</strong> {cliente.perfil.categoria?.nombre || '---'}</span>
                <span><strong>Teléfono:</strong> {cliente.perfil.telefono || '---'}</span>
                <span><strong>Vendedor:</strong> {cliente.perfil.vendedor_asignado_nombre || '---'}</span>
                <span><strong>Ciudad:</strong> {cliente.perfil.ciudad || '---'}</span>
                <span><strong>Estado:</strong> {cliente.perfil.estado || '---'}</span>
              </div>

              <div className="card-actions">
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleSeleccionarParaVenta(cliente)}
                  style={{width: '100%'}}
                >
                  🛒 Iniciar Venta
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ModalRegistrarCliente 
        isOpen={modalRegistroAbierto}
        onClose={() => setModalRegistroAbierto(false)}
        onClienteRegistrado={handleClienteRegistrado}
      />

      {/* La llamada al modal ahora incluye las props que faltaban */}
      <ModalDetalleCliente
        isOpen={!!clienteSeleccionadoId}
        clienteId={clienteSeleccionadoId}
        onClose={() => setClienteSeleccionadoId(null)}
        onSave={fetchClientes}
        // <-- CORRECCIÓN: Faltaba pasar estas listas al modal
        vendedores={vendedores}
        categorias={categorias}
      />
    </>
  );
}

export default ListaClientesPage;
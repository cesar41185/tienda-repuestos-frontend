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
  const API_URL = import.meta.env.VITE_API_URL;;

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

        <table id="resultsTable">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Teléfono</th>
              <th>Vendedor Asignado</th>
              <th>Ciudad</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map(cliente => (
              <tr key={cliente.pk}>
                <td className="celda-clicable">
                  <a onClick={() => setClienteSeleccionadoId(cliente.pk)}>
                    {cliente.perfil.codigo_cliente}
                  </a>
                </td>
                <td>{cliente.perfil.nombre_completo || cliente.username}</td>
                <td>{cliente.perfil.categoria?.nombre || '---'}</td>
                <td>{cliente.perfil.telefono}</td>
                <td>{cliente.perfil.vendedor_asignado_nombre || '---'}</td>
                <td>{cliente.perfil.ciudad}</td>
                <td>{cliente.perfil.estado}</td>
                <td>
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
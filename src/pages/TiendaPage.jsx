// En src/pages/TiendaPage.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Buscador from '../components/Buscador';
import TablaResultados from '../components/TablaResultados';
import ModalEditarValvula from '../components/ModalEditarValvula';
import ModalFoto from '../components/ModalFoto';
import VistaDetalle from '../components/VistaDetalle';
import { useCarrito } from '../context/CarritoContext'; // Importamos el hook del carrito

function TiendaPage() {
    // --- ESTADOS ---
  const [valvulas, setValvulas] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [valvulaParaEditar, setValvulaParaEditar] = useState(null);
  const [fotoParaAmpliar, setFotoParaAmpliar] = useState(null);
  const [pageInfo, setPageInfo] = useState({ count: 0, next: null, previous: null });
  const [currentFilters, setCurrentFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'codigo_interno', direction: 'ascending' });

  // Estados para gestionar la vista actual
  const [currentView, setCurrentView] = useState('lista');
  const [selectedValveId, setSelectedValveId] = useState(null);

  // Traemos la función para añadir al carrito desde el Contexto
  const { agregarAlCarrito } = useCarrito();

  const valvulasUrl = 'http://192.168.1.55:8000/api/valvulas/';
  const marcasUrl = 'http://192.168.1.55:8000/api/marcas/';

  // --- FUNCIONES (buscarValvulas, handleFilterSearch, etc.) ---
  // (Aquí van todas tus funciones como las tenías: buscarValvulas, handleFilterSearch, handleSort, etc.)
  const buscarValvulas = async (url = null) => {
    setCargando(true);
    let finalUrl = url;
    if (!finalUrl) {
      const params = new URLSearchParams(currentFilters);
      const ordering = sortConfig.direction === 'descending' ? `-${sortConfig.key}` : sortConfig.key;
      params.append('ordering', ordering);
      finalUrl = `${valvulasUrl}?${params.toString()}`;
    }
    try {
      const response = await fetch(finalUrl);
      const data = await response.json();
      setValvulas(data.results);
      setPageInfo({
        count: data.count,
        next: data.next,
        previous: data.previous
      });
    } catch (error) {
      console.error("Error al buscar válvulas:", error);
      setValvulas([]);
    } finally {
      setCargando(false);
    }
  };

  const handleRefreshInModal = async () => {
    // 1. Nos aseguramos de que haya una válvula para editar
    if (!valvulaParaEditar) return;

    try {
      // 2. Creamos la URL para pedir solo los datos de ESA válvula específica
      const url = `${valvulasUrl}${valvulaParaEditar.id}/`;
      
      // 3. Hacemos la petición
      const response = await fetch(url);
      const valvulaActualizada = await response.json();

      // 4. Actualizamos el estado con los datos frescos de la válvula
      setValvulaParaEditar(valvulaActualizada);
      
    } catch (error) {
      console.error("Error al refrescar la válvula:", error);
      // Si falla, por si acaso cerramos el modal para evitar datos inconsistentes
      handleCerrarModal();
    }
};
  
  const handleFilterSearch = (filtros) => {
    setCurrentFilters(filtros);
    const params = new URLSearchParams(filtros);
    const ordering = sortConfig.direction === 'descending' ? `-${sortConfig.key}` : sortConfig.key;
    params.append('ordering', ordering);
    buscarValvulas(`${valvulasUrl}?${params.toString()}`);
  };

   const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
 
  useEffect(() => {
    buscarValvulas();
  }, [sortConfig]);

  useEffect(() => {
    const fetchMarcas = async () => {
      try {
        const response = await fetch(marcasUrl);
        const data = await response.json();
        setMarcas(data.results);
      } catch (error) { console.error("Error al cargar marcas:", error); }
    };
    fetchMarcas();
  }, []);

  const handleAbrirModal = (valvula) => {setValvulaParaEditar(valvula); setIsModalOpen(true);};
  const handleCerrarModal = () => {setIsModalOpen(false);setValvulaParaEditar(null);};
  const handleGuardadoExitoso = () => {toast.success('¡Guardado con éxito!');handleCerrarModal(); buscarValvulas();};
  const handleAbrirVisorFoto = (imageUrl) => {setFotoParaAmpliar(imageUrl);};
  const handleCerrarVisorFoto = () => {setFotoParaAmpliar(null);};
  const handleVerDetalle = (valvulaId) => {setSelectedValveId(valvulaId); setCurrentView('detalle');};
  const handleVolverALista = () => {setSelectedValveId(null); setCurrentView('lista');};

  return (
    // Usamos un Fragment (<>) ya que el div principal está en App.jsx
    <>
      {currentView === 'lista' ? (
        <>
          <Buscador onBuscar={handleFilterSearch} marcas={marcas} />
          <TablaResultados 
            valvulas={valvulas} 
            cargando={cargando} 
            onEditar={handleAbrirModal}
            onFotoClick={handleAbrirVisorFoto}
            onSort={handleSort}
            sortConfig={sortConfig}
            onVerDetalle={handleVerDetalle}
            onAddToCart={agregarAlCarrito} // Pasamos la función del contexto
          />
          <div className="pagination-controls">
            <span>Total: {pageInfo.count} válvulas</span>
            <div>
              <button onClick={() => buscarValvulas(pageInfo.previous)} disabled={!pageInfo.previous}>Anterior</button>
              <button onClick={() => buscarValvulas(pageInfo.next)} disabled={!pageInfo.next}>Siguiente</button>
            </div>
          </div>
        </>
      ) : (
        <VistaDetalle valvulaId={selectedValveId} onVolver={handleVolverALista} />
      )}

      {isModalOpen && (
        <ModalEditarValvula
          valvula={valvulaParaEditar}
          onClose={handleCerrarModal}
          onSave={handleGuardadoExitoso}
          marcas={marcas}
            onRefresh={handleRefreshInModal}

        />
      )}
      
      <ModalFoto imageUrl={fotoParaAmpliar} onClose={handleCerrarVisorFoto} />
    </>
  );
}

export default TiendaPage;
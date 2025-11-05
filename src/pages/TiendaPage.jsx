// En src/pages/TiendaPage.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Buscador from '../components/Buscador';
import TablaResultados from '../components/TablaResultados';
import ModalEditarProducto from '../components/ModalEditarProducto';
import ModalFoto from '../components/ModalFoto';
import { useCarrito } from '../context/CarritoContext';
import { useAuth } from '../context/AuthContext';
import API_URL from '../apiConfig';

function TiendaPage() {
  // --- ESTADOS (actualizados a 'producto') ---
  const [productos, setProductos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productoParaEditar, setProductoParaEditar] = useState(null);
  const [fotoParaAmpliar, setFotoParaAmpliar] = useState(null);
  const [pageInfo, setPageInfo] = useState({ count: 0, next: null, previous: null });
  const [currentFilters, setCurrentFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'codigo_interno', direction: 'ascending' });
  const { agregarAlCarrito } = useCarrito();
  const { token, user } = useAuth();
  const [cantidades, setCantidades] = useState({});

  // --- NUEVO: estado de vista (grilla de tipos o lista) ---
  const [vistaTienda, setVistaTienda] = useState('grid'); // 'grid' | 'list'
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null); // p.ej. 'VALVULA'
  
  // --- FUNCIONES (actualizadas a 'producto') ---
  const buscarProductos = async (url = null) => {
    setCargando(true);
    let finalUrl = url;
    if (!finalUrl) {
      const params = new URLSearchParams(currentFilters);
      const ordering = sortConfig.direction === 'descending' ? `-${sortConfig.key}` : sortConfig.key;
      params.append('ordering', ordering);
      finalUrl = `${API_URL}/productos/?${params.toString()}`;
    }
    try {
      const response = await fetch(finalUrl);
      const data = await response.json();
      setProductos(data.results || []);
      setPageInfo({ count: data.count, next: data.next, previous: data.previous });
      return data.results; // Devuelve los datos para que onRefresh funcione
    } catch (error) {
      console.error("Error al buscar productos:", error);
      setProductos([]);
    } finally {
      setCargando(false);
    }
  };
  
  const handleFilterSearch = (filtros) => {
    setCurrentFilters(filtros);
    const params = new URLSearchParams(filtros);
    const ordering = sortConfig.direction === 'descending' ? `-${sortConfig.key}` : sortConfig.key;
    params.append('ordering', ordering);
    buscarProductos(`${API_URL}/productos/?${params.toString()}`);
  };

  // NUEVO: seleccionar tipo desde grilla
  const handleSeleccionarTipo = (tipo) => {
    setTipoSeleccionado(tipo);
    setVistaTienda('list');
    const nuevosFiltros = { ...currentFilters, tipo_producto: tipo };
    setCurrentFilters(nuevosFiltros);
    const params = new URLSearchParams(nuevosFiltros);
    const ordering = sortConfig.direction === 'descending' ? `-${sortConfig.key}` : sortConfig.key;
    params.append('ordering', ordering);
    buscarProductos(`${API_URL}/productos/?${params.toString()}`);
  };

  // NUEVO: volver a grilla de tipos
  const handleVolverATipos = () => {
    setVistaTienda('grid');
    setTipoSeleccionado(null);
    setProductos([]);
    setPageInfo({ count: 0, next: null, previous: null });
  };

  const handleDeleteProducto = async (productoId) => {
    // Pedimos confirmación al usuario
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto permanentemente?')) {
        try {
            toast.loading('Eliminando producto...');
            await fetch(`${API_URL}/productos/${productoId}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Token ${token}` }
            });
            toast.dismiss();
            toast.success('Producto eliminado con éxito.');
            handleCerrarModal(); // Cierra el modal después de borrar
            buscarProductos(); // Refresca la lista de productos
        } catch (error) {
            toast.dismiss();
            toast.error('No se pudo eliminar el producto.');
        }
    }
};

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
 
  // Restaurar filtros desde localStorage al montar el componente
  useEffect(() => {
    const savedFilters = localStorage.getItem('tienda_filters');
    const savedSortConfig = localStorage.getItem('tienda_sortConfig');
    
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        setCurrentFilters(filters);
      } catch (e) {
        console.error('Error al restaurar filtros:', e);
      }
    }
    
    if (savedSortConfig) {
      try {
        const sort = JSON.parse(savedSortConfig);
        setSortConfig(sort);
      } catch (e) {
        console.error('Error al restaurar ordenamiento:', e);
      }
    }
  }, []); // Solo se ejecuta una vez al montar

  useEffect(() => {
    // Solo buscar cuando estamos en vista de lista
    if (vistaTienda === 'list') {
      buscarProductos();
    }
  }, [sortConfig, currentFilters]); // Se ejecuta al ordenar y al filtrar

  // Guardar filtros en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem('tienda_filters', JSON.stringify(currentFilters));
  }, [currentFilters]);

  // Guardar ordenamiento en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem('tienda_sortConfig', JSON.stringify(sortConfig));
  }, [sortConfig]);

  useEffect(() => {
    const fetchMarcas = async () => {
      try {
        const response = await fetch(`${API_URL}/marcas/`);
        const data = await response.json();
        setMarcas(data.results || data); // Maneja respuestas paginadas y no paginadas
      } catch (error) { console.error("Error al cargar marcas:", error); }
    };
    fetchMarcas();
  }, []);

  // --- MANEJADORES DE MODALES (actualizados a 'producto') ---
  const handleAbrirModal = (producto = null) => {
    setProductoParaEditar(producto);
    setIsModalOpen(true);
  };

  const handleCerrarModal = () => {
    setIsModalOpen(false);
    setProductoParaEditar(null);
  };

  const handleCantidadChange = (productoId, cantidad) => {
  // Nos aseguramos de que la cantidad sea un número válido y al menos 1
  const nuevaCantidad = Math.max(1, parseInt(cantidad, 10));
  setCantidades(prevCantidades => ({
    ...prevCantidades,
    [productoId]: nuevaCantidad,
  }));
};

  const handleGuardadoExitoso = (productoActualizado) => {
    toast.success('¡Guardado con éxito!');
    handleCerrarModal();

    if (productoActualizado && productoActualizado.id) {
      setProductos(prev => {
        const existe = prev.some(p => p.id === productoActualizado.id);
        if (existe) {
          return prev.map(p => (p.id === productoActualizado.id ? { ...p, ...productoActualizado } : p));
        }
        // Si no existe en la página actual (p.ej. creado nuevo), no forzamos refresh para no romper vista
        return prev;
      });
    }
    // No llamar buscarProductos() para preservar filtros, paginación y scroll
  };

  const handleRefreshInModal = async () => {
    if (!productoParaEditar) return;
    try {
      const url = `${API_URL}/productos/${productoParaEditar.id}/`;
      const response = await fetch(url);
      const productoActualizado = await response.json();
      setProductoParaEditar(productoActualizado);
    } catch (error) {
      console.error("Error al refrescar el producto:", error);
      handleCerrarModal();
    }
  };

  const handleAbrirVisorFoto = (imageUrl) => setFotoParaAmpliar(imageUrl);
  const handleCerrarVisorFoto = () => setFotoParaAmpliar(null);

  const handleAddToCartWrapper = (producto) => {
    const cantidadDeJuegos = cantidades[producto.id] || 1; // Obtiene el número de JUEGOS
    agregarAlCarrito(producto, cantidadDeJuegos); // Pasa los JUEGOS al contexto
  };

  const handleImprimirListado = async () => {
    if (!token) {
      toast.error('Debes iniciar sesión para generar el listado.');
      return;
    }

    try {
      toast.loading('Generando PDF del listado de productos...');
      
      // Construir URL con filtros y ordenamiento activos
      const params = new URLSearchParams();
      
      // Agregar todos los filtros activos
      Object.keys(currentFilters).forEach(key => {
        if (currentFilters[key]) {
          params.append(key, currentFilters[key]);
        }
      });
      
      // Agregar ordenamiento
      const ordering = sortConfig.direction === 'descending' ? `-${sortConfig.key}` : sortConfig.key;
      params.append('ordering', ordering);
      
      // Construir URL completa
      const apiUrl = `${API_URL}/productos/imprimir_listado/?${params.toString()}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          toast.error('No tienes permisos para generar el listado. Solo administradores.');
        } else {
          toast.error('Error al generar el PDF.');
        }
        return;
      }

      // Obtener el blob del PDF
      const blob = await response.blob();
      
      // Crear un enlace temporal para descargar el archivo
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      
      // Obtener el nombre del archivo del header Content-Disposition o usar uno por defecto
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'listado_productos.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      } else {
        // Si no hay header, usar fecha actual
        const fecha = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        filename = `listado_productos_${fecha}.pdf`;
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.dismiss();
      toast.success('PDF generado y descargado exitosamente');
    } catch (error) {
      toast.dismiss();
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el PDF del listado.');
    }
  };

  // --- RENDER ---
  if (vistaTienda === 'grid') {
    return (
      <>
        <h2>Productos</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          <div 
            onClick={() => handleSeleccionarTipo('VALVULA')} 
            style={{ cursor: 'pointer', border: '1px solid #ddd', borderRadius: '8px', padding: '20px', textAlign: 'center', background: '#f8f8f8' }}
            title="Ver Válvulas"
          >
            <div style={{ fontSize: '2.2rem', marginBottom: '10px' }}>⚙️</div>
            <div style={{ fontWeight: 'bold' }}>Válvulas</div>
          </div>
          {/* Aquí luego añadiremos más tipos (FILTRO, BUJIA, etc.) */}
        </div>
      </>
    );
  }

  // Vista de lista (tabla)
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>{tipoSeleccionado === 'VALVULA' ? 'Válvulas' : 'Productos'}</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn" onClick={handleVolverATipos}>← Volver a tipos</button>
          {token && user && user.groups.includes('Administrador') && (
            <>
              <button 
                className="btn btn-secondary"
                onClick={handleImprimirListado}
                title="Generar PDF del listado completo de productos para auditoría"
              >
                📄 Imprimir Listado
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => handleAbrirModal()}
              >
                + Crear Producto
              </button>
            </>
          )}
        </div>
      </div>
      <Buscador onBuscar={handleFilterSearch} marcas={marcas} />
      <TablaResultados 
        productos={productos} // Pasamos 'productos'
        cargando={cargando} 
        onEditar={handleAbrirModal}
        onFotoClick={handleAbrirVisorFoto}
        onSort={handleSort}
        sortConfig={sortConfig}
        cantidades={cantidades}
        onCantidadChange={handleCantidadChange}
        onAddToCart={handleAddToCartWrapper}
      />
      <div className="pagination-controls">
        <span>Total: {pageInfo.count} productos</span>
        <div>
          <button onClick={() => buscarProductos(pageInfo.previous)} disabled={!pageInfo.previous}>Anterior</button>
          <button onClick={() => buscarProductos(pageInfo.next)} disabled={!pageInfo.next}>Siguiente</button>
        </div>
      </div>

      {isModalOpen && (
        <ModalEditarProducto
          producto={productoParaEditar} // Pasamos 'producto'
          onClose={handleCerrarModal}
          onSave={handleGuardadoExitoso}
          marcas={marcas}
          onRefresh={handleRefreshInModal}
          onDelete={handleDeleteProducto}
        />
      )}
      
      <ModalFoto imageUrl={fotoParaAmpliar} onClose={handleCerrarVisorFoto} />
    </>
  );
}

export default TiendaPage;
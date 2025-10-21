// En src/pages/TiendaPage.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Buscador from '../components/Buscador';
import TablaResultados from '../components/TablaResultados';
import ModalEditarValvula from '../components/ModalEditarValvula';
import ModalFoto from '../components/ModalFoto';
import { useCarrito } from '../context/CarritoContext';
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
  const [cantidades, setCantidades] = useState({});
  
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
    buscarProductos(`${productosUrl}?${params.toString()}`);
  };

  const handleDeleteProducto = async (productoId) => {
    // Pedimos confirmación al usuario
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto permanentemente?')) {
        try {
            toast.loading('Eliminando producto...');
            await fetch(`http://192.168.1.55:8000/api/productos/${productoId}/`, {
                method: 'DELETE',
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
 
  useEffect(() => {
    buscarProductos();
  }, [sortConfig, currentFilters]); // Se ejecuta al ordenar y al filtrar

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
  const handleAbrirModal = (producto) => {
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

  const handleGuardadoExitoso = () => {
    toast.success('¡Guardado con éxito!');
    handleCerrarModal();
    buscarProductos(); // Vuelve a buscar para reflejar los cambios
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

  return (
    <>
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
        <span>Total: {pageInfo.count} productos</span> {/* Texto actualizado */}
        <div>
          <button onClick={() => buscarProductos(pageInfo.previous)} disabled={!pageInfo.previous}>Anterior</button>
          <button onClick={() => buscarProductos(pageInfo.next)} disabled={!pageInfo.next}>Siguiente</button>
        </div>
      </div>

      {isModalOpen && (
        <ModalEditarValvula
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
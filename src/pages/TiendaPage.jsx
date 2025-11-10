// En src/pages/TiendaPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Buscador from '../components/Buscador';
import TablaResultados from '../components/TablaResultados';
import ModalEditarProducto from '../components/ModalEditarProducto';
import ModalFoto from '../components/ModalFoto';
import ModalCrearProducto from '../components/ModalCrearProducto';
import { useCarrito } from '../context/CarritoContext';
import { useAuth } from '../context/AuthContext';
import API_URL from '../apiConfig';

function TiendaPage() {
  // Router helpers (antes de inicializar estados que dependen de 'tipo')
  const { tipo } = useParams();
  const navigate = useNavigate();

  // Mapear URL a tipo de producto válido
  const mapUrlToTipo = (urlTipo) => {
    const t = urlTipo?.toLowerCase();
    if (t === 'guia-valvula') return 'GUIA_VALVULA';
    if (t === 'valvula') return 'VALVULA';
    return urlTipo?.toUpperCase();
  };

  const initialTipoSeleccionado = tipo ? mapUrlToTipo(tipo) : null;
  // --- ESTADOS (actualizados a 'producto') ---
  const [productos, setProductos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productoParaEditar, setProductoParaEditar] = useState(null);
  const [fotoParaAmpliar, setFotoParaAmpliar] = useState(null);
  const [pageInfo, setPageInfo] = useState({ count: 0, next: null, previous: null });
  const [pageMeta, setPageMeta] = useState({ current: 1, total: 1, size: 0 });
  const [missingPhotoCount, setMissingPhotoCount] = useState(null);
  const [countingMissing, setCountingMissing] = useState(false);
  const [showOnlyNoPhoto, setShowOnlyNoPhoto] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'codigo_interno', direction: 'ascending' });
  const { agregarAlCarrito } = useCarrito();
  const { token, user } = useAuth();
  const [cantidades, setCantidades] = useState({});
  const [crearAbierto, setCrearAbierto] = useState(false);
  const [pageJump, setPageJump] = useState(1); // selector de página

  // --- NUEVO: estado de vista (grilla de tipos o lista) ---
  const [vistaTienda, setVistaTienda] = useState(tipo ? 'list' : 'grid'); // 'grid' | 'list'
  const [tipoSeleccionado, setTipoSeleccionado] = useState(initialTipoSeleccionado); // p.ej. 'VALVULA'
  
  // --- FUNCIONES (actualizadas a 'producto') ---
  const getQueryParam = (urlStr, key) => {
    try {
      if (!urlStr) return null;
      const u = new URL(urlStr);
      return u.searchParams.get(key);
    } catch { return null; }
  };

  // Utilidad: recorrer todas las páginas con filtros actuales
  const fetchAllForCurrentFilters = async () => {
    const filtros = { ...currentFilters };
    if (tipoSeleccionado) filtros.tipo_producto = tipoSeleccionado;
    const params = new URLSearchParams(filtros);
    const ordering = sortConfig.direction === 'descending' ? `-${sortConfig.key}` : sortConfig.key;
    params.append('ordering', ordering);
    params.append('page_size', '200');
    let url = `${API_URL}/productos/?${params.toString()}`;
    const all = [];
    let loops = 0;
    while (url && loops < 200) {
      const res = await fetch(url);
      if (!res.ok) break;
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data.results || []);
      all.push(...arr);
      url = data.next || null;
      loops += 1;
    }
    return all;
  };

  // Helper: determina si un producto tiene al menos una foto válida (URL no vacía)
  // NOTA: Detectamos inversions en producción; simplificamos criterio para evitar falsos positivos.
  const hasValidPhoto = (p) => {
    if (!p || !Array.isArray(p.fotos)) return false;
    // Si hay al menos un objeto con imagen no vacía consideramos que tiene foto
    return p.fotos.some(f => f && f.imagen && String(f.imagen).trim() !== '');
  };

  const buscarProductos = async (url = null, overrideOnlyNoPhoto = null) => {
    setCargando(true);
    let finalUrl = url;
    if (!finalUrl) {
      // Enforce tipo seleccionado desde la ruta aunque existan filtros guardados
      const filtros = { ...currentFilters };
      if (tipoSeleccionado) {
        filtros.tipo_producto = tipoSeleccionado;
      }
      const params = new URLSearchParams(filtros);
      const ordering = sortConfig.direction === 'descending' ? `-${sortConfig.key}` : sortConfig.key;
      params.append('ordering', ordering);
      finalUrl = `${API_URL}/productos/?${params.toString()}`;
    }
    try {
      // Determinar modo 'solo sin foto' con posible override (para evitar el retraso de setState)
      const onlyNoPhoto = overrideOnlyNoPhoto !== null ? overrideOnlyNoPhoto : showOnlyNoPhoto;
      // Si estamos en modo "solo sin foto", ignoramos next/previous y construimos dataset completo filtrado
      if (onlyNoPhoto) {
        const all = await fetchAllForCurrentFilters();
        // Mostrar solo productos SIN foto válida (simplificado: array vacío o ninguna imagen no vacía)
        const filtered = all.filter(p => !hasValidPhoto(p));
        console.debug('[SoloSinFoto] total cargados:', all.length, 'filtrados sin foto:', filtered.length);
        setProductos(filtered);
        setPageInfo({ count: filtered.length, next: null, previous: null });
        setPageMeta({ current: 1, total: 1, size: filtered.length });
        setMissingPhotoCount(filtered.length); // mantener indicador coherente
        return filtered;
      }
      const response = await fetch(finalUrl);
      const data = await response.json();
      setProductos(data.results || []);
      setPageInfo({ count: data.count, next: data.next, previous: data.previous });
      // Derivar metadatos de paginación
      const psFromUrl = parseInt(getQueryParam(data.next || data.previous, 'page_size') || '0', 10);
      const pageSize = psFromUrl > 0 ? psFromUrl : (Array.isArray(data.results) ? data.results.length : 0);
      let currentPage = 1;
      if (data.next) {
        const nextPage = parseInt(getQueryParam(data.next, 'page') || '2', 10);
        currentPage = Math.max(1, nextPage - 1);
      } else if (data.previous) {
        const prevPage = parseInt(getQueryParam(data.previous, 'page') || '1', 10);
        currentPage = prevPage + 1;
      }
      const totalPages = pageSize > 0 && data.count ? Math.ceil(data.count / pageSize) : 1;
      setPageMeta({ current: currentPage, total: totalPages, size: pageSize });
      return data.results; // Devuelve los datos para que onRefresh funcione
    } catch (error) {
      console.error("Error al buscar productos:", error);
      setProductos([]);
    } finally {
      setCargando(false);
    }
  };

  // Ir a una página específica construyendo la URL con filtros actuales
  const irAPagina = async (paginaDestino) => {
    if (showOnlyNoPhoto) return; // En este modo no hay paginación
    const total = pageMeta.total || 1;
    let p = parseInt(paginaDestino, 10);
    if (isNaN(p)) return;
    if (p < 1) p = 1;
    if (p > total) p = total;
    // Construir URL con filtros + ordering + page (y page_size si lo conocemos)
    const filtros = { ...currentFilters };
    if (tipoSeleccionado) filtros.tipo_producto = tipoSeleccionado;
    const params = new URLSearchParams(filtros);
    const ordering = sortConfig.direction === 'descending' ? `-${sortConfig.key}` : sortConfig.key;
    params.append('ordering', ordering);
    if (pageMeta.size && pageMeta.size > 0) params.append('page_size', String(pageMeta.size));
    params.append('page', String(p));
    setPageJump(p); // reflejar en input
    await buscarProductos(`${API_URL}/productos/?${params.toString()}`);
  };

  // Contar productos sin foto para los filtros actuales (momentáneo)
  const contarSinFoto = async () => {
    setCountingMissing(true);
    try {
      const filtros = { ...currentFilters };
      if (tipoSeleccionado) filtros.tipo_producto = tipoSeleccionado;
      const params = new URLSearchParams(filtros);
      // no depende de orden
      params.append('page_size', '200');
      let url = `${API_URL}/productos/?${params.toString()}`;

      let count = 0;
      let loops = 0;
      while (url && loops < 50) { // tope de seguridad
        const res = await fetch(url);
        if (!res.ok) break;
        const data = await res.json();
        const arr = Array.isArray(data) ? data : (data.results || []);
        // Contar productos SIN foto válida
  count += arr.filter(p => !hasValidPhoto(p)).length;
        url = data.next || null;
        loops += 1;
      }
      setMissingPhotoCount(count);
    } catch (e) {
      setMissingPhotoCount(null);
    } finally {
      setCountingMissing(false);
    }
  };
  
  const handleFilterSearch = (filtros) => {
    // Fuerza el tipo de producto activo para evitar que en guías se muestren válvulas
    const filtrosConTipo = tipoSeleccionado ? { ...filtros, tipo_producto: tipoSeleccionado } : { ...filtros };
    setCurrentFilters(filtrosConTipo);
    // No llamamos buscarProductos aquí para evitar condiciones de carrera; el useEffect de currentFilters hará la búsqueda con orden aplicado
  };

  const onProductoCreado = (nuevo) => {
    // Refrescar lista sin perder filtros
    buscarProductos();
  };

  // Mapeo de URL a tipo de producto (helpers)
  const urlToTipo = (urlTipo) => {
    const map = {
      'valvula': 'VALVULA',
      'guia-valvula': 'GUIA_VALVULA',
    };
    return map[urlTipo?.toLowerCase()] || urlTipo?.toUpperCase();
  };

  const tipoToUrl = (tipo) => {
    const map = {
      'VALVULA': 'valvula',
      'GUIA_VALVULA': 'guia-valvula',
    };
    return map[tipo] || tipo?.toLowerCase();
  };

  const handleSeleccionarTipo = (tipo) => {
    setTipoSeleccionado(tipo);
    setVistaTienda('list');
    const nuevosFiltros = { ...currentFilters, tipo_producto: tipo };
    setCurrentFilters(nuevosFiltros);
    const params = new URLSearchParams(nuevosFiltros);
    const ordering = sortConfig.direction === 'descending' ? `-${sortConfig.key}` : sortConfig.key;
    params.append('ordering', ordering);
    buscarProductos(`${API_URL}/productos/?${params.toString()}`);
    navigate(`/tienda/${tipoToUrl(tipo)}`);
  };

  // NUEVO: volver a grilla de tipos
  const handleVolverATipos = () => {
    setVistaTienda('grid');
    setTipoSeleccionado(null);
    setProductos([]);
    setPageInfo({ count: 0, next: null, previous: null });
    navigate('/tienda');
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

  // Sincronizar el input del selector de página cuando cambie la página actual
  useEffect(() => {
    if (pageMeta?.current) setPageJump(pageMeta.current);
  }, [pageMeta.current]);

  // Recalcular conteo sin foto cuando cambian filtros o tipo
  useEffect(() => {
    if (vistaTienda === 'list') {
      contarSinFoto();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilters, tipoSeleccionado, vistaTienda]);

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

  // Si la URL cambia (p.ej. navegación directa), sincronizar vista/filtros
  useEffect(() => {
    if (tipo) {
      const t = urlToTipo(tipo);
      if (tipoSeleccionado !== t) {
        setTipoSeleccionado(t);
      }
      if (vistaTienda !== 'list') setVistaTienda('list');
      const nuevosFiltros = { ...currentFilters, tipo_producto: t };
      setCurrentFilters(nuevosFiltros);
    } else {
      setVistaTienda('grid');
      setTipoSeleccionado(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

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
          <div 
            onClick={() => handleSeleccionarTipo('GUIA_VALVULA')} 
            style={{ cursor: 'pointer', border: '1px solid #ddd', borderRadius: '8px', padding: '20px', textAlign: 'center', background: '#f8f8f8' }}
            title="Ver Guías de Válvulas"
          >
            <div style={{ fontSize: '2.2rem', marginBottom: '10px' }}>🔧</div>
            <div style={{ fontWeight: 'bold' }}>Guías de Válvulas</div>
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
        <h2>{tipoSeleccionado === 'VALVULA' ? 'Válvulas' : tipoSeleccionado === 'GUIA_VALVULA' ? 'Guías de Válvulas' : 'Productos'}</h2>
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
                onClick={() => setCrearAbierto(true)}
              >
                + Crear Producto
              </button>
            </>
          )}
        </div>
      </div>
  <Buscador onBuscar={handleFilterSearch} marcas={marcas} tipoProducto={tipoSeleccionado} />
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
        tipoProducto={tipoSeleccionado}
      />
      {!cargando && productos.length === 0 && vistaTienda === 'list' && (
        <div style={{ marginTop: 16, color: '#666' }}>
          {tipoSeleccionado === 'GUIA_VALVULA' && (
            <p>No hay guías de válvula registradas todavía.</p>
          )}
          {tipoSeleccionado && tipoSeleccionado !== 'GUIA_VALVULA' && (
            <p>No hay productos para el tipo seleccionado.</p>
          )}
          {user && user.groups?.includes('Administrador') && (
            <button className="btn" onClick={() => setCrearAbierto(true)}>Crear nuevo producto</button>
          )}
        </div>
      )}
      <div className="pagination-controls" style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
        <span>
          Total: {pageInfo.count} productos
          {pageMeta.total > 1 && (
            <> · Página {pageMeta.current} de {pageMeta.total}</>
          )}
          {missingPhotoCount !== null && (
            <> · Sin foto: {missingPhotoCount} {countingMissing && <span style={{color:'#888'}}> (calc...)</span>}</>
          )}
        </span>
        <div>
          <button onClick={() => buscarProductos(pageInfo.previous)} disabled={!pageInfo.previous}>Anterior</button>
          <button onClick={() => buscarProductos(pageInfo.next)} disabled={!pageInfo.next}>Siguiente</button>
        </div>
        {pageMeta.total > 1 && !showOnlyNoPhoto && (
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span>Ir a</span>
            <input
              type="number"
              min={1}
              max={pageMeta.total}
              value={pageJump}
              onChange={(e) => setPageJump(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  irAPagina(pageJump);
                }
              }}
              style={{ width: 70 }}
            />
            <button onClick={() => irAPagina(pageJump)}>Ir</button>
          </div>
        )}
        <label style={{ display:'flex', alignItems:'center', gap:6 }} title="Mostrar solo productos sin fotos (según filtros)">
          <input
            type="checkbox"
            checked={showOnlyNoPhoto}
            onChange={async (e) => {
              const nuevoValor = e.target.checked;
              setShowOnlyNoPhoto(nuevoValor);
              // Ejecutar búsqueda con valor recién marcado para evitar inversión.
              await buscarProductos(undefined, nuevoValor);
            }}
          />
          Solo sin foto
        </label>
      </div>

      {isModalOpen && (
        <ModalEditarProducto 
          producto={productoParaEditar} 
          onClose={handleCerrarModal}
          onSave={handleGuardadoExitoso}
          onAmpliarFoto={handleAbrirVisorFoto}
          marcas={marcas}
        />
      )}
      {crearAbierto && (
        <ModalCrearProducto abierto={crearAbierto} onClose={() => setCrearAbierto(false)} onCreated={() => buscarProductos()} />
      )}
      {fotoParaAmpliar && (
        <ModalFoto imageUrl={fotoParaAmpliar} onClose={handleCerrarVisorFoto} />
      )}
    </>
  );
}

export default TiendaPage;
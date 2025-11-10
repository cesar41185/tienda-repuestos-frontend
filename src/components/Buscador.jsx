import { useState, useMemo } from 'react';

function Buscador({ onBuscar, marcas, tipoProducto }) {
  // Restaurar filtros desde localStorage al montar
  const getInitialValue = (key, defaultValue = '') => {
    try {
      const savedFilters = localStorage.getItem('tienda_filters');
      if (savedFilters) {
        const filters = JSON.parse(savedFilters);
        return filters[key] || defaultValue;
      }
    } catch (e) {
      console.error('Error al restaurar filtros:', e);
    }
    return defaultValue;
  };

  // Estados para cada campo del filtro
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tipo, setTipo] = useState(() => getInitialValue('tipo'));
  const [marca, setMarca] = useState(() => getInitialValue('marca_vehiculo'));
  const [ranuras, setRanuras] = useState(() => getInitialValue('ranuras'));
  const [vastagoMin, setVastagoMin] = useState(() => getInitialValue('diametro_vastago_min'));
  const [vastagoMax, setVastagoMax] = useState(() => getInitialValue('diametro_vastago_max'));
  const [cabezaMin, setCabezaMin] = useState(() => getInitialValue('diametro_cabeza_min'));
  const [cabezaMax, setCabezaMax] = useState(() => getInitialValue('diametro_cabeza_max'));
  const [longitudMin, setLongitudMin] = useState(() => getInitialValue('longitud_total_min'));
  const [longitudMax, setLongitudMax] = useState(() => getInitialValue('longitud_total_max'));
  // Guías
  const [extMin, setExtMin] = useState(() => getInitialValue('diametro_exterior_min'));
  const [extMax, setExtMax] = useState(() => getInitialValue('diametro_exterior_max'));
  const [intMin, setIntMin] = useState(() => getInitialValue('diametro_interior_min'));
  const [intMax, setIntMax] = useState(() => getInitialValue('diametro_interior_max'));
  const [busquedaGeneral, setBusquedaGeneral] = useState(() => getInitialValue('search'));

  const esGuia = tipoProducto === 'GUIA_VALVULA';

  // Variable para saber si hay algún filtro activo y mostrar la escoba
  const isFilterActive = useMemo(() => {
    if (esGuia) {
      return busquedaGeneral || marca || extMin || extMax || intMin || intMax || longitudMin || longitudMax;
    }
    return busquedaGeneral || tipo || marca || ranuras || vastagoMin || vastagoMax || cabezaMin || cabezaMax || longitudMin || longitudMax;
  }, [esGuia, busquedaGeneral, tipo, marca, ranuras, vastagoMin, vastagoMax, cabezaMin, cabezaMax, longitudMin, longitudMax, extMin, extMax, intMin, intMax]);

  // Función para enviar los filtros a la página principal
  const handleBuscarClick = () => {
    const filtros = esGuia ? {
      search: busquedaGeneral,
      marca_vehiculo: marca,
      diametro_exterior_min: extMin,
      diametro_exterior_max: extMax,
      diametro_interior_min: intMin,
      diametro_interior_max: intMax,
      longitud_total_min: longitudMin,
      longitud_total_max: longitudMax,
    } : {
      search: busquedaGeneral,
      tipo,
      marca_vehiculo: marca,
      ranuras,
      diametro_vastago_min: vastagoMin,
      diametro_vastago_max: vastagoMax,
      diametro_cabeza_min: cabezaMin,
      diametro_cabeza_max: cabezaMax,
      longitud_total_min: longitudMin,
      longitud_total_max: longitudMax,
    };
    // Limpiamos los filtros que estén vacíos antes de enviar
    Object.keys(filtros).forEach(key => {
      if (!filtros[key]) {
        delete filtros[key];
      }
    });
    onBuscar(filtros);
  };
  
  // Función para limpiar todos los campos y mostrar todos los productos
  const handleLimpiarFiltros = () => {
    setTipo('');
    setMarca('');
    setRanuras('');
    setVastagoMin('');
    setVastagoMax('');
    setCabezaMin('');
    setCabezaMax('');
    setLongitudMin('');
    setLongitudMax('');
    setExtMin('');
    setExtMax('');
    setIntMin('');
    setIntMax('');
    setBusquedaGeneral('');
    onBuscar({}); // Envía una búsqueda sin filtros
  };

  // Permite buscar presionando "Enter" en el campo principal
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleBuscarClick();
    }
  };

  return (
    <div className="filter-container">
      {/* --- NUEVO CONTENEDOR PARA LA BARRA DE BÚSQUEDA --- */}
      <div className="search-bar-container">
        <input 
          type="text" 
          placeholder="Búsqueda general..." 
          value={busquedaGeneral} 
          onChange={(e) => setBusquedaGeneral(e.target.value)}
          onKeyDown={handleKeyDown} 
          className="search-bar-input"
        />
        <button onClick={handleBuscarClick} className="search-bar-btn" title="Buscar">⌕</button>
        
        {/* --- 2. BOTÓN DE LIMPIAR (ahora siempre visible) --- */}
        <button onClick={handleLimpiarFiltros} className="search-bar-btn" title="Limpiar filtros">✕</button>

        {/* --- 3. NUEVO BOTÓN para mostrar/ocultar filtros avanzados --- */}
        <button onClick={() => setShowAdvanced(!showAdvanced)} className="search-bar-btn filter-toggle-btn" title="Más filtros">☰</button>
      </div>

      {showAdvanced && (
        <div className="advanced-filters-grid">
          {/* Marca aplica a ambos */}
          <select value={marca} onChange={(e) => setMarca(e.target.value)}>
            <option value="">-- Marca Vehículo --</option>
            {Array.isArray(marcas) && marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>

          {!esGuia && (
            <>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="">-- Tipo --</option>
                <option value="INTAKE">Admisión</option>
                <option value="EXHAUST">Escape</option>
              </select>
              <input type="number" placeholder="Ranuras" value={ranuras} onChange={(e) => setRanuras(e.target.value)} />
              <input type="number" placeholder="Vástago Mín (mm)" value={vastagoMin} onChange={(e) => setVastagoMin(e.target.value)} />
              <input type="number" placeholder="Vástago Máx (mm)" value={vastagoMax} onChange={(e) => setVastagoMax(e.target.value)} />
              <input type="number" placeholder="Cabeza Mín (mm)" value={cabezaMin} onChange={(e) => setCabezaMin(e.target.value)} />
              <input type="number" placeholder="Cabeza Máx (mm)" value={cabezaMax} onChange={(e) => setCabezaMax(e.target.value)} />
            </>
          )}

          {esGuia && (
            <>
              <input type="number" placeholder="Ext. Mín (mm)" value={extMin} onChange={(e) => setExtMin(e.target.value)} />
              <input type="number" placeholder="Ext. Máx (mm)" value={extMax} onChange={(e) => setExtMax(e.target.value)} />
              <input type="number" placeholder="Int. Mín (mm)" value={intMin} onChange={(e) => setIntMin(e.target.value)} />
              <input type="number" placeholder="Int. Máx (mm)" value={intMax} onChange={(e) => setIntMax(e.target.value)} />
            </>
          )}

          {/* Longitud aplica a ambos */}
          <input type="number" placeholder="Longitud Mín (mm)" value={longitudMin} onChange={(e) => setLongitudMin(e.target.value)} />
          <input type="number" placeholder="Longitud Máx (mm)" value={longitudMax} onChange={(e) => setLongitudMax(e.target.value)} />
        </div>
      )}
    </div>
  );
}

export default Buscador;
import { useState, useMemo } from 'react';

function Buscador({ onBuscar, marcas }) {
  // Estados para cada campo del filtro
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tipo, setTipo] = useState('');
  const [marca, setMarca] = useState('');
  const [ranuras, setRanuras] = useState('');
  const [vastagoMin, setVastagoMin] = useState('');
  const [vastagoMax, setVastagoMax] = useState('');
  const [cabezaMin, setCabezaMin] = useState('');
  const [cabezaMax, setCabezaMax] = useState('');
  const [longitudMin, setLongitudMin] = useState('');
  const [longitudMax, setLongitudMax] = useState('');
  const [busquedaGeneral, setBusquedaGeneral] = useState('');

  // Variable para saber si hay algún filtro activo y mostrar la escoba
  const isFilterActive = useMemo(() => 
    busquedaGeneral || tipo || marca || ranuras || vastagoMin || vastagoMax || cabezaMin || cabezaMax || longitudMin || longitudMax,
    [busquedaGeneral, tipo, marca, ranuras, vastagoMin, vastagoMax, cabezaMin, cabezaMax, longitudMin, longitudMax]
  );

  // Función para enviar los filtros a la página principal
  const handleBuscarClick = () => {
    const filtros = {
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
        <button onClick={handleBuscarClick} className="search-bar-btn" title="Buscar">🔍</button>
        
        {/* --- 2. BOTÓN DE LIMPIAR (ahora siempre visible) --- */}
        <button onClick={handleLimpiarFiltros} className="search-bar-btn" title="Limpiar filtros">🧹</button>

        {/* --- 3. NUEVO BOTÓN para mostrar/ocultar filtros avanzados --- */}
        <button onClick={() => setShowAdvanced(!showAdvanced)} className="search-bar-btn filter-toggle-btn" title="Más filtros">
          ⚙️
        </button>
      </div>

      {showAdvanced && (
        <div className="advanced-filters-grid">
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">-- Tipo --</option>
            <option value="INTAKE">Admisión</option>
            <option value="EXHAUST">Escape</option>
          </select>
          <select value={marca} onChange={(e) => setMarca(e.target.value)}>
            <option value="">-- Marca Vehículo --</option>
            {Array.isArray(marcas) && marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
          <input type="number" placeholder="Ranuras" value={ranuras} onChange={(e) => setRanuras(e.target.value)} />
          <input type="number" placeholder="Vástago Mín (mm)" value={vastagoMin} onChange={(e) => setVastagoMin(e.target.value)} />
          <input type="number" placeholder="Vástago Máx (mm)" value={vastagoMax} onChange={(e) => setVastagoMax(e.target.value)} />
          <input type="number" placeholder="Cabeza Mín (mm)" value={cabezaMin} onChange={(e) => setCabezaMin(e.target.value)} />
          <input type="number" placeholder="Cabeza Máx (mm)" value={cabezaMax} onChange={(e) => setCabezaMax(e.target.value)} />
          <input type="number" placeholder="Longitud Mín (mm)" value={longitudMin} onChange={(e) => setLongitudMin(e.target.value)} />
          <input type="number" placeholder="Longitud Máx (mm)" value={longitudMax} onChange={(e) => setLongitudMax(e.target.value)} />
        </div>
      )}
    </div>
  );
}

export default Buscador;
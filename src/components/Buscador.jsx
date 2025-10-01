// En src/components/Buscador.jsx
import { useState } from 'react';

// Ahora recibe la lista de marcas como un "prop"
function Buscador({ onBuscar, marcas }) {
  // Creamos un estado para cada filtro
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


  const handleBuscarClick = () => {
    // Creamos un objeto con todos los filtros que tienen algún valor
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
    onBuscar(filtros);
  };

  const handleKeyDown = (event) => {
    // Si la tecla presionada es "Enter", llamamos a la misma función del botón.
    if (event.key === 'Enter') {
      handleBuscarClick();
    }
  };

  return (
    <div className="filter-container">
      {/* Fila para Tipo y Marca */}
      <input 
          type="text" 
          placeholder="Búsqueda general..." 
          value={busquedaGeneral} 
          onChange={(e) => setBusquedaGeneral(e.target.value)}
          onKeyDown={handleKeyDown} 
      />
      <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
        <option value="">-- Tipo --</option>
        <option value="ADMISION">Admisión</option>
        <option value="ESCAPE">Escape</option>
      </select>
      <select value={marca} onChange={(e) => setMarca(e.target.value)}>
        <option value="">-- Marca Vehículo --</option>
        {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
      </select>
      <input type="number" placeholder="Ranuras" value={ranuras} onChange={(e) => setRanuras(e.target.value)} />

      {/* Fila para Medidas */}
      <div>
        <input type="number" placeholder="Vástago Mín (mm)" value={vastagoMin} onChange={(e) => setVastagoMin(e.target.value)} />
        <input type="number" placeholder="Vástago Máx (mm)" value={vastagoMax} onChange={(e) => setVastagoMax(e.target.value)} />
        <input type="number" placeholder="Cabeza Mín (mm)" value={cabezaMin} onChange={(e) => setCabezaMin(e.target.value)} />
        <input type="number" placeholder="Cabeza Máx (mm)" value={cabezaMax} onChange={(e) => setCabezaMax(e.target.value)} />
        <input type="number" placeholder="Longitud Mín (mm)" value={longitudMin} onChange={(e) => setLongitudMin(e.target.value)} />
        <input type="number" placeholder="Longitud Máx (mm)" value={longitudMax} onChange={(e) => setLongitudMax(e.target.value)} />
      </div>

      <button onClick={handleBuscarClick}>Buscar</button>
    </div>
  );
}

export default Buscador;
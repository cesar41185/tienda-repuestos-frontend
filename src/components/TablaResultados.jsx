// En src/components/TablaResultados.jsx
import { Link } from 'react-router-dom';


function TablaResultados({ valvulas, cargando, onEditar, onFotoClick, onSort, sortConfig, onVerDetalle, onAddToCart }) {
  
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };
  
  if (cargando) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="results-container">
      <table id="resultsTable">
        <thead>
          {/* 1. Definimos las nuevas cabeceras de la tabla */}
          <tr>
            <th>Foto</th>
            <th onClick={() => onSort('trw_code_sort')}>Código TRW {getSortIcon('trw_code_sort')}</th>
            <th>Modelo</th>
            <th onClick={() => onSort('marca_vehiculo_nombre')}>Marca {getSortIcon('marca_vehiculo_nombre')}</th>
            <th onClick={() => onSort('tipo')}>Tipo {getSortIcon('tipo')}</th>
            <th onClick={() => onSort('diametro_cabeza')}>Cabeza (mm) {getSortIcon('diametro_cabeza')}</th>
            <th onClick={() => onSort('diametro_vastago')}>Vástago (mm) {getSortIcon('diametro_vastago')}</th>
            <th onClick={() => onSort('longitud_total')}>Longitud (mm) {getSortIcon('longitud_total')}</th>
            <th onClick={() => onSort('ranuras')}>Ranuras {getSortIcon('ranuras')}</th>
            <th onClick={() => onSort('distancia_primera_ranura')}>Distancia Ranura (mm) {getSortIcon('distancia_primera_ranura')}</th>
            <th onClick={() => onSort('stock')}>Stock {getSortIcon('stock')}</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {/* 2. Mostramos los datos correspondientes en cada celda */}
          {valvulas.map((valve) => (
            <tr key={valve.id}>
              {/* Para marca y modelo, mostramos los de la primera aplicación */}
              <td>
                {valve.fotos && valve.fotos.length > 0 ? (
                  <img 
                    src={valve.fotos[0].imagen} 
                    alt="Miniatura" 
                    className="tabla-foto-miniatura"
                    onClick={() => onFotoClick(valve.fotos[0].imagen)}
                  />
                ) : (
                  <div className="foto-placeholder"></div>
                )}
              </td>
               <td>
                {valve.numeros_de_parte.find(part => part.marca === 'TRW')?.numero_de_parte}
              </td>
              <td className="celda-clicable">
                <Link to={`/valvula/${valve.id}`}>
                  {valve.aplicaciones?.[0]?.modelo_vehiculo || 'N/A'}
                </Link>
              </td>
              <td>{valve.aplicaciones[0]?.marca_vehiculo_nombre}</td>

              <td>{valve.tipo === 'ADMISION' ? 'Admisión' : 'Escape'}</td>
              <td>{valve.diametro_cabeza}</td>
              <td>{valve.diametro_vastago}</td>
              <td>{valve.longitud_total}</td>
              <td>{valve.ranuras}</td>
              <td>{valve.distancia_primera_ranura}</td>
              <td>{valve.stock}</td>
              <td className="columna-acciones">
                <div className="acciones-cell">
                  <button className="accion-btn add-cart-btn" onClick={() => onAddToCart(valve, 1)} title="Añadir al carrito">
                    🛒
                  </button>
                  <button className="accion-btn edit-btn" onClick={() => onEditar(valve)} title="Editar Válvula">
                    ✏️
                  </button>
                </div>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TablaResultados;
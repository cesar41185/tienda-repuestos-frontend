// En src/components/TablaResultados.jsx

function TablaResultados({ valvulas, cargando }) {
  if (cargando) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="results-container">
      <table id="resultsTable">
        <thead>
          {/* 1. Definimos las nuevas cabeceras de la tabla */}
          <tr>
            <th>Código TRW</th>
            <th>Modelo</th>
            <th>Marca</th>
            <th>Tipo</th>
            <th>Cabeza (mm)</th>
            <th>Vástago (mm)</th>
            <th>Longitud (mm)</th>
            <th>Ranuras</th>
            <th>Distancia Ranura (mm)</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {/* 2. Mostramos los datos correspondientes en cada celda */}
          {valvulas.map((valve) => (
            <tr key={valve.id}>
              {/* Para marca y modelo, mostramos los de la primera aplicación */}
               <td>
                {valve.numeros_de_parte.find(part => part.marca === 'TRW')?.numero_de_parte}
              </td>
              <td>{valve.aplicaciones[0]?.modelo_vehiculo}</td>
              <td>{valve.aplicaciones[0]?.marca_vehiculo}</td>
              <td>{valve.tipo === 'ADMISION' ? 'Admisión' : 'Escape'}</td>
              <td>{valve.diametro_cabeza}</td>
              <td>{valve.diametro_vastago}</td>
              <td>{valve.longitud_total}</td>
              <td>{valve.ranuras}</td>
              <td>{valve.distancia_primera_ranura}</td>
              <td>{valve.stock}</td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TablaResultados;
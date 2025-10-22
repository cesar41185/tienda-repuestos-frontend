// En src/components/TablaResultados.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import { JUEGO_UNIDADES } from '../apiConfig';
import { SERVER_BASE_URL } from '../apiConfig';

function TablaResultados({ productos, cargando, onEditar, onFotoClick, onSort, sortConfig, onAddToCart, cantidades, onCantidadChange }) {
  const { user } = useAuth();
  const { clienteActivo } = useCarrito();

  const abreviaturasTipo = {
    INTAKE: 'Int',
    EXHAUST: 'Esc',
  };

  const isStaff = user && user.groups.length > 0;

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return ' ↕️';
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };
  
  const esAlmacen = user && user.groups.includes('Almacen');
  const esVendedor = user && user.groups.includes('Vendedor');
  const esCajero = user && user.groups.includes('Cajero');

  if (cargando) {
    return <p>Cargando productos...</p>;
  }

  return (
  <div className="results-container">
    <table id="resultsTable">
      <thead>
        <tr>
          <th className="col-foto">Foto</th>
          {isStaff && <th className="col-trw">Cod TRW</th>}
          <th className="col-modelo">Modelo</th>
          <th className="col-marca">Marca</th>
          <th className="col-precio">Precio</th>
          <th className="col-tipo">Tipo</th>
          <th className="col-numerica">Cabe.(mm)</th>
          <th className="col-numerica">Vást.(mm)</th>
          <th className="col-numerica">Long.(mm)</th>
          <th className="col-numerica">Ran</th>
          <th className="col-stock">Cant</th>
          <th className="col-acciones-tabla">Compra</th>
        </tr>
      </thead>
      <tbody>
          {productos.map((producto) => {
            const cantidadJuegos = cantidades[producto.id] || 1;
            const cantidadUnidadesRequeridas = cantidadJuegos * JUEGO_UNIDADES;
            const stockInsuficiente = producto.stock < cantidadUnidadesRequeridas;

            return (
              <tr key={producto.id}>
                <td className="col-foto">
                  {producto.fotos && producto.fotos.length > 0 ? (
                   <img 
                      // Construye la URL absoluta: Base del Servidor + Ruta Relativa de la Imagen
                      src={`${SERVER_BASE_URL}${producto.fotos[0].imagen}`} 
                      alt="Miniatura" 
                      className="tabla-foto-miniatura"
                      onClick={() => onFotoClick(`${SERVER_BASE_URL}${producto.fotos[0].imagen}`)} // También al ampliar
                    />
                  ) : (
                    <div className="foto-placeholder"></div>
                  )}
                </td>
                {isStaff && ( <td className="col-trw">{producto.numeros_de_parte?.find(part => part.marca === 'TRW')?.numero_de_parte || 'N/A'}</td> )}
                <td className="col-modelo">
                  <Link to={`/producto/${producto.id}`} className="truncar-2-lineas">
                    {producto.aplicaciones?.[0]?.modelo_vehiculo || 'Uso General'}
                  </Link>
                </td>
                <td className="col-marca">{producto.aplicaciones?.[0]?.marca_vehiculo_nombre || 'N/A'}</td>
                <td className="col-precio">${producto.precio_venta}</td>
                <td className="col-tipo">
                  {abreviaturasTipo[producto.especificaciones?.tipo] || producto.especificaciones?.tipo || 'N/A'}
                </td>
                <td className="col-numerica">{producto.especificaciones?.diametro_cabeza || 'N/A'}</td>
                <td className="col-numerica">{producto.especificaciones?.diametro_vastago || 'N/A'}</td>
                <td className="col-numerica">{producto.especificaciones?.longitud_total || 'N/A'}</td>
                <td className="col-numerica">{producto.especificaciones?.ranuras || 'N/A'}</td>
                <td className="col-stock">{producto.stock}</td>
                <td className="col-acciones-tabla">
                  <div className="acciones-cell">
                    {(!isStaff || (isStaff && clienteActivo)) && (
                      // --- NUEVO DIV CONTENEDOR AÑADIDO ---
                      <div className="compra-grupo">
                        <input
                          type="number"
                          min="1"
                          className="cantidad-input"
                          placeholder="1"
                          value={cantidades[producto.id] || ''}
                          onChange={(e) => onCantidadChange(producto.id, e.target.value)}
                          onFocus={(e) => e.target.select()}
                          style={{ borderColor: stockInsuficiente ? 'red' : '#ccc' }}
                        />
                        {/* Texto simplificado a "x8" */}
                        <span>x{JUEGO_UNIDADES}</span>
                        <button 
                          className="accion-btn add-cart-btn" 
                          onClick={() => onAddToCart(producto)} 
                          title={stockInsuficiente ? `Stock insuficiente. Disponible: ${producto.stock}` : 'Añadir al carrito'}
                          disabled={stockInsuficiente}
                        >
                          🛒
                        </button>
                      </div>
                    )}
                    
                    {user && (user.groups.includes('Administrador') || user.groups.includes('Almacen')) && (
                      <button className="accion-btn edit-btn" onClick={() => onEditar(producto)} title="Editar Producto">✏️</button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default TablaResultados;
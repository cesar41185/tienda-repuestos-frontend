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
          {isStaff && <th className="col-trw" onClick={() => onSort('numeros_de_parte__numero_de_parte')} style={{cursor: 'pointer'}}>TRW{getSortIcon('numeros_de_parte__numero_de_parte')}</th>}
          <th className="col-modelo" onClick={() => onSort('aplicaciones__modelo_vehiculo')} style={{cursor: 'pointer'}}>Modelo{getSortIcon('aplicaciones__modelo_vehiculo')}</th>
          <th className="col-marca" onClick={() => onSort('aplicaciones__marca_vehiculo__nombre')} style={{cursor: 'pointer'}}>Marca{getSortIcon('aplicaciones__marca_vehiculo__nombre')}</th>
          <th className="col-precio" onClick={() => onSort('precio_venta')} style={{cursor: 'pointer'}}>Precio{getSortIcon('precio_venta')}</th>
          <th className="col-tipo" onClick={() => onSort('especificaciones__tipo')} style={{cursor: 'pointer'}}>Tipo{getSortIcon('especificaciones__tipo')}</th>
          <th className="col-numerica" onClick={() => onSort('especificaciones__diametro_cabeza')} style={{cursor: 'pointer'}}>Cabe.(mm){getSortIcon('especificaciones__diametro_cabeza')}</th>
          <th className="col-numerica" onClick={() => onSort('especificaciones__diametro_vastago')} style={{cursor: 'pointer'}}>Vást.(mm){getSortIcon('especificaciones__diametro_vastago')}</th>
          <th className="col-numerica" onClick={() => onSort('especificaciones__longitud_total')} style={{cursor: 'pointer'}}>Long.(mm){getSortIcon('especificaciones__longitud_total')}</th>
          <th className="col-numerica" onClick={() => onSort('especificaciones__ranuras')} style={{cursor: 'pointer'}}>Ran{getSortIcon('especificaciones__ranuras')}</th>
          {isStaff && <th className="col-stock" onClick={() => onSort('stock')} style={{cursor: 'pointer'}}>Cant{getSortIcon('stock')}</th>}
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
                      src={producto.fotos[0].imagen} 
                      alt="Miniatura" 
                      className="tabla-foto-miniatura"
                      onClick={() => onFotoClick(producto.fotos[0].imagen)}
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
                {isStaff && <td className="col-stock">{producto.stock}</td>}
                <td className="col-acciones-tabla">
                  <div className="acciones-cell-compactas">
                    {(!isStaff || (isStaff && clienteActivo)) && (
                      <div className="cantidad-compacta">
                        <input
                          type="number"
                          min="1"
                          className="cantidad-input-compacto"
                          placeholder="1"
                          value={cantidades[producto.id] || ''}
                          onChange={(e) => onCantidadChange(producto.id, e.target.value)}
                          onFocus={(e) => e.target.select()}
                          style={{ borderColor: stockInsuficiente ? 'red' : '#ccc' }}
                        />
                        <span className="multiplier-compacto">x{JUEGO_UNIDADES}</span>
                      </div>
                    )}
                    
                    <div className="botones-accion-inline">
                      {(!isStaff || (isStaff && clienteActivo)) && (
                        <button 
                          className="accion-btn add-cart-btn" 
                          onClick={() => onAddToCart(producto)} 
                          title={stockInsuficiente ? `Stock insuficiente. Disponible: ${producto.stock}` : 'Añadir al carrito'}
                          disabled={stockInsuficiente}
                        >
                          🛒
                        </button>
                      )}
                      
                      {user && (user.groups.includes('Administrador') || user.groups.includes('Almacen')) && (
                        <button className="accion-btn edit-btn" onClick={() => onEditar(producto)} title="Editar Producto">✏️</button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Vista de tarjetas para móvil */}
      <div className="productos-cards-mobile">
        {productos.map((producto) => {
          const cantidadJuegos = cantidades[producto.id] || 1;
          const cantidadUnidadesRequeridas = cantidadJuegos * JUEGO_UNIDADES;
          const stockInsuficiente = producto.stock < cantidadUnidadesRequeridas;

          return (
            <div key={producto.id} className="producto-card">
              <div className="card-header">
                {producto.fotos && producto.fotos.length > 0 && (
                  <img 
                    src={producto.fotos[0].imagen} 
                    alt="Producto" 
                    className="card-foto"
                    onClick={() => onFotoClick(producto.fotos[0].imagen)}
                  />
                )}
                <div className="card-info-header">
                  <Link to={`/producto/${producto.id}`}>
                    <h3>{producto.aplicaciones?.[0]?.modelo_vehiculo || 'Uso General'}</h3>
                  </Link>
                  <span className="card-precio">${producto.precio_venta}</span>
                </div>
              </div>
              
              <div className="card-specs">
                <span><strong>Marca:</strong> {producto.aplicaciones?.[0]?.marca_vehiculo_nombre || 'N/A'}</span>
                <span><strong>Tipo:</strong> {abreviaturasTipo[producto.especificaciones?.tipo] || producto.especificaciones?.tipo || 'N/A'}</span>
                <span><strong>Cabeza:</strong> {producto.especificaciones?.diametro_cabeza || 'N/A'} mm</span>
                <span><strong>Vástago:</strong> {producto.especificaciones?.diametro_vastago || 'N/A'} mm</span>
                <span><strong>Long:</strong> {producto.especificaciones?.longitud_total || 'N/A'} mm</span>
                <span><strong>Ranuras:</strong> {producto.especificaciones?.ranuras || 'N/A'}</span>
                {isStaff && <span><strong>Stock:</strong> {producto.stock}</span>}
                {isStaff && (
                  <span><strong>TRW:</strong> {producto.numeros_de_parte?.find(part => part.marca === 'TRW')?.numero_de_parte || 'N/A'}</span>
                )}
              </div>

              {(!isStaff || (isStaff && clienteActivo)) && (
                <div className="card-actions">
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
                    <span>x{JUEGO_UNIDADES}</span>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => onAddToCart(producto)} 
                      disabled={stockInsuficiente}
                      style={{flex: 1}}
                    >
                      🛒 Añadir
                    </button>
                  </div>
                </div>
              )}
              
              {user && (user.groups.includes('Administrador') || user.groups.includes('Almacen')) && (
                <div className="card-actions">
                  <button className="btn btn-secondary" onClick={() => onEditar(producto)}>
                    ✏️ Editar Producto
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TablaResultados;
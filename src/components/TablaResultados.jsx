// En src/components/TablaResultados.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import { JUEGO_UNIDADES } from '../apiConfig';
import { SERVER_BASE_URL } from '../apiConfig';
import { SkeletonRow } from './SkeletonLoader';
import { ImagePlaceholder } from './ImagePlaceholder';

function TablaResultados({ productos, cargando, onEditar, onFotoClick, onSort, sortConfig, onAddToCart, cantidades, onCantidadChange, tipoProducto }) {
  const { user } = useAuth();
  const { clienteActivo } = useCarrito();

  const abreviaturasTipo = {
    INTAKE: 'Int',
    EXHAUST: 'Esc',
  };

  const isStaff = user && user.groups.length > 0;

  const getSortIcon = (key) => {
    // No mostrar iconos visuales, solo dejar funcional el ordenamiento
    return '';
  };
  
  const esAlmacen = user && user.groups.includes('Almacen');
  const esVendedor = user && user.groups.includes('Vendedor');
  const esCajero = user && user.groups.includes('Cajero');

  // Determinar qué columnas mostrar según el tipo de producto
  const esValvula = tipoProducto === 'VALVULA';
  const esGuiaValvula = tipoProducto === 'GUIA_VALVULA';

  // Renderizar encabezados según el tipo
  const renderEncabezados = () => {
    return (
      <thead>
        <tr>
          <th className="col-foto">Foto</th>
          {isStaff && !esGuiaValvula && (
            <th className="col-trw" onClick={() => onSort('numeros_de_parte__numero_de_parte')} style={{cursor: 'pointer'}}>TRW{getSortIcon('numeros_de_parte__numero_de_parte')}</th>
          )}
          {!esGuiaValvula && (
            <>
              <th className="col-modelo" onClick={() => onSort('aplicaciones__modelo_vehiculo')} style={{cursor: 'pointer'}}>Modelo{getSortIcon('aplicaciones__modelo_vehiculo')}</th>
              <th className="col-marca" onClick={() => onSort('aplicaciones__marca_vehiculo__nombre')} style={{cursor: 'pointer'}}>Marca{getSortIcon('aplicaciones__marca_vehiculo__nombre')}</th>
            </>
          )}
          {!esGuiaValvula && (
            <th className="col-precio" onClick={() => onSort('precio_venta')} style={{cursor: 'pointer'}}>Precio{getSortIcon('precio_venta')}</th>
          )}
          {esValvula && <th className="col-tipo" onClick={() => onSort('especificaciones__tipo')} style={{cursor: 'pointer'}}>Tipo{getSortIcon('especificaciones__tipo')}</th>}
          {esValvula && <th className="col-numerica" onClick={() => onSort('especificaciones__diametro_cabeza')} style={{cursor: 'pointer'}}>Cabe.(mm){getSortIcon('especificaciones__diametro_cabeza')}</th>}
          {esValvula && <th className="col-numerica" onClick={() => onSort('especificaciones__diametro_vastago')} style={{cursor: 'pointer'}}>Vást.(mm){getSortIcon('especificaciones__diametro_vastago')}</th>}
          {esValvula && <th className="col-long" onClick={() => onSort('especificaciones__longitud_total')} style={{cursor: 'pointer'}}>Long.(mm){getSortIcon('especificaciones__longitud_total')}</th>}
          {esValvula && <th className="col-numerica" onClick={() => onSort('especificaciones__ranuras')} style={{cursor: 'pointer'}}>Ran{getSortIcon('especificaciones__ranuras')}</th>}
          {esGuiaValvula && <th className="col-numerica" onClick={() => onSort('especificaciones__diametro_exterior')} style={{cursor: 'pointer'}}>Ext.(mm){getSortIcon('especificaciones__diametro_exterior')}</th>}
          {esGuiaValvula && <th className="col-numerica" onClick={() => onSort('especificaciones__diametro_interior')} style={{cursor: 'pointer'}}>Int.(mm){getSortIcon('especificaciones__diametro_interior')}</th>}
          {esGuiaValvula && <th className="col-long" onClick={() => onSort('especificaciones__longitud_total')} style={{cursor: 'pointer'}}>Long.(mm){getSortIcon('especificaciones__longitud_total')}</th>}
          {esGuiaValvula && <th className="col-numerica">Compat.</th>}
          {esGuiaValvula && (
            <th className="col-precio" onClick={() => onSort('precio_venta')} style={{cursor: 'pointer'}}>Precio{getSortIcon('precio_venta')}</th>
          )}
          <th className="col-estado">Stock</th>
          {isStaff && <th className="col-stock" onClick={() => onSort('stock')} style={{cursor: 'pointer'}}>Cant{getSortIcon('stock')}</th>}
          <th className="col-acciones-tabla">Compra</th>
        </tr>
      </thead>
    );
  };

  return (
  <div className="results-container">
    <table id="resultsTable">
      {renderEncabezados()}
      <tbody>
          {cargando && (
            <>
              {Array.from({ length: 10 }).map((_, i) => (
                <SkeletonRow key={i} columns={esValvula ? 12 : esGuiaValvula ? 9 : 10} />
              ))}
            </>
          )}
          {!cargando && productos.map((producto) => {
            const cantidadJuegos = cantidades[producto.id] || 1;
            const cantidadUnidadesRequeridas = cantidadJuegos * JUEGO_UNIDADES;
            const stockInsuficiente = producto.stock < cantidadUnidadesRequeridas;

            return (
              <tr key={producto.id}>
                <td className="col-foto">
                  {producto.fotos && producto.fotos.length > 0 ? (
                    <img 
                      // Usar foto principal si existe, sino la primera
                      src={producto.fotos.find(f => f.es_principal)?.imagen || producto.fotos[0].imagen} 
                      alt="Miniatura" 
                      className="tabla-foto-miniatura"
                      onClick={() => {
                        const fotoPrincipal = producto.fotos.find(f => f.es_principal) || producto.fotos[0];
                        onFotoClick(fotoPrincipal.imagen);
                      }}
                    />
                  ) : (
                    <ImagePlaceholder size="40px" />
                  )}
                </td>
                {isStaff && !esGuiaValvula && (
                  <td className="col-trw">{producto.numeros_de_parte?.find(part => part.marca === 'TRW')?.numero_de_parte || 'N/A'}</td>
                )}
                {!esGuiaValvula && (
                  <>
                                        <td className="col-modelo">
                      <Link to={`/producto/${producto.id}`} className="truncar-2-lineas">
                        {producto.vehiculos?.[0]?.modelo || 'Uso General'}
                      </Link>
                    </td>
                    <td className="col-marca">{producto.vehiculos?.[0]?.marca || 'N/A'}</td>
                  </>
                )}
                {!esGuiaValvula && (
                  <td className="col-precio">${producto.precio_venta}</td>
                )}
                {esValvula && (
                  <>
                    <td className="col-tipo">
                      {abreviaturasTipo[producto.especificaciones?.tipo] || producto.especificaciones?.tipo || 'N/A'}
                    </td>
                    <td className="col-numerica">{producto.especificaciones?.diametro_cabeza || 'N/A'}</td>
                    <td className="col-numerica">{producto.especificaciones?.diametro_vastago || 'N/A'}</td>
                    <td className="col-long">{producto.especificaciones?.longitud_total || 'N/A'}</td>
                    <td className="col-numerica">{producto.especificaciones?.ranuras || 'N/A'}</td>
                  </>
                )}
                {esGuiaValvula && (
                  <>
                    <td className="col-numerica">{producto.especificaciones?.diametro_exterior || 'N/A'}</td>
                    <td className="col-numerica">{producto.especificaciones?.diametro_interior || 'N/A'}</td>
                    <td className="col-long">{producto.especificaciones?.longitud_total || 'N/A'}</td>
                    {(() => {
                      const compat = Array.isArray(producto.valvulas_compatibles) ? producto.valvulas_compatibles : [];
                      const count = compat.length;
                      const sample = compat.slice(0, 3).map(v => typeof v === 'object' ? (v.codigo_interno || v.id) : v).join(', ');
                      const title = count > 0 ? `Primeras: ${sample}${count > 3 ? '…' : ''}` : 'Sin válvulas compatibles';
                      const badgeStyle = {
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: count > 0 ? '#2e7d32' : '#bbb',
                        color: 'white',
                        fontSize: 12,
                        minWidth: 28,
                        textAlign: 'center'
                      };
                      return (
                        <td className="col-numerica" title={title}>
                          <Link to={`/producto/${producto.id}`} style={{ textDecoration: 'none' }}>
                            <span style={badgeStyle}>{count}</span>
                          </Link>
                        </td>
                      );
                    })()}
                    <td className="col-precio">${producto.precio_venta}</td>
                  </>
                )}
                {(() => {
                  const stock = Number(producto.stock || 0);
                  const min = Number(producto.stock_minimo || 0);
                  let estado = 'OK';
                  let color = '#2e7d32';
                  if (stock === 0) { estado = 'Bajo'; color = '#b71c1c'; }
                  else if (min > 0 && stock <= min) { estado = 'Bajo'; color = '#e65100'; }
                  return <td className="col-estado" style={{ color, fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }}>{estado}</td>;
                })()}
                {isStaff && <td className="col-stock">{producto.stock}</td>}
                <td className="col-acciones-tabla">
                  <div className="acciones-cell-compactas">
                    {/* Link 'Ver' eliminado: en válvulas ya se accede desde el Modelo; en guías el badge de Compat abre detalle. */}
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
                    src={producto.fotos.find(f => f.es_principal)?.imagen || producto.fotos[0].imagen} 
                    alt="Producto" 
                    className="card-foto"
                    onClick={() => {
                      const fotoPrincipal = producto.fotos.find(f => f.es_principal) || producto.fotos[0];
                      onFotoClick(fotoPrincipal.imagen);
                    }}
                  />
                )}
                <div className="card-info-header">
                  <Link to={`/producto/${producto.id}`}>
                    {esGuiaValvula ? (
                      <h3>{producto.codigo_interno || 'Guía de válvula'}</h3>
                    ) : (
                      <h3>{producto.vehiculos?.[0]?.modelo || 'Uso General'}</h3>
                    )}
                  </Link>
                  <span className="card-precio">${producto.precio_venta}</span>
                </div>
              </div>
              
              <div className="card-specs">
                {esValvula && (
                  <>
                    <span><strong>Marca:</strong> {producto.vehiculos?.[0]?.marca || 'N/A'}</span>
                    <span><strong>Tipo:</strong> {abreviaturasTipo[producto.especificaciones?.tipo] || producto.especificaciones?.tipo || 'N/A'}</span>
                    <span><strong>Cabeza:</strong> {producto.especificaciones?.diametro_cabeza || 'N/A'} mm</span>
                    <span><strong>Vástago:</strong> {producto.especificaciones?.diametro_vastago || 'N/A'} mm</span>
                    <span><strong>Long:</strong> {producto.especificaciones?.longitud_total || 'N/A'} mm</span>
                    <span><strong>Ranuras:</strong> {producto.especificaciones?.ranuras || 'N/A'}</span>
                    {isStaff && <span><strong>Stock:</strong> {producto.stock}</span>}
                    {isStaff && (
                      <span><strong>TRW:</strong> {producto.numeros_de_parte?.find(part => part.marca === 'TRW')?.numero_de_parte || 'N/A'}</span>
                    )}
                  </>
                )}

                {esGuiaValvula && (() => {
                  const compat = Array.isArray(producto.valvulas_compatibles) ? producto.valvulas_compatibles : [];
                  const count = compat.length;
                  const sample = compat.slice(0, 3).map(v => typeof v === 'object' ? (v.codigo_interno || v.id) : v).join(', ');
                  const title = count > 0 ? `Primeras: ${sample}${count > 3 ? '…' : ''}` : 'Sin válvulas compatibles';
                  const badgeStyle = {
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: count > 0 ? '#2e7d32' : '#bbb',
                    color: 'white',
                    fontSize: 12,
                    minWidth: 28,
                    textAlign: 'center'
                  };
                  return (
                    <>
                      <span><strong>Ext.:</strong> {producto.especificaciones?.diametro_exterior || 'N/A'} mm</span>
                      <span><strong>Int.:</strong> {producto.especificaciones?.diametro_interior || 'N/A'} mm</span>
                      <span><strong>Long.:</strong> {producto.especificaciones?.longitud_total || 'N/A'} mm</span>
                      <span title={title}>
                        <strong>Compat:</strong> 
                        <Link to={`/producto/${producto.id}`} style={{ textDecoration: 'none', marginLeft: 6 }}>
                          <span style={badgeStyle}>{count}</span>
                        </Link>
                      </span>
                      {isStaff && <span><strong>Stock:</strong> {producto.stock}</span>}
                    </>
                  );
                })()}
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
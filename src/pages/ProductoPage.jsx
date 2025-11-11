import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext';
import { useAuth } from '../context/AuthContext';
import API_URL from '../apiConfig';
import { SERVER_BASE_URL } from '../apiConfig';

function ProductoPage() {
  const { user } = useAuth();
  const isStaff = user && user.groups.length > 0;
  const { id } = useParams();
  const navigate = useNavigate();
  const { agregarAlCarrito } = useCarrito();
  
  const [producto, setProducto] = useState(null); // Renombrado de 'valvula' a 'producto'
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        setCargando(true);
        const response = await fetch(`${API_URL}/productos/${id}/`);
        if (!response.ok) {
          throw new Error('No se encontró el producto');
        }
        const data = await response.json();

        // Enriquecer válvulas compatibles si vienen como IDs o sin código
        if (data?.tipo_producto === 'GUIA_VALVULA' && Array.isArray(data.valvulas_compatibles)) {
          const idsParaConsultar = data.valvulas_compatibles
            .map(v => (typeof v === 'number' ? v : (!v.codigo_interno && v.id ? v.id : null)))
            .filter(Boolean);

          if (idsParaConsultar.length > 0) {
            try {
              const detalles = await Promise.all(
                idsParaConsultar.map(vid => 
                  fetch(`${API_URL}/productos/${vid}/`).then(r => r.ok ? r.json() : null).catch(() => null)
                )
              );
              const mapa = new Map();
              detalles.forEach(d => { if (d && d.id) mapa.set(d.id, d); });
              data.valvulas_compatibles = data.valvulas_compatibles.map(v => {
                if (typeof v === 'number') {
                  const det = mapa.get(v);
                  return det ? { id: det.id, codigo_interno: det.codigo_interno } : { id: v };
                }
                if (!v.codigo_interno && v.id) {
                  const det = mapa.get(v.id);
                  return det ? { ...v, codigo_interno: det.codigo_interno } : v;
                }
                return v;
              });
            } catch {
              // Si falla el enriquecimiento, continuamos con los datos originales
            }
          }
        }

        setProducto(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    fetchProducto();
  }, [id]);


  if (cargando) return <p>Cargando producto...</p>;
  if (error) return <p>Error: {error}. <Link to="/tienda">Volver a la tienda</Link></p>;
  if (!producto) return null;

  // Normalizar estructura de válvulas compatibles: puede venir como lista de IDs o de objetos
  const valvulasCompatibles = Array.isArray(producto.valvulas_compatibles)
    ? producto.valvulas_compatibles.map(v => (typeof v === 'number' ? { id: v } : v))
    : [];

  const handleVolver = () => {
    // Mapeo de tipo a URL
    const tipoToUrl = (tipo) => {
      const map = {
        'VALVULA': 'valvula',
        'GUIA_VALVULA': 'guia-valvula',
      };
      return map[tipo] || tipo?.toLowerCase();
    };

    // Preferir último tipo visitado en tienda si existe
    const savedFilters = localStorage.getItem('tienda_filters');
    let ultimoTipo = null;
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        if (filters && filters.tipo_producto) ultimoTipo = filters.tipo_producto;
      } catch {}
    }
    const tipoProd = producto.tipo_producto || ultimoTipo;
    if (tipoProd) {
      const urlTipo = tipoToUrl(tipoProd);
      navigate(`/tienda/${urlTipo}`);
    } else {
      navigate('/tienda');
    }
  };

  return (
    <div> {/* Contenedor principal agregado */}
      <button onClick={handleVolver} className="volver-tienda-btn">
        ← Volver a la Tienda
      </button>
      <div className="producto-detalle-container">
        <div className="producto-fotos">
          {producto.fotos.map(foto => (
            <img 
              key={foto.id} 
              // Construye la URL absoluta
              src={foto.imagen} 
              alt={`Foto de ${producto.codigo_interno}`} 
            />
          ))}
        </div>
        <div className="producto-info">
          <h1>{producto.codigo_interno}</h1>
          <p className="producto-modelo">{(producto.aplicaciones_compactas?.[0]?.modelo_compacto || producto.aplicaciones?.[0]?.modelo_vehiculo) || 'Uso General'}</p>
          <p className="producto-precio">${producto.precio_venta}</p>
          
          <div className="producto-acciones">
            <input 
                type="number" 
                value={cantidad} 
                onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value)))}
                min="1"
              />
            <button onClick={() => agregarAlCarrito(producto, cantidad)}>
              Añadir al Carrito
            </button>
          </div>

          <h3>Especificaciones Técnicas</h3>
          {producto.peso != null && (
            <ul>
              <li><strong>Peso:</strong> {producto.peso} g</li>
            </ul>
          )}
          {producto.tipo_producto === 'VALVULA' && (
            <ul>
              <li><strong>Tipo:</strong> {producto.especificaciones?.tipo || 'N/D'}</li>
              {isStaff && <li><strong>Stock disponible:</strong> {producto.stock}</li>}
              <li><strong>Diámetro de Cabeza:</strong> {producto.especificaciones?.diametro_cabeza || 'N/D'} mm</li>
              <li><strong>Diámetro de Vástago:</strong> {producto.especificaciones?.diametro_vastago || 'N/D'} mm</li>
              <li><strong>Longitud Total:</strong> {producto.especificaciones?.longitud_total || 'N/D'} mm</li>
              <li><strong>Ranuras:</strong> {producto.especificaciones?.ranuras || 'N/D'}</li>
              <li><strong>Ángulo de Asiento:</strong> {producto.especificaciones?.angulo_asiento || 'N/D'} °</li>
              <li><strong>Distancia 1ª Ranura:</strong> {producto.especificaciones?.distancia_primera_ranura || 'N/D'} mm</li>
            </ul>
          )}
          {producto.tipo_producto === 'GUIA_VALVULA' && (
            <ul>
              {isStaff && <li><strong>Stock disponible:</strong> {producto.stock}</li>}
              <li><strong>Diámetro exterior:</strong> {producto.especificaciones?.diametro_exterior || 'N/D'} mm</li>
              <li><strong>Diámetro interior:</strong> {producto.especificaciones?.diametro_interior || 'N/D'} mm</li>
              <li><strong>Longitud Total:</strong> {producto.especificaciones?.longitud_total || 'N/D'} mm</li>
              {/* Enlazar válvulas compatibles si existen */}
              {valvulasCompatibles.length > 0 && (
                <li>
                  <strong>Válvulas compatibles:</strong>
                  <ul>
                    {valvulasCompatibles.map(v => (
                      <li key={v.id}>
                        <Link to={`/producto/${v.id}`}>{v.codigo_interno || `Producto #${v.id}`}</Link>
                      </li>
                    ))}
                  </ul>
                </li>
              )}
            </ul>
          )}

          
          {isStaff && (
            <>
            <h3>Números de Parte (Referencias)</h3>
            <div className="part-numbers-container">
              {producto.numeros_de_parte
                .filter(part => part.marca !== 'SKU ML') // Filtramos para excluir 'SKU ML'
                .map(part => (
                  <div key={part.id} className="part-number-item">
                    <span className="part-brand">{part.marca}</span>
                    <span className="part-code">{part.numero_de_parte}</span>
                  </div>
                  ))
              }
            </div>
            </>
          )}

          <h3>Aplicaciones</h3>
          <ul>
            {producto.aplicaciones.map(app => (
              <li key={app.id}>
                {app.marca_vehiculo_nombre} {app.modelo_vehiculo} ({app.ano_desde}-{app.ano_hasta})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ProductoPage;
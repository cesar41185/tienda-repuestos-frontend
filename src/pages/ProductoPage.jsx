import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext';
import { useAuth } from '../context/AuthContext';
import API_URL from '../apiConfig';

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
  if (error) return <p>Error: {error}. <Link to="/">Volver a la tienda</Link></p>;
  if (!producto) return null;

  return (
    <div> {/* Contenedor principal agregado */}
      <button onClick={() => navigate('/')} className="volver-tienda-btn">
        ← Volver a la Tienda
      </button>
      <div className="producto-detalle-container">
        <div className="producto-fotos">
          {producto.fotos.map(foto => (
            <img key={foto.id} src={foto.imagen} alt={`Foto de ${producto.codigo_interno}`} />
          ))}
        </div>
        <div className="producto-info">
          <h1>{producto.codigo_interno}</h1>
          <p className="producto-modelo">{producto.aplicaciones?.[0]?.modelo_vehiculo || 'Uso General'}</p>
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

          {/* ▼▼▼ SECCIÓN CORREGIDA ▼▼▼ */}
          <h3>Especificaciones Técnicas</h3>
          <ul>
            {/* Usamos 'producto.especificaciones?.' para acceder de forma segura */}
            <li><strong>Tipo:</strong> {producto.especificaciones?.tipo || 'N/D'}</li>
            <li><strong>Stock disponible:</strong> {producto.stock}</li>
            <li><strong>Diámetro de Cabeza:</strong> {producto.especificaciones?.diametro_cabeza || 'N/D'} mm</li>
            <li><strong>Diámetro de Vástago:</strong> {producto.especificaciones?.diametro_vastago || 'N/D'} mm</li>
            <li><strong>Longitud Total:</strong> {producto.especificaciones?.longitud_total || 'N/D'} mm</li>
            <li><strong>Ranuras:</strong> {producto.especificaciones?.ranuras || 'N/D'}</li>
            <li><strong>Ángulo de Asiento:</strong> {producto.especificaciones?.angulo_asiento || 'N/D'} °</li>
            <li><strong>Distancia 1ª Ranura:</strong> {producto.especificaciones?.distancia_primera_ranura || 'N/D'} mm</li>
          </ul>

          
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
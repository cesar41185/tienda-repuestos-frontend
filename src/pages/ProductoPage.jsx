// En src/pages/ProductoPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // <-- useParams para leer el :id de la URL
import { useCarrito } from '../context/CarritoContext';

function ProductoPage() {
  const { id } = useParams(); // Obtenemos el ID de la válvula desde la URL
  const { agregarAlCarrito } = useCarrito();
  const navigate = useNavigate();
  
  const [valvula, setValvula] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    const fetchValvula = async () => {
      try {
        setCargando(true);
        const response = await fetch(`http://192.168.1.55:8000/api/valvulas/${id}/`);
        if (!response.ok) {
          throw new Error('No se encontró la válvula');
        }
        const data = await response.json();
        setValvula(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    fetchValvula();
  }, [id]); // El efecto se ejecuta cada vez que el ID de la URL cambie

  if (cargando) return <p>Cargando producto...</p>;
  if (error) return <p>Error: {error}. <Link to="/">Volver a la tienda</Link></p>;
  if (!valvula) return null; // No renderizar nada si no hay datos

  return (
    <div className="producto-detalle-container">
      <button onClick={() => navigate('/')} className="volver-tienda-btn">
        ← Volver a la Tienda
      </button>
      <div className="producto-fotos">
        {valvula.fotos.map(foto => (
          <img key={foto.id} src={foto.imagen} alt={`Foto de ${valvula.codigo_interno}`} />
        ))}
      </div>
      <div className="producto-info">
        <h1>{valvula.codigo_interno}</h1>
        <p className="producto-modelo">{valvula.aplicaciones?.[0]?.modelo_vehiculo || 'Uso General'}</p>
        <p className="producto-precio">${valvula.precio_venta}</p>
        
        <div className="producto-acciones">
           <input 
              type="number" 
              value={cantidad} 
              onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value)))}
              min="1"
            />
          <button onClick={() => agregarAlCarrito(valvula, cantidad)}>
            Añadir al Carrito
          </button>
        </div>

        <h3>Especificaciones Técnicas</h3>
        <ul>
          <li><strong>Tipo:</strong> {valvula.tipo}</li>
          <li><strong>Stock disponible:</strong> {valvula.stock}</li>
          <li><strong>Diámetro de Cabeza:</strong> {valvula.diametro_cabeza} mm</li>
          <li><strong>Diámetro de Vástago:</strong> {valvula.diametro_vastago} mm</li>
          <li><strong>Longitud Total:</strong> {valvula.longitud_total} mm</li>
        </ul>
        
        <h3>Aplicaciones</h3>
        <ul>
          {valvula.aplicaciones.map(app => (
            <li key={app.id}>
              {app.marca_vehiculo_nombre} {app.modelo_vehiculo} ({app.ano_desde}-{app.ano_hasta})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ProductoPage;
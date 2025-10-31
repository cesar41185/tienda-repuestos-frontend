// En src/components/VistaDetalle.jsx
import { useState, useEffect } from 'react';
import API_URL from '../apiConfig';

// Recibe el ID de la válvula a mostrar y una función para volver a la lista
function VistaDetalle({ valvulaId, onVolver }) {
  const [valvula, setValvula] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchDetalleValvula = async () => {
      setCargando(true);
      try {
        const response = await fetch(`${API_URL}/productos/${valvulaId}/`);
        const data = await response.json();
        setValvula(data);
      } catch (error) {
        console.error("Error al cargar el detalle de la válvula:", error);
      }
      setCargando(false);
    };

    if (valvulaId) {
      fetchDetalleValvula();
    }
  }, [valvulaId]);

  if (cargando) return <p>Cargando detalles...</p>;
  if (!valvula) return <p>No se encontró la válvula.</p>;

  return (
    <div className="vista-detalle">
      <button onClick={onVolver} className="volver-btn">← Volver a la lista</button>
      
      <h2>{valvula.codigo_interno}</h2>
      
      <div className="detalle-grid">
        {/* Sección de Fotos */}
        <div className="detalle-fotos">
          <h3>Fotos</h3>
          {valvula.fotos.map(foto => (
            <img key={foto.id} src={foto.imagen} alt="Foto de válvula" />
          ))}
        </div>

        {/* Sección de Datos Técnicos */}
        <div className="detalle-specs">
          <h3>Especificaciones Técnicas</h3>
          <ul>
            <li><strong>Tipo:</strong> {valvula.tipo}</li>
            <li><strong>Stock:</strong> {valvula.stock}</li>
            <li><strong>Precio Venta:</strong> ${valvula.precio_venta}</li>
            <li><strong>Cabeza:</strong> {valvula.diametro_cabeza} mm</li>
            <li><strong>Vástago:</strong> {valvula.diametro_vastago} mm</li>
            <li><strong>Longitud:</strong> {valvula.longitud_total} mm</li>
            <li><strong>Ranuras:</strong> {valvula.ranuras}</li>
          </ul>
        </div>

        {/* Sección de Referencias */}
        <div className="detalle-relacionados">
          <h3>Números de Parte (Referencias)</h3>
          <ul>
            {valvula.numeros_de_parte.map(part => (
              <li key={part.id}>{part.marca}: {part.numero_de_parte}</li>
            ))}
          </ul>
        </div>

        {/* Sección de Aplicaciones */}
        <div className="detalle-relacionados">
          <h3>Aplicaciones en Vehículos</h3>
          <ul>
            {valvula.aplicaciones.map(app => (
              <li key={app.id}>{app.marca_vehiculo_nombre} {app.modelo_vehiculo}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default VistaDetalle;
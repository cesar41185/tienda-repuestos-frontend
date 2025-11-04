// En src/components/VistaDetalle.jsx
import { useState, useEffect } from 'react';
import API_URL from '../apiConfig';

// Recibe el ID de la válvula a mostrar y una función para volver a la lista
function VistaDetalle({ valvulaId, onVolver }) {
  const [valvula, setValvula] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [fotoActual, setFotoActual] = useState(0);

  useEffect(() => {
    const fetchDetalleValvula = async () => {
      setCargando(true);
      try {
        const response = await fetch(`${API_URL}/productos/${valvulaId}/`);
        const data = await response.json();
        setValvula(data);
        // Iniciar en la foto principal si existe
        if (data.fotos && data.fotos.length > 0) {
          const principalIndex = data.fotos.findIndex(f => f.es_principal);
          setFotoActual(principalIndex >= 0 ? principalIndex : 0);
        }
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
          <h3>Fotos {valvula.fotos.length > 0 && `(${fotoActual + 1} de ${valvula.fotos.length})`}</h3>
          {valvula.fotos.length > 0 ? (
            <>
              <div style={{position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto'}}>
                <img 
                  key={valvula.fotos[fotoActual].id}
                  src={valvula.fotos[fotoActual].imagen} 
                  alt={`Foto ${fotoActual + 1} de ${valvula.fotos.length}`}
                  style={{width: '100%', height: 'auto', borderRadius: '8px'}}
                />
                {valvula.fotos.length > 1 && (
                  <>
                    <button
                      onClick={() => setFotoActual((prev) => (prev > 0 ? prev - 1 : valvula.fotos.length - 1))}
                      style={{
                        position: 'absolute',
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        fontSize: '20px',
                        cursor: 'pointer',
                        zIndex: 10
                      }}
                      title="Foto anterior"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setFotoActual((prev) => (prev < valvula.fotos.length - 1 ? prev + 1 : 0))}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        fontSize: '20px',
                        cursor: 'pointer',
                        zIndex: 10
                      }}
                      title="Foto siguiente"
                    >
                      →
                    </button>
                  </>
                )}
              </div>
              {valvula.fotos.length > 1 && (
                <div style={{display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap'}}>
                  {valvula.fotos.map((foto, index) => (
                    <button
                      key={foto.id}
                      onClick={() => setFotoActual(index)}
                      style={{
                        width: '60px',
                        height: '60px',
                        border: fotoActual === index ? '3px solid #2196F3' : '1px solid #ccc',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        padding: '2px',
                        background: 'white'
                      }}
                    >
                      <img 
                        src={foto.imagen} 
                        alt={`Miniatura ${index + 1}`}
                        style={{width: '100%', height: '100%', objectFit: 'cover'}}
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p>No hay fotos disponibles</p>
          )}
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
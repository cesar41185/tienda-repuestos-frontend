import { useState } from 'react';
import toast from 'react-hot-toast';
import API_URL from '../apiConfig';

function ModalBajoStock({ isOpen, onClose, tiposProductos, token, onGenerarPDF }) {
  if (!isOpen) return null;

  // Iconos para cada tipo de producto
  const iconosPorTipo = {
    'VALVULA': '🔧',
    'FILTRO': '🔍',
    'BUJIA': '⚡',
    'CABLE': '🔌',
    'OTRO': '📦'
  };

  const handleClickTipo = async (tipoCodigo) => {
    if (onGenerarPDF) {
      await onGenerarPDF(tipoCodigo);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Productos Bajo Stock por Tipo</h2>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '24px', 
              cursor: 'pointer',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          {Object.keys(tiposProductos).length === 0 ? (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6c757d', padding: '2rem' }}>
              No hay productos bajo stock en este momento.
            </p>
          ) : (
            Object.entries(tiposProductos).map(([tipoCodigo, data]) => (
              <div
                key={tipoCodigo}
                onClick={() => handleClickTipo(tipoCodigo)}
                style={{
                  border: '2px solid #ac1b1b',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f8f8';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                  {iconosPorTipo[tipoCodigo] || '📦'}
                </div>
                <h3 style={{ margin: '0.5rem 0', color: '#333', fontSize: '1.1rem' }}>
                  {data.nombre}
                </h3>
                <p style={{ 
                  margin: '0', 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: '#ac1b1b' 
                }}>
                  {data.cantidad}
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                  productos
                </p>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button 
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalBajoStock;





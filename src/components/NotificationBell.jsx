import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../apiConfig';

function NotificationBell() {
  const { token, user } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const panelRef = useRef(null);
  const cargandoRef = useRef(false);

  // Cargar notificaciones
  const fetchNotificaciones = async () => {
    if (!token || cargandoRef.current) return;
    
    try {
      cargandoRef.current = true;
      const response = await fetch(`${API_URL}/notificaciones/?ordering=-fecha_creacion&limit=20`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotificaciones(data.results || data);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      cargandoRef.current = false;
    }
  };

  // Contar no leídas
  const fetchContarNoLeidas = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/notificaciones/contar_no_leidas/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNoLeidas(data.count || 0);
      }
    } catch (error) {
      console.error('Error al contar no leídas:', error);
    }
  };

  // Marcar como leída
  const marcarLeida = async (id) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/notificaciones/${id}/marcar_leida/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (response.ok) {
        // Actualizar estado local
        setNotificaciones(prev => 
          prev.map(n => n.id === id ? { ...n, leida: true } : n)
        );
        setNoLeidas(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  // Marcar todas como leídas
  const marcarTodasLeidas = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/notificaciones/marcar_todas_leidas/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (response.ok) {
        setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
        setNoLeidas(0);
      }
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  // Icono según tipo
  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'BAJO_STOCK':
        return '⚠️';
      case 'VENTA_PENDIENTE':
      case 'COMPROBANTE_PENDIENTE':
        return '📋';
      case 'PEDIDO_ASIGNADO':
        return '📦';
      case 'PEDIDO_LISTO':
        return '✅';
      default:
        return '🔔';
    }
  };

  // Cargar datos iniciales y configurar polling
  useEffect(() => {
    if (token && user) {
      fetchNotificaciones();
      fetchContarNoLeidas();
      
      // Polling cada 30 segundos
      const interval = setInterval(() => {
        fetchNotificaciones();
        fetchContarNoLeidas();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [token, user]);

  // Cerrar panel al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setMostrarPanel(false);
      }
    };

    if (mostrarPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarPanel]);

  // No mostrar si no está autenticado
  if (!token || !user) {
    return null;
  }

  return (
    <div className="notification-bell-container" ref={panelRef}>
      <button 
        className="notification-bell-btn"
        onClick={() => setMostrarPanel(!mostrarPanel)}
        aria-label="Notificaciones"
      >
        🔔
        {noLeidas > 0 && (
          <span className="notification-badge">{noLeidas > 9 ? '9+' : noLeidas}</span>
        )}
      </button>

      {mostrarPanel && (
        <div className="notification-panel">
          <div className="notification-panel-header">
            <h3>Notificaciones</h3>
            {noLeidas > 0 && (
              <button 
                onClick={marcarTodasLeidas}
                className="notification-marcar-todas-btn"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="notification-list">
            {notificaciones.length === 0 ? (
              <div className="notification-empty">
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              notificaciones.map(notif => (
                <div 
                  key={notif.id} 
                  className={`notification-item ${notif.leida ? '' : 'unread'}`}
                  onClick={() => !notif.leida && marcarLeida(notif.id)}
                >
                  <div className="notification-icon">
                    {getIconoTipo(notif.tipo)}
                  </div>
                  <div className="notification-content">
                    <h4>{notif.titulo}</h4>
                    <p>{notif.mensaje}</p>
                    <span className="notification-date">
                      {new Date(notif.fecha_creacion).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;

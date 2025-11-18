import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../apiConfig';
import toast from 'react-hot-toast';

function UsuariosConectadosPage() {
  const { token, user } = useAuth();
  const [online, setOnline] = useState({ count: 0, results: [] });
  const [logins, setLogins] = useState({ count: 0, results: [] });
  const [loading, setLoading] = useState(true);

  const initials = (nombre, username) => {
    const source = nombre || username || '';
    const parts = source.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const fetchData = async () => {
    if (!token) return;
    try {
      const [oRes, lRes] = await Promise.all([
        fetch(`${API_URL}/admin-online/online-users/`, { headers: { Authorization: `Token ${token}` } }),
        fetch(`${API_URL}/admin-online/recent-logins?days=7&limit=200`, { headers: { Authorization: `Token ${token}` } })
      ]);
      if (!oRes.ok || !lRes.ok) throw new Error('Error de permisos o red');
      const o = await oRes.json();
      const l = await lRes.json();
      setOnline(o);
      setLogins(l);
    } catch (e) {
      toast.error('No se pudo cargar el monitoreo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 10000);
    return () => clearInterval(id);
  }, [token]);

  if (loading) return <p>Cargando monitoreo...</p>;

  return (
    <div className="gestor-container uc-container">
      <div className="uc-header">
        <h2>Usuarios Conectados</h2>
        <div className="uc-meta">
          <span className="uc-count">Online (últimos 5 minutos): <strong>{online.count}</strong></span>
        </div>
      </div>

      <div className="tabla-wrapper">
        <table className="uc-table vehiculos-table" style={{ marginBottom: '1.5rem' }}>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Última Actividad</th>
              <th>IP</th>
              <th>User-Agent</th>
            </tr>
          </thead>
          <tbody>
            {online.results.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="uc-user">
                    <span className="uc-avatar">{initials(u.nombre_completo, u.username)}</span>
                    <div className="uc-user-meta">
                      <div className="uc-username">{u.username}</div>
                      <div className="uc-name">{u.nombre_completo}</div>
                    </div>
                  </div>
                </td>
                <td className="uc-only-name">{u.nombre_completo}</td>
                <td>{new Date(u.last_seen).toLocaleString()}</td>
                <td>{u.last_ip}</td>
                <td className="uc-agent-cell" title={u.last_user_agent}>{u.last_user_agent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Historial Reciente (7 días)</h3>
      <div className="tabla-wrapper">
        <table className="uc-table vehiculos-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Acción</th>
              <th>IP</th>
              <th>User-Agent</th>
            </tr>
          </thead>
          <tbody>
            {logins.results.map((r, idx) => (
              <tr key={idx}>
                <td>{new Date(r.timestamp).toLocaleString()}</td>
                <td>{r.username}</td>
                <td>{r.action}</td>
                <td>{r.ip}</td>
                <td className="uc-agent-cell" title={r.user_agent}>{r.user_agent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UsuariosConectadosPage;

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../apiConfig';
import toast from 'react-hot-toast';
import ActionIcon from '../components/icons/ActionIcon';

function UsuariosConectadosPage() {
  const { token, user } = useAuth();
  const [online, setOnline] = useState({ count: 0, results: [] });
  const [logins, setLogins] = useState({ count: 0, results: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [lastRefresh, setLastRefresh] = useState(null);

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
      setLastRefresh(new Date());
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

  const filteredLogins = useMemo(() => {
    return logins.results.filter(r => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (r.username || '').toLowerCase().includes(s)
        || (r.action || '').toLowerCase().includes(s)
        || (r.ip || '').toLowerCase().includes(s)
        || (r.user_agent || '').toLowerCase().includes(s);
    });
  }, [logins.results, search]);

  const pageCount = Math.max(1, Math.ceil(filteredLogins.length / pageSize));
  const pageSafe = Math.min(pageCount, Math.max(1, page));
  const pageItems = filteredLogins.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  if (loading) return <p>Cargando monitoreo...</p>;

  return (
    <div className="gestor-container uc-container" aria-labelledby="uc-title">
      <div className="uc-hero">
        <div className="uc-hero-content">
          <h1 id="uc-title">👥 Monitoreo de Usuarios</h1>
          <p className="uc-hero-subtitle">Panel de control en tiempo real</p>
        </div>
        {lastRefresh && (
          <div className="uc-refresh-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            <span>Actualizado: {lastRefresh.toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {/* Stat cards mejoradas */}
      <div className="uc-stats-grid">
        <div className="uc-stat-card uc-stat-online">
          <div className="uc-stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
            </svg>
          </div>
          <div className="uc-stat-content">
            <div className="uc-stat-value">{online.count}</div>
            <div className="uc-stat-label">Usuarios Online</div>
            <div className="uc-stat-sublabel">Activos últimos 5 min</div>
          </div>
        </div>
        <div className="uc-stat-card uc-stat-events">
          <div className="uc-stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>
          <div className="uc-stat-content">
            <div className="uc-stat-value">{logins.count}</div>
            <div className="uc-stat-label">Eventos Totales</div>
            <div className="uc-stat-sublabel">Últimos 7 días</div>
          </div>
        </div>
        <div className="uc-stat-card uc-stat-summary">
          <div className="uc-stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <div className="uc-stat-content">
            <div className="uc-stat-value">{new Set(logins.results.map(r=>r.username)).size}</div>
            <div className="uc-stat-label">Usuarios Únicos</div>
            <div className="uc-stat-sublabel">Con actividad reciente</div>
          </div>
        </div>
      </div>

      <div className="uc-section">
        <div className="uc-section-header">
          <h2>🟢 Conectados Ahora</h2>
          <span className="uc-count-badge">{online.count} {online.count === 1 ? 'usuario' : 'usuarios'}</span>
        </div>
        <div className="tabla-wrapper" aria-label="Usuarios actualmente conectados">
        <table className="uc-table vehiculos-table">
          <thead>
            <tr>
              <th scope="col">Usuario</th>
              <th scope="col">Última Actividad</th>
              <th scope="col">IP</th>
              <th scope="col">User-Agent</th>
            </tr>
          </thead>
          <tbody>
            {online.results.length === 0 && (
              <tr><td colSpan={4} style={{textAlign:'center',color:'#64748b'}}>No hay usuarios conectados.</td></tr>
            )}
            {online.results.map(u => (
              <tr key={u.id}>
                <td className="col-user">
                  <div className="uc-user">
                    <span className="uc-avatar" title={u.nombre_completo}>{initials(u.nombre_completo, u.username)}</span>
                    <div className="uc-user-meta">
                      <div className="uc-username">{u.username}</div>
                      <div className="uc-name" title={u.nombre_completo}>{u.nombre_completo}</div>
                    </div>
                  </div>
                </td>
                <td className="col-time">{new Date(u.last_seen).toLocaleString()}</td>
                <td className="col-ip">{u.last_ip}</td>
                <td className="col-agent uc-agent-cell" title={u.last_user_agent}>{u.last_user_agent}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className="uc-section" style={{marginTop:'2rem'}}>
        <div className="uc-section-header">
          <h2>📋 Historial de Accesos</h2>
          <span className="uc-count-badge">{filteredLogins.length} registros</span>
        </div>
        <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',marginBottom:'0.75rem'}}>
          <div className="uc-search-wrapper">
            <svg className="uc-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className="uc-search-input"
              placeholder="Buscar usuario, IP o navegador..."
              aria-label="Buscar en historial"
              value={search}
              onChange={e=>{setSearch(e.target.value); setPage(1);}}
            />
          </div>
        </div>
        <div className="tabla-wrapper" aria-label="Historial de accesos">
        <table className="uc-table vehiculos-table">
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Usuario</th>
              <th scope="col">Acción</th>
              <th scope="col">IP</th>
              <th scope="col">User-Agent</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 && (
              <tr><td colSpan={5} style={{textAlign:'center',color:'#64748b'}}>Sin coincidencias.</td></tr>
            )}
            {pageItems.map((r, idx) => (
              <tr key={idx}>
                <td className="col-time">{new Date(r.timestamp).toLocaleString()}</td>
                <td className="col-user">{r.username}</td>
                <td className="col-action">
                  <div className="uc-action-wrapper">
                    <ActionIcon type={r.action} />
                    <span className={`uc-badge ${r.action.toLowerCase()}`}>{r.action === 'LOGIN' ? 'Ingreso' : 'Salida'}</span>
                  </div>
                </td>
                <td className="col-ip">{r.ip}</td>
                <td className="col-agent uc-agent-cell" title={r.user_agent}>{r.user_agent}</td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
        <div className="uc-pagination" style={{marginTop:12}}>
          <button className="uc-page-btn" aria-label="Página anterior" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={pageSafe===1}>Prev</button>
          {Array.from({length:pageCount}).slice(0,10).map((_,i)=>{
            const p = i+1;
            return <button key={p} aria-label={`Ir a página ${p}`} className={`uc-page-btn ${p===pageSafe? 'active':''}`} onClick={()=>setPage(p)}>{p}</button>
          })}
          {pageCount>10 && <span style={{paddingLeft:8,color:'#6b7280'}}>... {pageCount} páginas</span>}
          <button className="uc-page-btn" aria-label="Página siguiente" onClick={()=>setPage(p=>Math.min(pageCount,p+1))} disabled={pageSafe===pageCount}>Next</button>
        </div>
      </div>
    </div>
  );
}

export default UsuariosConectadosPage;

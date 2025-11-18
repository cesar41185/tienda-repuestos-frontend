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
      <div className="uc-header">
        <h2 id="uc-title">Usuarios Conectados</h2>
        <div className="uc-meta">
          <span className="uc-count" aria-live="polite">Online (últimos 5 minutos): <strong>{online.count}</strong></span>
          {lastRefresh && <span className="uc-refresh">Actualizado: {lastRefresh.toLocaleTimeString()}</span>}
        </div>
      </div>

      {/* Stat cards */}
      <div className="uc-stats-row" style={{marginBottom:'1rem'}}>
        <div className="uc-stat-card">
          <div className="uc-stat-value" aria-label="Usuarios en línea">{online.count}</div>
          <div className="uc-stat-label">ONLINE</div>
        </div>
        <div className="uc-stat-card">
          <div className="uc-stat-value" aria-label="Eventos total">{logins.count}</div>
          <div className="uc-stat-label">EVENTOS</div>
        </div>
        <div className="uc-stat-card">
          <div className="uc-stat-value" style={{fontSize:'0.9rem'}}>{lastRefresh ? lastRefresh.toLocaleTimeString() : '--'}</div>
          <div className="uc-stat-label">REFRESCO</div>
        </div>
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

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',margin:'1rem 0 0.5rem'}}>
        <h3 style={{margin:0,fontSize:'1rem',color:'var(--muted-700)'}}>Historial (7 días)</h3>
        <input
          type="text"
          className="uc-search-input"
          placeholder="Buscar usuario / IP / agente"
          aria-label="Buscar en historial"
          value={search}
          onChange={e=>{setSearch(e.target.value); setPage(1);}}
          style={{minWidth:'240px'}}
        />
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
                  <ActionIcon type={r.action} />{' '}
                  <span className={`uc-badge ${r.action.toLowerCase()}`}>{r.action}</span>
                </td>
                <td className="col-ip">{r.ip}</td>
                <td className="col-agent uc-agent-cell" title={r.user_agent}>{r.user_agent}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="uc-pagination" style={{marginTop:8}}>
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

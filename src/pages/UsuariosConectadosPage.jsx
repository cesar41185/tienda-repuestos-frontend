import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../apiConfig';
import toast from 'react-hot-toast';

function UsuariosConectadosPage() {
  const { token, user } = useAuth();
  const [online, setOnline] = useState({ count: 0, results: [] });
  const [logins, setLogins] = useState({ count: 0, results: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

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

  // Derived values for history filtering & pagination
  const filteredLogins = logins.results.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (r.username || '').toLowerCase().includes(s)
      || (r.action || '').toLowerCase().includes(s)
      || (r.ip || '').toLowerCase().includes(s)
      || (r.user_agent || '').toLowerCase().includes(s);
  });

  const pageCount = Math.max(1, Math.ceil(filteredLogins.length / pageSize));
  const pageSafe = Math.min(Math.max(1, page), pageCount);
  const pageItems = filteredLogins.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

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
                <td className="col-user">
                  <div className="uc-user">
                    <span className="uc-avatar">{initials(u.nombre_completo, u.username)}</span>
                    <div className="uc-user-meta">
                      <div className="uc-username">{u.username}</div>
                      <div className="uc-name">{u.nombre_completo}</div>
                    </div>
                  </div>
                </td>
                <td className="col-name">{u.nombre_completo}</td>
                <td className="col-time">{new Date(u.last_seen).toLocaleString()}</td>
                <td className="col-ip">{u.last_ip}</td>
                <td className="col-agent uc-agent-cell" title={u.last_user_agent}>{u.last_user_agent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="uc-search-row">
        <div style={{flex:1}}>
          <h3 style={{margin:'0 0 0.5rem 0'}}>Historial Reciente (7 días)</h3>
          <input className="uc-search-input" placeholder="Buscar por usuario, acción, IP o user-agent" value={search} onChange={e=>{setSearch(e.target.value); setPage(1)}} />
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <label style={{fontSize:12,color:'#6b7280'}}>Por página</label>
          <select value={pageSize} onChange={e=>{setPageSize(parseInt(e.target.value,10)); setPage(1)}} style={{padding:'0.35rem',borderRadius:6}}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

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
            {pageItems.map((r, idx) => (
              <tr key={idx}>
                <td className="col-time">{new Date(r.timestamp).toLocaleString()}</td>
                <td className="col-user">{r.username}</td>
                <td className="col-action">
                  {r.action === 'LOGIN' ? (
                    <svg className="uc-action-svg login" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false" title="Login">
                      <path d="M5 12h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" />
                      <path d="M13 6l6 6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" />
                    </svg>
                  ) : (
                    <svg className="uc-action-svg logout" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false" title="Logout">
                      <path d="M19 12H5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" />
                      <path d="M11 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor" />
                    </svg>
                  )}
                </td>
                <td className="col-ip">{r.ip}</td>
                <td className="col-agent uc-agent-cell" title={r.user_agent}>{r.user_agent}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="uc-pagination" style={{marginTop:8}}>
          <button className="uc-page-btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={pageSafe===1}>Prev</button>
          {Array.from({length:pageCount}).slice(0,10).map((_,i)=>{
            const p = i+1;
            return <button key={p} className={`uc-page-btn ${p===pageSafe? 'active':''}`} onClick={()=>setPage(p)}>{p}</button>
          })}
          {pageCount>10 && <span style={{paddingLeft:8,color:'#6b7280'}}>... {pageCount} páginas</span>}
          <button className="uc-page-btn" onClick={()=>setPage(p=>Math.min(pageCount,p+1))} disabled={pageSafe===pageCount}>Next</button>
        </div>
      </div>
    </div>
  );
}

export default UsuariosConectadosPage;

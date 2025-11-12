import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import API_URL from '../apiConfig';

function GestorAplicacionesPage() {
  const [vehiculos, setVehiculos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroMarcaId, setFiltroMarcaId] = useState('');
  const [filtroModelo, setFiltroModelo] = useState('');

  // Estado de edición
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    marca: '',
    modelo: '',
    cilindrada: '',
    cilindros: '',
    detalle_motor: '',
    ano_desde: '',
    ano_hasta: ''
  });

  const fetchMarcas = async () => {
    try {
      const res = await fetch(API_URL + '/marcas/');
      const data = await res.json();
      setMarcas(data.results || data);
    } catch (e) {
      toast.error('No se pudieron cargar las marcas');
    }
  };

  const fetchAplicaciones = async () => {
    setCargando(true);
    try {
      let url = API_URL + '/vehiculos/';
      const acumulado = [];
      // Seguir paginación si existe (DRF PageNumberPagination)
      while (url) {
        // Forzar un page_size grande si el backend lo soporta, sino DRF ignorará y seguiremos con next
        const conTamano = url.includes('page_size=') ? url : (url.includes('?') ? url + '&page_size=1000' : url + '?page_size=1000');
        const res = await fetch(conTamano);
        const data = await res.json();
        if (Array.isArray(data)) {
          acumulado.push(...data);
          url = null;
        } else {
          acumulado.push(...(data.results || []));
          url = data.next || null;
        }
      }
      setVehiculos(acumulado);
    } catch (e) {
      toast.error('No se pudieron cargar los vehículos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchMarcas();
    fetchAplicaciones();
  }, []);

  const vehiculosFiltrados = useMemo(() => {
    return vehiculos.filter((v) => {
      const selectedMarcaNombre = filtroMarcaId
        ? (marcas.find((m) => String(m.id) === String(filtroMarcaId))?.nombre || '')
        : '';
      const okMarca = !filtroMarcaId || (v.marca || '') === selectedMarcaNombre;
      const okModelo = !filtroModelo || (v.modelo || '').toLowerCase().includes(filtroModelo.toLowerCase());
      return okMarca && okModelo;
    });
  }, [vehiculos, filtroMarcaId, filtroModelo, marcas]);

  const startEdit = (v) => {
    setEditId(v.id);
    // mapear ID desde el nombre
    const marcaIdFromNombre = marcas.find((m) => m.nombre === v.marca)?.id || '';
    setForm({
      marca: marcaIdFromNombre,
      modelo: v.modelo || '',
      cilindrada: v.cilindrada ?? '',
      cilindros: v.cilindros ?? '',
      detalle_motor: v.detalle_motor || '',
      ano_desde: v.ano_desde ?? '',
      ano_hasta: v.ano_hasta ?? ''
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({
      marca: '', modelo: '', cilindrada: '', cilindros: '',
      detalle_motor: '', ano_desde: '', ano_hasta: ''
    });
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const saveEdit = async () => {
    if (!editId) return;
    if (!form.marca) {
      toast.error('Seleccione una marca');
      return;
    }
    if (!form.modelo.trim()) {
      toast.error('Ingrese el modelo');
      return;
    }

    const payload = {
      marca: marcas.find(m => String(m.id) === String(form.marca))?.nombre || '',
      modelo: form.modelo.trim(),
      cilindrada: form.cilindrada !== '' ? Number(form.cilindrada) : null,
      cilindros: form.cilindros !== '' ? Number(form.cilindros) : null,
      detalle_motor: form.detalle_motor.trim(),
      ano_desde: form.ano_desde !== '' ? Number(form.ano_desde) : null,
      ano_hasta: form.ano_hasta !== '' ? Number(form.ano_hasta) : null,
    };

    try {
      const resp = await fetch(`${API_URL}/vehiculos/${editId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.detail || 'No OK');
      }
      toast.success('Vehículo actualizado');
      cancelEdit();
      fetchAplicaciones();
    } catch (e) {
      toast.error('No se pudo actualizar el vehículo');
    }
  };

  if (cargando) return <p>Cargando vehículos...</p>;

  return (
    <div className="gestor-aplicaciones">
      <div className="gestor-header">
        <div className="header-content">
          <h1>🚗 Gestor de Vehículos</h1>
          <p className="header-subtitle">Administra la base de datos de vehículos compatibles</p>
        </div>
        <div className="stats-summary">
          <div className="stat-card">
            <span className="stat-number">{vehiculosFiltrados.length}</span>
            <span className="stat-label">Vehículos {filtroMarcaId || filtroModelo ? 'filtrados' : 'totales'}</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filtros-section">
        <div className="filtros-header">
          <h3>🔍 Filtros de Búsqueda</h3>
        </div>
        <div className="filtros-controls">
          <div className="filtro-group">
            <label>Marca</label>
            <select value={filtroMarcaId} onChange={(e) => setFiltroMarcaId(e.target.value)} className="filtro-select">
              <option value="">🏷️ Todas las marcas</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
          <div className="filtro-group">
            <label>Modelo</label>
            <input
              type="text"
              placeholder="🔍 Buscar por modelo"
              value={filtroModelo}
              onChange={(e) => setFiltroModelo(e.target.value)}
              className="filtro-input"
            />
          </div>
          {(filtroMarcaId || filtroModelo) && (
            <button 
              onClick={() => { setFiltroMarcaId(''); setFiltroModelo(''); }} 
              className="clear-filters-btn"
              title="Limpiar filtros"
            >
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      {editId && (
        <div className="editor-section">
          <div className="editor-card">
            <div className="editor-header">
              <h3>✏️ Editando Vehículo #{editId}</h3>
              <button onClick={cancelEdit} className="close-editor-btn" title="Cerrar editor">✕</button>
            </div>
            
            <div className="editor-form">
              <div className="form-section">
                <h4>📋 Información Básica</h4>
                <div className="form-grid basic">
                  <div className="form-group">
                    <label>🏷️ Marca *</label>
                    <select name="marca" value={form.marca} onChange={onChange} className="form-control" required>
                      <option value="">Seleccionar marca</option>
                      {marcas.map((m) => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>🚗 Modelo *</label>
                    <input 
                      name="modelo" 
                      value={form.modelo} 
                      onChange={onChange} 
                      className="form-control"
                      placeholder="Ej: Corolla, Focus"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>⚙️ Especificaciones Técnicas</h4>
                <div className="form-grid specs">
                  <div className="form-group">
                    <label>🔧 Cilindrada (L)</label>
                    <input 
                      name="cilindrada" 
                      value={form.cilindrada} 
                      onChange={onChange} 
                      className="form-control"
                      placeholder="1.6"
                      type="number"
                      step="0.1"
                    />
                  </div>
                  <div className="form-group">
                    <label>⚡ N° Cilindros</label>
                    <input 
                      name="cilindros" 
                      value={form.cilindros} 
                      onChange={onChange} 
                      className="form-control"
                      placeholder="4"
                      type="number"
                    />
                  </div>
                  <div className="form-group">
                    <label>🏭 Detalle Motor</label>
                    <input 
                      name="detalle_motor" 
                      value={form.detalle_motor} 
                      onChange={onChange} 
                      className="form-control"
                      placeholder="Ej: Zetec, DOHC"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>📅 Años de Producción</h4>
                <div className="form-grid years">
                  <div className="form-group">
                    <label>📅 Año Desde</label>
                    <input 
                      name="ano_desde" 
                      value={form.ano_desde} 
                      onChange={onChange} 
                      className="form-control"
                      placeholder="2005"
                      type="number"
                      min="1900"
                      max="2030"
                    />
                  </div>
                  <div className="form-group">
                    <label>📅 Año Hasta</label>
                    <input 
                      name="ano_hasta" 
                      value={form.ano_hasta} 
                      onChange={onChange} 
                      className="form-control"
                      placeholder="2012"
                      type="number"
                      min="1900"
                      max="2030"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="editor-actions">
              <button onClick={saveEdit} className="btn-save">
                💾 Guardar Cambios
              </button>
              <button onClick={cancelEdit} className="btn-cancel">
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de vehículos */}
      <div className="vehiculos-section">
        <div className="vehiculos-header">
          <h3>📋 Lista de Vehículos</h3>
          {vehiculosFiltrados.length === 0 && (
            <div className="empty-state">
              <p>No se encontraron vehículos</p>
              <small>Ajusta los filtros para ver resultados</small>
            </div>
          )}
        </div>

        {vehiculosFiltrados.length > 0 && (
          <>
            {/* Vista de tabla para desktop */}
            <div className="tabla-desktop">
              <div className="tabla-wrapper">
                <table className="vehiculos-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>🏷️ Marca</th>
                      <th>🚗 Modelo</th>
                      <th>🔧 Cilindrada</th>
                      <th>⚡ Cilindros</th>
                      <th>🏭 Motor</th>
                      <th>📅 Años</th>
                      <th>🛠️ Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehiculosFiltrados.map((v) => (
                      <tr key={v.id} className={editId === v.id ? 'editing' : ''}>
                        <td className="id-cell">#{v.id}</td>
                        <td className="marca-cell">{v.marca || '—'}</td>
                        <td className="modelo-cell">{v.modelo}</td>
                        <td className="spec-cell">{v.cilindrada ? `${v.cilindrada}L` : '—'}</td>
                        <td className="spec-cell">{v.cilindros || '—'}</td>
                        <td className="motor-cell">{v.detalle_motor || '—'}</td>
                        <td className="anos-cell">
                          {v.anos || 
                            (v.ano_desde && v.ano_hasta ? `${v.ano_desde}-${v.ano_hasta}` : 
                             v.ano_desde ? `${v.ano_desde}+` : 
                             v.ano_hasta ? `hasta ${v.ano_hasta}` : '—')}
                        </td>
                        <td className="actions-cell">
                          <button 
                            onClick={() => startEdit(v)} 
                            className="btn-edit-table"
                            disabled={editId && editId !== v.id}
                          >
                            ✏️ Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vista de cards para móvil */}
            <div className="cards-mobile">
              {vehiculosFiltrados.map((v) => (
                <div key={v.id} className={`vehiculo-card ${editId === v.id ? 'editing' : ''}`}>
                  <div className="card-header">
                    <div className="card-title">
                      <h4>{v.marca} {v.modelo}</h4>
                      <span className="card-id">#{v.id}</span>
                    </div>
                    <button 
                      onClick={() => startEdit(v)} 
                      className="btn-edit-card"
                      disabled={editId && editId !== v.id}
                    >
                      ✏️
                    </button>
                  </div>
                  
                  <div className="card-specs">
                    {v.cilindrada && <span className="spec-chip">🔧 {v.cilindrada}L</span>}
                    {v.cilindros && <span className="spec-chip">⚡ {v.cilindros} cil.</span>}
                    {v.detalle_motor && <span className="spec-chip">🏭 {v.detalle_motor}</span>}
                  </div>
                  
                  {(v.anos || v.ano_desde || v.ano_hasta) && (
                    <div className="card-years">
                      📅 {v.anos || 
                          (v.ano_desde && v.ano_hasta ? `${v.ano_desde}-${v.ano_hasta}` : 
                           v.ano_desde ? `${v.ano_desde}+` : 
                           v.ano_hasta ? `hasta ${v.ano_hasta}` : '')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="gestor-footer">
        <div className="tip-section">
          <h4>💡 Consejos</h4>
          <ul>
            <li>Usa los filtros para encontrar vehículos específicos</li>
            <li>Los campos con * son obligatorios</li>
            <li>Mantén la consistencia en nombres de marcas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default GestorAplicacionesPage;

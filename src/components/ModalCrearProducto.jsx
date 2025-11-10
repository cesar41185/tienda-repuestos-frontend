import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import API_URL from '../apiConfig';
import { useAuth } from '../context/AuthContext';

const CAMPOS_VALVULA = [
  { name: 'tipo', label: 'Tipo', type: 'select', options: [
    { value: '', label: '-- Seleccione --' },
    { value: 'INTAKE', label: 'Admisión' },
    { value: 'EXHAUST', label: 'Escape' }
  ]},
  { name: 'diametro_cabeza', label: 'Cabeza (mm)', type: 'number' },
  { name: 'diametro_vastago', label: 'Vástago (mm)', type: 'number' },
  { name: 'longitud_total', label: 'Longitud (mm)', type: 'number' },
  { name: 'ranuras', label: 'Ranuras', type: 'number' },
];

const CAMPOS_GUIA_VALVULA = [
  { name: 'diametro_exterior', label: 'Diámetro exterior (mm)', type: 'number' },
  { name: 'diametro_interior', label: 'Diámetro interior (mm)', type: 'number' },
  { name: 'longitud_total', label: 'Longitud (mm)', type: 'number' },
];

export default function ModalCrearProducto({ abierto, onClose, onCreated }) {
  const modalRef = useRef(null);
  const { token } = useAuth();

  const [tipoProducto, setTipoProducto] = useState('VALVULA');
  const [codigoInterno, setCodigoInterno] = useState('');
  const [stock, setStock] = useState('0');
  const [precioCosto, setPrecioCosto] = useState('0');
  const [precioVenta, setPrecioVenta] = useState('0');
  const [observaciones, setObservaciones] = useState('');

  // Especificaciones (para válvulas)
  const [esp, setEsp] = useState({ tipo: '', diametro_cabeza: '', diametro_vastago: '', longitud_total: '', ranuras: '', diametro_exterior: '', diametro_interior: '' });

  // Marcas
  const [marcas, setMarcas] = useState([]);
  const [marcaId, setMarcaId] = useState('');

  // Aplicaciones (se cargan filtradas desde el backend por marca + búsqueda)
  const [aplicacionesRepo, setAplicacionesRepo] = useState([]);
  const [filtroAppModelo, setFiltroAppModelo] = useState('');
  const [aplicacionSeleccionada, setAplicacionSeleccionada] = useState(null);
  const [loadingApps, setLoadingApps] = useState(false);

  // Válvulas compatibles (solo para GUIA_VALVULA)
  const [valvulasRepo, setValvulasRepo] = useState([]);
  const [filtroValvula, setFiltroValvula] = useState('');
  const [loadingValvulas, setLoadingValvulas] = useState(false);
  const [valvulasSeleccionadas, setValvulasSeleccionadas] = useState([]);
  const [restringirValvulasPorMarca, setRestringirValvulasPorMarca] = useState(true);
  const [filtroNumeroParte, setFiltroNumeroParte] = useState('');

  // Números de parte (opcional)
  const [partes, setPartes] = useState([{ marca: 'OEM', numero: '' }]);

  // Imagen
  const [imagen, setImagen] = useState(null);

  useEffect(() => {
    if (!abierto) return;
    fetch(API_URL + '/marcas/')
      .then(r => r.json())
      .then(d => setMarcas(d.results || d))
      .catch(() => {});

    // Ya no cargamos TODAS las aplicaciones al abrir; se cargan según marca/búsqueda.
  }, [abierto]);

  // Reset selección y búsqueda al cambiar de marca (evita mezclar resultados de otra marca)
  useEffect(() => {
    setAplicacionSeleccionada(null);
    setFiltroAppModelo('');
    setAplicacionesRepo([]);
    // Para guías, también reseteamos válvulas listadas (no las seleccionadas)
    setValvulasRepo([]);
    setFiltroValvula('');
  }, [marcaId]);

  // Cargar aplicaciones filtradas (debounce por búsqueda de modelo)
  useEffect(() => {
    if (!abierto) return;
    if (!marcaId) { setAplicacionesRepo([]); return; }

    const controlador = new AbortController();
    const timer = setTimeout(async () => {
      setLoadingApps(true);
      try {
        // Construimos la URL de filtrado (backend ahora soporta marca_vehiculo y search)
        let baseUrl = `${API_URL}/aplicaciones/?marca_vehiculo=${encodeURIComponent(marcaId)}`;
        if (filtroAppModelo.trim()) {
          baseUrl += `&search=${encodeURIComponent(filtroAppModelo.trim())}`;
        }
        // Page size relativamente pequeño para evitar sobrecarga (se puede ajustar)
        baseUrl += '&page_size=200';
        const collected = [];
        let url = baseUrl;
        while (url) {
          const res = await fetch(url, { signal: controlador.signal });
          if (!res.ok) break;
          const data = await res.json();
          if (Array.isArray(data)) {
            collected.push(...data);
            url = null;
          } else {
            collected.push(...(data.results || []));
            url = data.next || null;
          }
        }
        setAplicacionesRepo(collected);
      } catch (e) {
        if (e.name !== 'AbortError') {
          // Silencioso: no bloquear flujo de creación
        }
      } finally {
        setLoadingApps(false);
      }
    }, 350); // debounce 350ms

    return () => {
      clearTimeout(timer);
      controlador.abort();
    };
  }, [abierto, marcaId, filtroAppModelo]);

  // Cargar válvulas filtradas (para GUIA_VALVULA)
  useEffect(() => {
    if (!abierto) return;
    if (tipoProducto !== 'GUIA_VALVULA') return;
    if (!marcaId && !filtroValvula.trim() && !filtroNumeroParte.trim()) { setValvulasRepo([]); return; }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoadingValvulas(true);
      try {
        // Filtramos por tipo de producto y opcionalmente por marca (de aplicaciones) y búsqueda
        let url = `${API_URL}/productos/?tipo_producto=VALVULA`;
        if (restringirValvulasPorMarca && marcaId) url += `&marca_vehiculo=${encodeURIComponent(marcaId)}`;
        if (filtroValvula.trim()) url += `&search=${encodeURIComponent(filtroValvula.trim())}`;
        if (filtroNumeroParte.trim()) url += `&numero_parte=${encodeURIComponent(filtroNumeroParte.trim())}`;
        url += `&page_size=200`;

        const acc = [];
        let next = url;
        while (next) {
          const res = await fetch(next, { signal: controller.signal });
          if (!res.ok) break;
          const data = await res.json();
          if (Array.isArray(data)) { acc.push(...data); next = null; }
          else { acc.push(...(data.results || [])); next = data.next || null; }
        }
        setValvulasRepo(acc);
      } catch (e) {
        if (e.name !== 'AbortError') {}
      } finally {
        setLoadingValvulas(false);
      }
    }, 350);

    return () => { clearTimeout(timer); controller.abort(); };
  }, [abierto, tipoProducto, marcaId, filtroValvula, filtroNumeroParte, restringirValvulasPorMarca]);

  // Previsualizar código cuando cambie tipo o marca (válvulas)
  useEffect(() => {
    const fetchCodigo = async () => {
      if (!['VALVULA', 'GUIA_VALVULA'].includes(tipoProducto) || !marcaId) { setCodigoInterno(''); return; }
      try {
        const url = `${API_URL}/productos/sugerir_codigo/?tipo=${encodeURIComponent(tipoProducto)}&marca_id=${encodeURIComponent(marcaId)}`;
        const res = await fetch(url, { 
          headers: token ? { 'Authorization': `Token ${token}` } : undefined
        });
        if (!res.ok) return; // si 403 u otro, no bloquear la UI
        const data = await res.json();
        if (data?.codigo_sugerido) setCodigoInterno(data.codigo_sugerido);
      } catch (e) { /* noop */ }
    };
    fetchCodigo();
  }, [tipoProducto, marcaId, token]);

  // Cerrar al click fuera
  useEffect(() => {
    const onDown = (e) => {
      if (abierto && modalRef.current && !modalRef.current.contains(e.target)) onClose?.();
    };
    if (abierto) document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [abierto, onClose]);

  const setEspField = (k, v) => setEsp(prev => ({ ...prev, [k]: v }));

  const addParte = () => setPartes(p => [...p, { marca: 'OEM', numero: '' }]);
  const setParte = (idx, campo, valor) => setPartes(p => p.map((it, i) => i === idx ? { ...it, [campo]: valor } : it));
  const removeParte = (idx) => setPartes(p => p.filter((_, i) => i !== idx));

  const validar = () => {
    if ((tipoProducto === 'VALVULA' || tipoProducto === 'GUIA_VALVULA') && !codigoInterno.trim()) { toast.error('Seleccione una marca para generar el código'); return false; }
    if (tipoProducto === 'VALVULA') {
      const req = ['tipo', 'diametro_cabeza', 'diametro_vastago', 'longitud_total'];
      const falt = req.filter(k => {
        const v = esp[k];
        return v === '' || v === null || (typeof v === 'string' && !v.trim());
      });
      if (falt.length) { toast.error('Complete las especificaciones obligatorias de válvula'); return false; }
    }
    if (tipoProducto === 'GUIA_VALVULA') {
      const req = ['diametro_exterior', 'diametro_interior', 'longitud_total'];
      const falt = req.filter(k => {
        const v = esp[k];
        return v === '' || v === null || (typeof v === 'string' && !v.trim());
      });
      if (falt.length) { toast.error('Complete las medidas de la guía'); return false; }
    }
    return true;
  };

  const handleCrear = async () => {
    if (!validar()) return;
    const formData = new FormData();
    formData.append('tipo_producto', tipoProducto);
    formData.append('codigo_interno', codigoInterno);
    formData.append('stock', Number(stock || 0));
    formData.append('precio_costo', Number(precioCosto || 0));
    formData.append('precio_venta', Number(precioVenta || 0));
    formData.append('observaciones', observaciones);
    // Especificaciones como JSON string
    let espec = {};
    if (tipoProducto === 'VALVULA') {
      espec = {
        tipo: esp.tipo,
        diametro_cabeza: Number(esp.diametro_cabeza),
        diametro_vastago: Number(esp.diametro_vastago),
        longitud_total: Number(esp.longitud_total),
        ranuras: esp.ranuras !== '' ? Number(esp.ranuras) : null,
      };
    } else if (tipoProducto === 'GUIA_VALVULA') {
      espec = {
        diametro_exterior: Number(esp.diametro_exterior),
        diametro_interior: Number(esp.diametro_interior),
        longitud_total: Number(esp.longitud_total),
      };
    }
    formData.append('especificaciones', JSON.stringify(espec));
    if (imagen) formData.append('imagen', imagen);

    try {
      // Incluir M2M valvulas_compatibles directamente en el POST si aplica
      if (tipoProducto === 'GUIA_VALVULA' && valvulasSeleccionadas.length) {
        for (const id of valvulasSeleccionadas.map(v => v.id)) {
          formData.append('valvulas_compatibles', id);
        }
      }
      const res = await fetch(API_URL + '/productos/', {
        method: 'POST',
        headers: token ? { 'Authorization': `Token ${token}` } : undefined,
        body: formData
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || 'No se pudo crear el producto');
      }
      const nuevo = await res.json();

      // Ya no es necesario el PATCH para valvulas_compatibles; se envían en el POST

      // Aplicación seleccionada (opcional): clonamos datos al nuevo producto
      if (aplicacionSeleccionada) {
        try {
          await fetch(API_URL + '/aplicaciones/', {
            method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Token ${token}` } : {}) },
            body: JSON.stringify({
              producto: nuevo.id,
              marca_vehiculo: aplicacionSeleccionada.marca_vehiculo,
              modelo_vehiculo: aplicacionSeleccionada.modelo_vehiculo,
              cilindrada: aplicacionSeleccionada.cilindrada,
              cantidad_cilindros: aplicacionSeleccionada.cantidad_cilindros,
              detalle_motor: aplicacionSeleccionada.detalle_motor,
              ano_desde: aplicacionSeleccionada.ano_desde,
              ano_hasta: aplicacionSeleccionada.ano_hasta,
              cantidad_valvulas: aplicacionSeleccionada.cantidad_valvulas,
            })
          });
        } catch {}
      }

      // Crear números de parte (opcional, sólo los que tengan número)
      const partesValidas = partes.filter(p => (p.numero || '').trim());
      for (const p of partesValidas) {
        try {
          await fetch(API_URL + '/numeros-parte/', {
            method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Token ${token}` } : {}) },
            body: JSON.stringify({ producto: nuevo.id, marca: p.marca || 'OEM', numero_de_parte: p.numero.trim() })
          });
        } catch {}
      }

      toast.success('Producto creado');
      onCreated?.(nuevo);
      onClose?.();
    } catch (e) {
      toast.error(e.message || 'Error al crear producto');
    }
  };

  // Ya recibimos las aplicaciones filtradas del backend; mantenemos memo por si se desea procesar adicionalmente
  const aplicacionesFiltradas = useMemo(() => aplicacionesRepo, [aplicacionesRepo]);

  if (!abierto) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content large" ref={modalRef}>
        <h2>Crear Nuevo Producto</h2>

        <div className="tab-content">
          <h4>Datos Generales</h4>
          <div className="form-grid">
            <div>
              <label>Tipo de Producto:</label>
              <select value={tipoProducto} onChange={(e) => setTipoProducto(e.target.value)}>
                <option value="VALVULA">Válvula</option>
                <option value="GUIA_VALVULA">Guía de Válvula</option>
                <option value="FILTRO">Filtro</option>
                <option value="BUJIA">Bujía</option>
                <option value="CABLE">Cable</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div>
              <label>Marca (para generar código):</label>
              <select value={marcaId} onChange={(e) => setMarcaId(e.target.value)}>
                <option value="">-- Seleccione --</option>
                {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div>
              <label>Código Interno:</label>
              <input value={codigoInterno} onChange={(e) => setCodigoInterno(e.target.value)} readOnly placeholder="Seleccione marca para sugerir" />
            </div>
            <div><label>Stock:</label><input value={stock} onChange={(e) => setStock(e.target.value)} /></div>
            <div><label>Precio Costo:</label><input value={precioCosto} onChange={(e) => setPrecioCosto(e.target.value)} /></div>
            <div><label>Precio Venta:</label><input value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} /></div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Observaciones:</label>
              <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </div>
          </div>

          {tipoProducto === 'VALVULA' && (
            <>
              <hr />
              <h4>Especificaciones de Válvula</h4>
              <div className="form-grid">
                {CAMPOS_VALVULA.map(c => (
                  <div key={c.name}>
                    <label>{c.label}:</label>
                    {c.type === 'select' ? (
                      <select value={esp[c.name]} onChange={(e) => setEspField(c.name, e.target.value)}>
                        {c.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <input type={c.type} value={esp[c.name]} onChange={(e) => setEspField(c.name, e.target.value)} />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {tipoProducto === 'GUIA_VALVULA' && (
            <>
              <hr />
              <h4>Medidas de Guía de Válvula</h4>
              <div className="form-grid">
                {CAMPOS_GUIA_VALVULA.map(c => (
                  <div key={c.name}>
                    <label>{c.label}:</label>
                    <input type={c.type} value={esp[c.name]} onChange={(e) => setEspField(c.name, e.target.value)} />
                  </div>
                ))}
              </div>
            </>
          )}

          {tipoProducto === 'VALVULA' && (
            <>
              <hr />
              <h4>Seleccionar Aplicación (opcional)</h4>
              <div className="form-grid">
                <div>
                  <label>Modelo</label>
                  <input 
                    value={filtroAppModelo} 
                    onChange={(e) => setFiltroAppModelo(e.target.value)} 
                    placeholder="Buscar modelo" 
                    disabled={!marcaId}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Resultados</label>
                  <select 
                    size={6} 
                    style={{ width: '100%' }} 
                    value={aplicacionSeleccionada?.id || ''} 
                    onChange={(e) => {
                      const sel = aplicacionesFiltradas.find(a => String(a.id) === e.target.value);
                      setAplicacionSeleccionada(sel || null);
                    }}
                    disabled={!marcaId}
                  >
                    <option value="">(Ninguna)</option>
                    {loadingApps && <option value="" disabled>Cargando...</option>}
                    {!loadingApps && aplicacionesFiltradas.slice(0, 200).map(a => (
                      <option key={a.id} value={a.id}>{`${a.marca_vehiculo_nombre || ''} ${a.modelo_vehiculo || ''}`}</option>
                    ))}
                  </select>
                  <small style={{ color: '#666' }}>
                    {marcaId
                      ? loadingApps
                        ? 'Consultando aplicaciones filtradas por marca...'
                        : `Resultados filtrados por la marca. ${filtroAppModelo ? 'Búsqueda aplicada.' : 'Use el campo de modelo para buscar.'}`
                      : 'Seleccione primero una marca para habilitar la búsqueda de aplicaciones.'}
                  </small>
                </div>
              </div>
            </>
          )}

          {tipoProducto === 'GUIA_VALVULA' && (
            <>
              <hr />
              <h4>Válvulas compatibles</h4>
              <div className="form-grid">
                <div>
                  <label>Buscar por código o modelo</label>
                  <input 
                    value={filtroValvula}
                    onChange={(e) => setFiltroValvula(e.target.value)}
                    placeholder="Ej: VAL-TOYO-001 o Corolla"
                  />
                </div>
                <div>
                  <label>Buscar por número de parte</label>
                  <input 
                    value={filtroNumeroParte}
                    onChange={(e) => setFiltroNumeroParte(e.target.value)}
                    placeholder="Ej: 12345-ABC"
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    id="chkRestrMarca"
                    type="checkbox"
                    checked={restringirValvulasPorMarca}
                    onChange={(e) => setRestringirValvulasPorMarca(e.target.checked)}
                  />
                  <label htmlFor="chkRestrMarca">Restringir por marca seleccionada</label>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Resultados</label>
                  {(() => {
                    // Unir resultados y seleccionadas para mantener visibles las ya elegidas
                    const mapa = new Map();
                    [...valvulasRepo, ...valvulasSeleccionadas].forEach(v => mapa.set(v.id, v));
                    const opcionesValvulas = Array.from(mapa.values());
                    const selectedIds = valvulasSeleccionadas.map(v => String(v.id));
                    return (
                      <select
                        size={6}
                        style={{ width: '100%' }}
                        multiple
                        value={selectedIds}
                        onChange={(e) => {
                          const ids = Array.from(e.target.selectedOptions).map(o => o.value);
                          const nuevos = opcionesValvulas.filter(v => ids.includes(String(v.id)));
                          setValvulasSeleccionadas(nuevos);
                        }}
                      >
                        {loadingValvulas && <option value="" disabled>Cargando...</option>}
                        {!loadingValvulas && opcionesValvulas.slice(0, 200).map(v => (
                          <option key={v.id} value={v.id}>
                            {`${v.codigo_interno} — ${(v.aplicaciones?.[0]?.marca_vehiculo?.nombre || '')} ${(v.aplicaciones?.[0]?.modelo_vehiculo || '')}`}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                  <small style={{ color: '#666' }}>
                    {restringirValvulasPorMarca && marcaId
                      ? 'Filtrando por marca seleccionada; puedes buscar por código interno, modelo o número de parte.'
                      : 'Búsqueda cross-marca activada; puedes buscar por código, modelo o número de parte. Agrega una marca y activa la casilla para acotar.'}
                  </small>
                </div>
                {valvulasSeleccionadas.length > 0 && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Seleccionadas</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {valvulasSeleccionadas.map(v => (
                        <span key={v.id} style={{ border: '1px solid #ccc', padding: '2px 6px', borderRadius: 4 }}>
                          {v.codigo_interno}
                          <button type="button" style={{ marginLeft: 6 }} onClick={() => setValvulasSeleccionadas(prev => prev.filter(x => x.id !== v.id))}>x</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <hr />
          <h4>Números de Parte (opcional)</h4>
          {partes.map((p, idx) => (
            <div key={idx} className="form-row" style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <select value={p.marca} onChange={(e) => setParte(idx, 'marca', e.target.value)}>
                <option value="OEM">OEM</option>
                <option value="TRW">TRW</option>
                <option value="OSVAT">OSVAT</option>
                <option value="SKU ML">SKU ML</option>
                <option value="OTRO">OTRO</option>
              </select>
              <input value={p.numero} onChange={(e) => setParte(idx, 'numero', e.target.value)} placeholder="Número de parte" />
              <button onClick={() => removeParte(idx)} type="button">Eliminar</button>
            </div>
          ))}
          <button onClick={addParte} type="button">Añadir número de parte</button>
        </div>

        <hr />
        <h4>Imagen principal (opcional)</h4>
        <div style={{ marginBottom: 16 }}>
          <input type="file" accept="image/*" onChange={e => setImagen(e.target.files?.[0] || null)} />
          {imagen && <div style={{ marginTop: 8 }}><b>Seleccionada:</b> {imagen.name}</div>}
        </div>
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary">Cancelar</button>
          <button onClick={handleCrear} className="btn btn-primary">Crear Producto</button>
        </div>
      </div>
    </div>
  );
}

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
  const [esp, setEsp] = useState({ tipo: '', diametro_cabeza: '', diametro_vastago: '', longitud_total: '', ranuras: '' });

  // Marcas
  const [marcas, setMarcas] = useState([]);
  const [marcaId, setMarcaId] = useState('');

  // Repositorio de Aplicaciones existentes y filtros locales
  const [aplicacionesRepo, setAplicacionesRepo] = useState([]);
  const [filtroAppModelo, setFiltroAppModelo] = useState('');
  const [aplicacionSeleccionada, setAplicacionSeleccionada] = useState(null);

  // Números de parte (opcional)
  const [partes, setPartes] = useState([{ marca: 'OEM', numero: '' }]);

  useEffect(() => {
    if (!abierto) return;
    fetch(API_URL + '/marcas/')
      .then(r => r.json())
      .then(d => setMarcas(d.results || d))
      .catch(() => {});

    // Cargar aplicaciones existentes (todas las páginas)
    const loadApps = async () => {
      try {
        let url = API_URL + '/aplicaciones/?page_size=1000';
        const all = [];
        while (url) {
          const res = await fetch(url);
          const data = await res.json();
          if (Array.isArray(data)) { all.push(...data); url = null; }
          else { all.push(...(data.results || [])); url = data.next || null; }
        }
        setAplicacionesRepo(all);
      } catch {}
    };
    loadApps();
  }, [abierto]);

  // Previsualizar código cuando cambie tipo o marca (válvulas)
  useEffect(() => {
    const fetchCodigo = async () => {
      if (tipoProducto !== 'VALVULA' || !marcaId) { setCodigoInterno(''); return; }
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
    if (tipoProducto === 'VALVULA' && !codigoInterno.trim()) { toast.error('Seleccione una marca para generar el código'); return false; }
    if (tipoProducto === 'VALVULA') {
      const req = ['tipo', 'diametro_cabeza', 'diametro_vastago', 'longitud_total'];
      const falt = req.filter(k => {
        const v = esp[k];
        return v === '' || v === null || (typeof v === 'string' && !v.trim());
      });
      if (falt.length) { toast.error('Complete las especificaciones obligatorias de válvula'); return false; }
    }
    return true;
  };

  const handleCrear = async () => {
    if (!validar()) return;
    const payload = {
      tipo_producto: tipoProducto,
      codigo_interno: codigoInterno,
      stock: Number(stock || 0),
      precio_costo: Number(precioCosto || 0),
      precio_venta: Number(precioVenta || 0),
      observaciones,
      especificaciones: tipoProducto === 'VALVULA' ? {
        tipo: esp.tipo,
        diametro_cabeza: Number(esp.diametro_cabeza),
        diametro_vastago: Number(esp.diametro_vastago),
        longitud_total: Number(esp.longitud_total),
        ranuras: esp.ranuras !== '' ? Number(esp.ranuras) : null,
      } : {},
    };

    try {
      const res = await fetch(API_URL + '/productos/', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Token ${token}` } : {}) }, body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || 'No se pudo crear el producto');
      }
      const nuevo = await res.json();

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

  const aplicacionesFiltradas = useMemo(() => {
    const marcaOk = (a) => !marcaId || String(a.marca_vehiculo) === String(marcaId);
    const modeloOk = (a) => !filtroAppModelo || (a.modelo_vehiculo || '').toLowerCase().includes(filtroAppModelo.toLowerCase());
    return aplicacionesRepo.filter(a => marcaOk(a) && modeloOk(a));
  }, [aplicacionesRepo, marcaId, filtroAppModelo]);

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

          <hr />
          <h4>Seleccionar Aplicación (opcional)</h4>
          <div className="form-grid">
            <div>
              <label>Modelo</label>
              <input value={filtroAppModelo} onChange={(e) => setFiltroAppModelo(e.target.value)} placeholder="Buscar modelo" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Resultados</label>
              <select size={6} style={{ width: '100%' }} value={aplicacionSeleccionada?.id || ''} onChange={(e) => {
                const sel = aplicacionesFiltradas.find(a => String(a.id) === e.target.value);
                setAplicacionSeleccionada(sel || null);
              }}>
                <option value="">(Ninguna)</option>
                {aplicacionesFiltradas.slice(0, 200).map(a => (
                  <option key={a.id} value={a.id}>{`${a.marca_vehiculo_nombre || ''} ${a.modelo_vehiculo || ''}`}</option>
                ))}
              </select>
              <small style={{ color: '#666' }}>Resultados filtrados por la marca seleccionada arriba. Use el filtro por modelo para acotar.</small>
            </div>
          </div>

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

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary">Cancelar</button>
          <button onClick={handleCrear} className="btn btn-primary">Crear Producto</button>
        </div>
      </div>
    </div>
  );
}

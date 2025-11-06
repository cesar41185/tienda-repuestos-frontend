import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import API_URL from '../apiConfig';

function GestorAplicacionesPage() {
  const [aplicaciones, setAplicaciones] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroMarcaId, setFiltroMarcaId] = useState('');
  const [filtroModelo, setFiltroModelo] = useState('');

  // Estado de edición
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    marca_vehiculo: '',
    modelo_vehiculo: '',
    cilindrada: '',
    cantidad_cilindros: '',
    detalle_motor: '',
    ano_desde: '',
    ano_hasta: '',
    cantidad_valvulas: ''
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
      const res = await fetch(API_URL + '/aplicaciones/');
      const data = await res.json();
      setAplicaciones(data.results || data);
    } catch (e) {
      toast.error('No se pudieron cargar las aplicaciones');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchMarcas();
    fetchAplicaciones();
  }, []);

  const aplicacionesFiltradas = useMemo(() => {
    return aplicaciones.filter((a) => {
      const okMarca = !filtroMarcaId || String(a.marca_vehiculo) === String(filtroMarcaId);
      const okModelo = !filtroModelo || (a.modelo_vehiculo || '').toLowerCase().includes(filtroModelo.toLowerCase());
      return okMarca && okModelo;
    });
  }, [aplicaciones, filtroMarcaId, filtroModelo]);

  const startEdit = (a) => {
    setEditId(a.id);
    setForm({
      marca_vehiculo: a.marca_vehiculo || '',
      modelo_vehiculo: a.modelo_vehiculo || '',
      cilindrada: a.cilindrada ?? '',
      cantidad_cilindros: a.cantidad_cilindros ?? '',
      detalle_motor: a.detalle_motor || '',
      ano_desde: a.ano_desde ?? '',
      ano_hasta: a.ano_hasta ?? '',
      cantidad_valvulas: a.cantidad_valvulas ?? ''
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({
      marca_vehiculo: '', modelo_vehiculo: '', cilindrada: '', cantidad_cilindros: '',
      detalle_motor: '', ano_desde: '', ano_hasta: '', cantidad_valvulas: ''
    });
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const saveEdit = async () => {
    if (!editId) return;
    if (!form.marca_vehiculo) {
      toast.error('Seleccione una marca');
      return;
    }
    if (!form.modelo_vehiculo.trim()) {
      toast.error('Ingrese el modelo');
      return;
    }

    const payload = {
      marca_vehiculo: Number(form.marca_vehiculo),
      modelo_vehiculo: form.modelo_vehiculo.trim(),
      cilindrada: form.cilindrada !== '' ? Number(form.cilindrada) : null,
      cantidad_cilindros: form.cantidad_cilindros !== '' ? Number(form.cantidad_cilindros) : null,
      detalle_motor: form.detalle_motor.trim(),
      ano_desde: form.ano_desde !== '' ? Number(form.ano_desde) : null,
      ano_hasta: form.ano_hasta !== '' ? Number(form.ano_hasta) : null,
      cantidad_valvulas: form.cantidad_valvulas !== '' ? Number(form.cantidad_valvulas) : null,
    };

    try {
      const resp = await fetch(`${API_URL}/aplicaciones/${editId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.detail || 'No OK');
      }
      toast.success('Aplicación actualizada');
      cancelEdit();
      fetchAplicaciones();
    } catch (e) {
      toast.error('No se pudo actualizar la aplicación');
    }
  };

  const nombreMarca = (id) => {
    const m = marcas.find((x) => String(x.id) === String(id));
    return m ? m.nombre : `ID ${id}`;
  };

  if (cargando) return <p>Cargando aplicaciones...</p>;

  return (
    <div className="gestor-container">
      <h2>Gestor de Aplicaciones de Vehículo</h2>

      {/* Filtros */}
      <div className="gestor-filtros" style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <select value={filtroMarcaId} onChange={(e) => setFiltroMarcaId(e.target.value)}>
          <option value="">Todas las marcas</option>
          {marcas.map((m) => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Buscar modelo"
          value={filtroModelo}
          onChange={(e) => setFiltroModelo(e.target.value)}
        />
      </div>

      {/* Editor */}
      {editId && (
        <div className="editor-card" style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <h3 style={{ marginTop: 0 }}>Editar aplicación #{editId}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <label>
              <div>Marca</div>
              <select name="marca_vehiculo" value={form.marca_vehiculo} onChange={onChange}>
                <option value="">Seleccione</option>
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </label>
            <label>
              <div>Modelo</div>
              <input name="modelo_vehiculo" value={form.modelo_vehiculo} onChange={onChange} />
            </label>
            <label>
              <div>Cilindrada</div>
              <input name="cilindrada" value={form.cilindrada} onChange={onChange} placeholder="1.6" />
            </label>
            <label>
              <div>Cilindros</div>
              <input name="cantidad_cilindros" value={form.cantidad_cilindros} onChange={onChange} placeholder="4" />
            </label>
            <label>
              <div>Detalle Motor</div>
              <input name="detalle_motor" value={form.detalle_motor} onChange={onChange} placeholder="Zetec" />
            </label>
            <label>
              <div>Año Desde</div>
              <input name="ano_desde" value={form.ano_desde} onChange={onChange} placeholder="2005" />
            </label>
            <label>
              <div>Año Hasta</div>
              <input name="ano_hasta" value={form.ano_hasta} onChange={onChange} placeholder="2012" />
            </label>
            <label>
              <div>Válvulas</div>
              <input name="cantidad_valvulas" value={form.cantidad_valvulas} onChange={onChange} placeholder="16" />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={saveEdit} className="btn-edit">Guardar</button>
            <button onClick={cancelEdit} className="btn-delete">Cancelar</button>
          </div>
        </div>
      )}

      {/* Tabla responsive con scroll horizontal */}
      <div className="tabla-responsive" style={{ overflowX: 'auto' }}>
        <table style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Cilindrada</th>
              <th>Cilindros</th>
              <th>Detalle</th>
              <th>Año Desde</th>
              <th>Año Hasta</th>
              <th>Válvulas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {aplicacionesFiltradas.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{nombreMarca(a.marca_vehiculo)} ({a.marca_vehiculo})</td>
                <td>{a.modelo_vehiculo}</td>
                <td>{a.cilindrada ?? ''}</td>
                <td>{a.cantidad_cilindros ?? ''}</td>
                <td>{a.detalle_motor || ''}</td>
                <td>{a.ano_desde ?? ''}</td>
                <td>{a.ano_hasta ?? ''}</td>
                <td>{a.cantidad_valvulas ?? ''}</td>
                <td>
                  <button onClick={() => startEdit(a)} className="btn-edit">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 12, color: '#666' }}>
        Consejo: use el filtro por marca o modelo. El selector de marca evita errores de escritura y mantiene integridad.
      </p>
    </div>
  );
}

export default GestorAplicacionesPage;

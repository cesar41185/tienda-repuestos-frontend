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
    <div className="gestor-container">
      <h2>Gestor de Vehículos</h2>

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
          <h3 style={{ marginTop: 0 }}>Editar vehículo #{editId}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <label>
              <div>Marca</div>
              <select name="marca" value={form.marca} onChange={onChange}>
                <option value="">Seleccione</option>
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </label>
            <label>
              <div>Modelo</div>
              <input name="modelo" value={form.modelo} onChange={onChange} />
            </label>
            <label>
              <div>Cilindrada</div>
              <input name="cilindrada" value={form.cilindrada} onChange={onChange} placeholder="1.6" />
            </label>
            <label>
              <div>Cilindros</div>
              <input name="cilindros" value={form.cilindros} onChange={onChange} placeholder="4" />
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
              <th>Años</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vehiculosFiltrados.map((v) => (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td>{v.marca || ''}</td>
                <td>{v.modelo}</td>
                <td>{v.cilindrada ?? ''}</td>
                <td>{v.cilindros ?? ''}</td>
                <td>{v.detalle_motor || ''}</td>
                <td>{v.ano_desde ?? ''}</td>
                <td>{v.ano_hasta ?? ''}</td>
                <td>{v.anos || ''}</td>
                <td>
                  <button onClick={() => startEdit(v)} className="btn-edit">Editar</button>
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

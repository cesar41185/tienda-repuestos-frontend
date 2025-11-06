import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import API_URL from '../apiConfig';

function GestorAplicacionesPage() {
  const [aplicaciones, setAplicaciones] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroMarcaId, setFiltroMarcaId] = useState('');
  const [filtroModelo, setFiltroModelo] = useState('');

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

  const handleEdit = async (app) => {
    // Recoger campos clave con prompts rápidos. Puede mejorarse a un modal luego.
    const marcaIdStr = window.prompt('ID de Marca (deje igual para no cambiar):', app.marca_vehiculo);
    if (marcaIdStr === null) return; // cancelado
    const modelo = window.prompt('Modelo:', app.modelo_vehiculo || '') ?? '';
    if (modelo === null) return;
    const cil = window.prompt('Cilindrada (ej: 1.6):', app.cilindrada ?? '') ?? '';
    if (cil === null) return;
    const cilCant = window.prompt('Cantidad cilindros:', app.cantidad_cilindros ?? '') ?? '';
    if (cilCant === null) return;
    const det = window.prompt('Detalle motor:', app.detalle_motor || '') ?? '';
    if (det === null) return;
    const desde = window.prompt('Año desde:', app.ano_desde ?? '') ?? '';
    if (desde === null) return;
    const hasta = window.prompt('Año hasta:', app.ano_hasta ?? '') ?? '';
    if (hasta === null) return;
    const cantValv = window.prompt('Cantidad de válvulas:', app.cantidad_valvulas ?? '') ?? '';
    if (cantValv === null) return;

    const payload = {
      // Solo incluimos lo que el backend espera. marca_vehiculo es PK.
      marca_vehiculo: marcaIdStr ? Number(marcaIdStr) : app.marca_vehiculo,
      modelo_vehiculo: (modelo || '').trim(),
      cilindrada: cil !== '' ? Number(cil) : null,
      cantidad_cilindros: cilCant !== '' ? Number(cilCant) : null,
      detalle_motor: (det || '').trim(),
      ano_desde: desde !== '' ? Number(desde) : null,
      ano_hasta: hasta !== '' ? Number(hasta) : null,
      cantidad_valvulas: cantValv !== '' ? Number(cantValv) : null,
    };

    try {
      const resp = await fetch(`${API_URL}/aplicaciones/${app.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.detail || 'No OK');
      }
      toast.success('Aplicación actualizada');
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

      <div className="gestor-filtros" style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
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

      <div className="tabla-responsive">
        <table>
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
                  <button onClick={() => handleEdit(a)} className="btn-edit">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 12, color: '#666' }}>
        Nota: al editar una Marca en el gestor de marcas, el cambio se refleja en todas las aplicaciones asociadas automáticamente, ya que comparten la misma marca.
      </p>
    </div>
  );
}

export default GestorAplicacionesPage;

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import API_URL from '../apiConfig';

function GestorAplicacionesPage() {
  const [vehiculos, setVehiculos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [cargando, setCargando] = useState(false);
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
    // Solo buscar si hay filtros activos
    if (!filtroMarcaId && !filtroModelo) {
      setVehiculos([]);
      return;
    }

    setCargando(true);
    try {
      let url = API_URL + '/vehiculos/?page_size=100'; // Límite de 100 resultados
      
      // Agregar filtros
      if (filtroMarcaId) {
        const marcaNombre = marcas.find((m) => String(m.id) === String(filtroMarcaId))?.nombre || '';
        url += `&marca__nombre=${encodeURIComponent(marcaNombre)}`;
      }
      if (filtroModelo) {
        url += `&search=${encodeURIComponent(filtroModelo)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      const resultados = Array.isArray(data) ? data : (data.results || []);
      setVehiculos(resultados);
    } catch (e) {
      toast.error('No se pudieron cargar los vehículos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchMarcas();
  }, []);



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
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h2>Gestor de Vehículos</h2>
      
      {/* Filtros */}
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0 }}>Buscar Vehículos</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Marca</label>
            <select 
              value={filtroMarcaId} 
              onChange={(e) => setFiltroMarcaId(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="">Todas las marcas</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Modelo</label>
            <input
              type="text"
              placeholder="Buscar modelo..."
              value={filtroModelo}
              onChange={(e) => setFiltroModelo(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <button 
            onClick={fetchAplicaciones}
            style={{
              padding: '8px 20px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🔍 Buscar
          </button>
          {(filtroMarcaId || filtroModelo) && (
            <button 
              onClick={() => { setFiltroMarcaId(''); setFiltroModelo(''); setVehiculos([]); }} 
              style={{
                padding: '8px 20px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ✕ Limpiar
            </button>
          )}
        </div>
        <p style={{ marginTop: '10px', marginBottom: 0, color: '#666', fontSize: '0.9rem' }}>
          💡 Usa los filtros para buscar vehículos específicos (máximo 100 resultados)
        </p>
      </div>

      {/* Editor */}
      {editId && (
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '2px solid #2563eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>Editar Vehículo #{editId}</h3>
            <button 
              onClick={cancelEdit}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ✕ Cerrar
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <label>
              <div style={{ marginBottom: '5px', fontWeight: '500' }}>Marca *</div>
              <select 
                name="marca" 
                value={form.marca} 
                onChange={onChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">Seleccione</option>
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </label>
            <label>
              <div style={{ marginBottom: '5px', fontWeight: '500' }}>Modelo *</div>
              <input 
                name="modelo" 
                value={form.modelo} 
                onChange={onChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </label>
            <label>
              <div style={{ marginBottom: '5px', fontWeight: '500' }}>Cilindrada</div>
              <input 
                name="cilindrada" 
                value={form.cilindrada} 
                onChange={onChange}
                placeholder="1.6"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </label>
            <label>
              <div style={{ marginBottom: '5px', fontWeight: '500' }}>Cilindros</div>
              <input 
                name="cilindros" 
                value={form.cilindros} 
                onChange={onChange}
                placeholder="4"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </label>
            <label>
              <div style={{ marginBottom: '5px', fontWeight: '500' }}>Detalle Motor</div>
              <input 
                name="detalle_motor" 
                value={form.detalle_motor} 
                onChange={onChange}
                placeholder="Zetec"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </label>
            <label>
              <div style={{ marginBottom: '5px', fontWeight: '500' }}>Año Desde</div>
              <input 
                name="ano_desde" 
                value={form.ano_desde} 
                onChange={onChange}
                placeholder="2005"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </label>
            <label>
              <div style={{ marginBottom: '5px', fontWeight: '500' }}>Año Hasta</div>
              <input 
                name="ano_hasta" 
                value={form.ano_hasta} 
                onChange={onChange}
                placeholder="2012"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </label>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
            <button 
              onClick={saveEdit}
              style={{
                padding: '8px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              💾 Guardar
            </button>
            <button 
              onClick={cancelEdit}
              style={{
                padding: '8px 20px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Resultados */}
      {cargando && <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Cargando...</div>}
      
      {!cargando && vehiculos.length > 0 && (
        <div style={{ 
          background: 'white', 
          padding: '15px', 
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflowX: 'auto'
        }}>
          <div style={{ marginBottom: '12px', fontWeight: '500', color: '#666' }}>
            {vehiculos.length} resultados
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600' }}>ID</th>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600' }}>Marca</th>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600' }}>Modelo</th>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600' }}>Motor</th>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600' }}>Años</th>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vehiculos.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px' }}>{v.id}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ 
                      background: '#dbeafe', 
                      color: '#1e40af', 
                      padding: '3px 8px', 
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}>
                      {v.marca}
                    </span>
                  </td>
                  <td style={{ padding: '10px', fontWeight: '500' }}>{v.modelo}</td>
                  <td style={{ padding: '10px', fontSize: '0.9rem' }}>
                    {v.cilindrada && <span>{v.cilindrada}L </span>}
                    {v.cilindros && <span>{v.cilindros}cil </span>}
                    {v.detalle_motor && <span>{v.detalle_motor}</span>}
                  </td>
                  <td style={{ padding: '10px', fontSize: '0.9rem' }}>
                    {v.ano_desde || '?'} - {v.ano_hasta || '?'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <button 
                      onClick={() => startEdit(v)}
                      style={{
                        padding: '5px 12px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {!cargando && vehiculos.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px', 
          color: '#9ca3af',
          background: 'white',
          borderRadius: '8px',
          border: '2px dashed #e5e7eb'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>�</div>
          <p style={{ fontSize: '1.1rem', marginBottom: '5px' }}>Sin resultados</p>
          <p style={{ fontSize: '0.9rem' }}>Usa los filtros y presiona "Buscar" para encontrar vehículos</p>
        </div>
      )}
    </div>
  );
}

export default GestorAplicacionesPage;

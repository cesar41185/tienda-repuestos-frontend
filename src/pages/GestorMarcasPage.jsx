// En src/pages/GestorMarcasPage.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API_URL from '../apiConfig';

function GestorMarcasPage() {
  const [marcas, setMarcas] = useState([]);
  const [nuevaMarca, setNuevaMarca] = useState('');
  const [cargando, setCargando] = useState(true);

  
  // Función para cargar las marcas
  const fetchMarcas = async () => {
    try {
      const response = await fetch(API_URL + '/marcas/');
      const data = await response.json();
      // La API puede devolver los datos paginados o no, nos preparamos para ambos casos
      setMarcas(data.results || data);
    } catch (error) {
      toast.error('No se pudieron cargar las marcas.');
    } finally {
      setCargando(false);
    }
  };

  // Cargar las marcas al iniciar el componente
  useEffect(() => {
    fetchMarcas();
  }, []);

  // Función para añadir una nueva marca
  const handleAddMarca = async (e) => {
    e.preventDefault();
    if (!nuevaMarca.trim()) return;

    try {
      await fetch(API_URL + '/marcas/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevaMarca }),
      });
      toast.success(`Marca '${nuevaMarca}' añadida con éxito.`);
      setNuevaMarca(''); // Limpiamos el input
      fetchMarcas();    // Recargamos la lista
    } catch (error) {
      toast.error('Error al añadir la marca.');
    }
  };

  // Función para eliminar una marca
  const handleDeleteMarca = async (marcaId) => {
    if (window.confirm('¿Seguro que quieres eliminar esta marca?')) {
      try {
        await fetch(`${API_URL}/marcas/${marcaId}/`, { method: 'DELETE' });
        toast.success('Marca eliminada.');
        fetchMarcas(); // Recargamos la lista
      } catch (error) {
        toast.error('Error al eliminar la marca.');
      }
    }
  };

  // Nueva: edición inline de marca
  const handleEditMarca = async (marca) => {
    const nuevoNombre = window.prompt('Editar nombre de la marca:', marca.nombre);
    if (nuevoNombre === null) return; // cancelado
    const nombreLimpio = nuevoNombre.trim();
    if (!nombreLimpio) {
      toast.error('El nombre no puede estar vacío.');
      return;
    }
    try {
      const resp = await fetch(`${API_URL}/marcas/${marca.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreLimpio })
      });
      if (!resp.ok) throw new Error('No OK');
      toast.success('Marca actualizada.');
      fetchMarcas();
    } catch (e) {
      toast.error('No se pudo actualizar la marca.');
    }
  };

  if (cargando) return <p>Cargando marcas...</p>;

  return (
    <div className="gestor-container">
      <h2>Gestor de Marcas de Vehículos</h2>

      <div className="gestor-form">
        <form onSubmit={handleAddMarca}>
          <input 
            type="text" 
            placeholder="Nombre de la nueva marca"
            value={nuevaMarca}
            onChange={(e) => setNuevaMarca(e.target.value)}
          />
          <button type="submit">Añadir Marca</button>
        </form>
      </div>

      <ul className="gestor-lista">
        {marcas.map(marca => (
          <li key={marca.id}>
            <span>{marca.nombre}</span>
            <div style={{ display: 'inline-flex', gap: 8, marginLeft: 12 }}>
              <button onClick={() => handleEditMarca(marca)} className="btn-edit">
                Editar
              </button>
              <button onClick={() => handleDeleteMarca(marca.id)} className="btn-delete">
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GestorMarcasPage;
// En src/pages/GestorMarcasPage.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function GestorMarcasPage() {
  const [marcas, setMarcas] = useState([]);
  const [nuevaMarca, setNuevaMarca] = useState('');
  const [cargando, setCargando] = useState(true);

  const API_URL = 'http://192.168.1.55:8000/api/marcas/';

  // Función para cargar las marcas
  const fetchMarcas = async () => {
    try {
      const response = await fetch(API_URL);
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
      await fetch(API_URL, {
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
        await fetch(`${API_URL}${marcaId}/`, { method: 'DELETE' });
        toast.success('Marca eliminada.');
        fetchMarcas(); // Recargamos la lista
      } catch (error) {
        toast.error('Error al eliminar la marca.');
      }
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
            <button onClick={() => handleDeleteMarca(marca.id)} className="btn-delete">
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GestorMarcasPage;
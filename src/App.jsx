// En src/App.jsx
import { useState, useEffect } from 'react';
import Header from './components/Header';
import Buscador from './components/Buscador';
import TablaResultados from './components/TablaResultados';

function App() {
  const [valvulas, setValvulas] = useState([]);
  const [marcas, setMarcas] = useState([]); // Estado para la lista de marcas
  const [cargando, setCargando] = useState(false);

  // URLs de nuestra API
  const valvulasUrl = 'http://192.168.1.55:8000/api/valvulas/';
  const marcasUrl = 'http://192.168.1.55:8000/api/marcas/';

  // useEffect para cargar la lista de marcas UNA SOLA VEZ
  useEffect(() => {
    const fetchMarcas = async () => {
      try {
        const response = await fetch(marcasUrl);
        const data = await response.json();
        setMarcas(data);
      } catch (error) {
        console.error("Error al cargar marcas:", error);
      }
    };
    fetchMarcas();
  }, []);

  // La función de búsqueda ahora recibe un objeto de filtros
  const buscarValvulas = async (filtros) => {
    setCargando(true);
    
    // Construimos los parámetros de la URL a partir de los filtros
    const params = new URLSearchParams();
    for (const key in filtros) {
      if (filtros[key]) { // Solo añadimos el filtro si tiene un valor
        params.append(key, filtros[key]);
      }
    }
    
    const url = `${valvulasUrl}?${params.toString()}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      setValvulas(data);
    } catch (error) {
      console.error("Error al buscar válvulas:", error);
    }
    setCargando(false);
  };

  // Búsqueda inicial al cargar la página
  useEffect(() => {
    buscarValvulas({});
  }, []);

  return (
    <div className="app-container">
      <Header />
      {/* Pasamos la función de búsqueda Y la lista de marcas al Buscador */}
      <Buscador onBuscar={buscarValvulas} marcas={marcas} />
      <TablaResultados valvulas={valvulas} cargando={cargando} />
    </div>
  );
}

export default App;
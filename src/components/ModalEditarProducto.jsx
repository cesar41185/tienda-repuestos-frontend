import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import API_URL from '../apiConfig';

// Configuración de campos por tipo de producto
const CAMPOS_POR_TIPO = {
  VALVULA: {
    titulo: 'Válvula',
    campos: [
      { name: 'tipo', label: 'Tipo', type: 'select', options: [
        { value: '', label: '-- Seleccione --' },
        { value: 'INTAKE', label: 'Admisión' },
        { value: 'EXHAUST', label: 'Escape' }
      ]},
      { name: 'diametro_cabeza', label: 'Cabeza (mm)', type: 'number' },
      { name: 'diametro_vastago', label: 'Vástago (mm)', type: 'number' },
      { name: 'longitud_total', label: 'Longitud (mm)', type: 'number' },
      { name: 'ranuras', label: 'Ranuras', type: 'number' },
      { name: 'angulo_asiento', label: 'Angulo Asiento (°)', type: 'number', step: '0.1' },
      { name: 'distancia_primera_ranura', label: 'Distancia Ranura (mm)', type: 'number' },
    ]
  },
  GUIA_VALVULA: {
    titulo: 'Guía de Válvula',
    campos: [
      { name: 'diametro_exterior', label: 'Diám. Exterior (mm)', type: 'number' },
      { name: 'diametro_interior', label: 'Diám. Interior (mm)', type: 'number' },
      { name: 'longitud_total', label: 'Longitud (mm)', type: 'number' },
    ]
  },
  FILTRO: {
    titulo: 'Filtro',
    campos: [
      { name: 'tipo', label: 'Tipo de Filtro', type: 'select', options: [
        { value: '', label: '-- Seleccione --' },
        { value: 'ACEITE', label: 'Aceite' },
        { value: 'AIRE', label: 'Aire' },
        { value: 'COMBUSTIBLE', label: 'Combustible' },
        { value: 'CABINA', label: 'Cabina' }
      ]},
      { name: 'diametro', label: 'Diámetro (mm)', type: 'number' },
      { name: 'altura', label: 'Altura (mm)', type: 'number' },
      { name: 'rosca', label: 'Rosca', type: 'text' },
      { name: 'capacidad', label: 'Capacidad (L)', type: 'number' },
    ]
  },
  BUJIA: {
    titulo: 'Bujía',
    campos: [
      { name: 'tipo', label: 'Tipo', type: 'select', options: [
        { value: '', label: '-- Seleccione --' },
        { value: 'NORMAL', label: 'Normal' },
        { value: 'IRIDIO', label: 'Iridio' },
        { value: 'PLATINO', label: 'Platino' }
      ]},
      { name: 'rosca', label: 'Rosca', type: 'text' },
      { name: 'gap', label: 'Gap (mm)', type: 'number', step: '0.1' },
      { name: 'voltaje', label: 'Voltaje', type: 'number' },
    ]
  },
  CABLE: {
    titulo: 'Cable',
    campos: [
      { name: 'longitud', label: 'Longitud (m)', type: 'number', step: '0.1' },
      { name: 'calibre', label: 'Calibre', type: 'text' },
      { name: 'voltaje', label: 'Voltaje', type: 'number' },
      { name: 'tipo_conector', label: 'Tipo Conector', type: 'text' },
    ]
  },
  OTRO: {
    titulo: 'Otro Producto',
    campos: [
      { name: 'descripcion', label: 'Descripción', type: 'textarea' },
    ]
  }
};

function ModalEditarProducto({ producto, onClose, onSave, onRefresh, marcas, onDelete }) {
  const { user, token } = useAuth(); 
  const [activeTab, setActiveTab] = useState('datos');
  const [modoCrear, setModoCrear] = useState(false);
  const modalRef = useRef(null);
  
  // Estado inicial genérico
  const initialState = {
    tipo_producto: 'VALVULA',
    codigo_interno: '',
    categoria: null,
    stock: '',
    stock_minimo: '',
    peso: '',
    precio_costo: '',
    precio_venta: '',
    observaciones: '',
    especificaciones: {},
    fotos: [],
    numeros_de_parte: [],
    aplicaciones: []
  };
  
  const [formData, setFormData] = useState(initialState);
  const [nuevaReferencia, setNuevaReferencia] = useState({ marca: '', numero_de_parte: '' });
  const [nuevaAplicacion, setNuevaAplicacion] = useState({
    marca_vehiculo: '',
    modelo_vehiculo: '',
    cilindrada: '',
    cantidad_cilindros: '',
    detalle_motor: '',
    ano_desde: '',
    ano_hasta: '',
    cantidad_valvulas: ''
  });

  // Búsqueda y selección de aplicaciones existentes
  const [buscaMarcaExistente, setBuscaMarcaExistente] = useState('');
  const [buscaModeloExistente, setBuscaModeloExistente] = useState('');
  const [resultadosAplicaciones, setResultadosAplicaciones] = useState([]);
  const [cargandoAplicaciones, setCargandoAplicaciones] = useState(false);

  // Marca para sugerir código (solo en creación de válvulas)
  const [marcaIdParaCodigo, setMarcaIdParaCodigo] = useState('');

  // Cerrar modal al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    if (producto) {
      setModoCrear(false);
      let specs = {};
      if (producto.especificaciones) {
        if (typeof producto.especificaciones === 'string') {
          try {
            specs = JSON.parse(producto.especificaciones);
          } catch (e) {
            console.error("Error al parsear JSON de especificaciones:", e);
            specs = {};
          }
        } else {
          specs = producto.especificaciones;
        }
      }
      setFormData({
        ...initialState,
        ...producto,
        especificaciones: specs
      });
    } else {
      setModoCrear(true);
      setFormData(initialState);
    }
  }, [producto]);

  if (!producto && !modoCrear) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si cambia el tipo de producto, limpiamos las especificaciones
    if (name === 'tipo_producto') {
      setFormData(prev => ({
        ...prev,
        tipo_producto: value,
        especificaciones: {}
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Sugerir código cuando estamos creando y es válvula y hay marca seleccionada
  useEffect(() => {
    const sugerir = async () => {
      if (!modoCrear) return;
      if (formData.tipo_producto !== 'VALVULA') return;
      if (!marcaIdParaCodigo) return;
      try {
        const url = `${API_URL}/productos/sugerir_codigo/?tipo=${encodeURIComponent(formData.tipo_producto)}&marca_id=${encodeURIComponent(marcaIdParaCodigo)}`;
        const res = await fetch(url, { credentials: 'include' });
        const data = await res.json();
        if (data?.codigo_sugerido) {
          setFormData(prev => ({ ...prev, codigo_interno: data.codigo_sugerido }));
        }
      } catch (e) {}
    };
    sugerir();
  }, [modoCrear, formData.tipo_producto, marcaIdParaCodigo]);

  const handleSpecChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      especificaciones: { ...prev.especificaciones, [name]: value }
    }));
  };

  const handleNuevaAplicacionChange = (e) => {
    const { name, value } = e.target;
    setNuevaAplicacion(prev => ({ ...prev, [name]: value }));
  };

  const handleNuevaReferenciaChange = (e) => {
    const { name, value } = e.target;
    setNuevaReferencia(prev => ({ ...prev, [name]: value }));
  };

  const handleGlobalSave = async () => {
    try {
      toast.loading('Guardando...');
      
      let url, method;
      if (modoCrear) {
        url = `${API_URL}/productos/`;
        method = 'POST';
      } else {
        url = `${API_URL}/productos/${producto.id}/`;
        method = 'PATCH';
      }
      
      // Limitar las especificaciones a las llaves definidas para el tipo actual
      const allowedSpecKeys = (CAMPOS_POR_TIPO[formData.tipo_producto]?.campos || []).map(c => c.name);
      const filteredSpecs = Object.fromEntries(
        Object.entries(formData.especificaciones || {}).filter(([k]) => allowedSpecKeys.includes(k))
      );
      // Normalizar peso: enviar null si vacío, número si válido
      const pesoNormalizado = (formData.peso === '' || formData.peso === null || typeof formData.peso === 'undefined')
        ? null
        : parseFloat(formData.peso);
      const payload = { ...formData, especificaciones: filteredSpecs, peso: isNaN(pesoNormalizado) ? null : pesoNormalizado };

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al guardar');
      }

      const productoActualizado = await response.json();
      
      toast.dismiss();
      toast.success(modoCrear ? 'Producto creado exitosamente' : 'Producto actualizado');
      onSave(productoActualizado);
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || 'Hubo un error al guardar los datos.');
    }
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !producto) return;

    toast.loading('Subiendo fotos...');

    try {
      const uploadPromises = Array.from(files).map(file => {
        const dataFoto = new FormData();
        dataFoto.append('producto', producto.id);
        dataFoto.append('imagen', file);
        
        return fetch(`${API_URL}/fotos/`, {
          method: 'POST',
          headers: { 'Authorization': `Token ${token}` },
          body: dataFoto,
        }).then(async response => {
          console.log(`Respuesta de subir foto ${file.name}:`, response.status, response.statusText);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error al subir foto:', errorData);
            throw new Error(errorData.detail || errorData.message || `Error al subir ${file.name}`);
          }
          
          const fotoData = await response.json();
          console.log('Foto creada - Datos completos:', fotoData);
          console.log('Foto creada - URL de imagen:', fotoData.imagen);
          
          // Verificar que la foto tenga URL
          if (!fotoData.imagen || fotoData.imagen.trim() === '') {
            console.error('⚠️ Foto creada pero sin URL:', fotoData);
            console.error('⚠️ ID de foto:', fotoData.id);
            console.error('⚠️ Producto ID:', fotoData.producto);
          } else {
            console.log('✅ Foto creada con URL válida:', fotoData.imagen);
          }
          return fotoData;
        });
      });

      const nuevasFotos = await Promise.all(uploadPromises);
      
      // Esperar un momento para que el servidor procese las imágenes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recargar el producto para obtener las fotos actualizadas con URLs correctas
      const response = await fetch(`${API_URL}/productos/${producto.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (response.ok) {
        const productoActualizado = await response.json();
        console.log('Producto actualizado - Todas las fotos:', productoActualizado.fotos);
        
        // Verificar que las fotos tengan URLs válidas y no estén vacías
        const fotosValidas = productoActualizado.fotos
          .filter(foto => {
            const tieneUrl = foto.imagen && foto.imagen.trim() !== '';
            if (!tieneUrl) {
              console.warn('⚠️ Foto sin URL filtrada:', foto);
            }
            return tieneUrl;
          })
          .map(foto => ({
            ...foto,
            imagen: foto.imagen || null
          }));
        
        console.log(`Fotos válidas después de filtrar: ${fotosValidas.length} de ${productoActualizado.fotos.length}`);
        console.log('Fotos recargadas (válidas):', fotosValidas);
        
        if (fotosValidas.length < productoActualizado.fotos.length) {
          console.error(`⚠️ Se filtraron ${productoActualizado.fotos.length - fotosValidas.length} fotos sin URL`);
        }
        
        setFormData(prev => ({ ...prev, fotos: fotosValidas }));
        toast.dismiss();
        toast.success('¡Todas las fotos se subieron con éxito!');
      } else {
        const errorText = await response.text();
        console.error('Error al recargar producto:', response.status, errorText);
        toast.dismiss();
        toast.error('Error al recargar las fotos. Por favor, recarga la página.');
      }
      
      // También llamar a onRefresh para actualizar la lista si es necesario
  onRefresh?.();
      
      // Limpiar el input de archivo
      e.target.value = '';
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || 'Algunas fotos no se pudieron subir.');
      console.error('Error al subir fotos:', error);
    }
  };

  const handleDeleteFoto = async (fotoId) => {
    try {
      const response = await fetch(`${API_URL}/fotos/${fotoId}/`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (response.ok) {
        toast.success('Foto eliminada.');
        
        // Recargar el producto para obtener las fotos actualizadas
        const productoResponse = await fetch(`${API_URL}/productos/${producto.id}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        if (productoResponse.ok) {
          const productoActualizado = await productoResponse.json();
          setFormData(prev => ({ ...prev, fotos: productoActualizado.fotos }));
        }
        
  onRefresh?.();
      } else {
        toast.error('Error al eliminar la foto.');
      }
    } catch (error) {
      toast.error('Error al eliminar la foto.');
      console.error('Error al eliminar foto:', error);
    }
  };

  const handleMarcarPrincipal = async (fotoId) => {
    if (!producto) return;
    
    toast.loading('Marcando foto como principal...');
    
    try {
      const response = await fetch(`${API_URL}/fotos/${fotoId}/marcar_principal/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (response.ok) {
        // Esperar un momento para que el servidor procese
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Recargar el producto para obtener las fotos actualizadas
        const productoResponse = await fetch(`${API_URL}/productos/${producto.id}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        
        if (productoResponse.ok) {
          const productoActualizado = await productoResponse.json();
          const fotosValidas = productoActualizado.fotos
            .filter(foto => foto.imagen && foto.imagen.trim() !== '')
            .map(foto => ({
              ...foto,
              imagen: foto.imagen || null
            }));
          setFormData(prev => ({ ...prev, fotos: fotosValidas }));
          toast.dismiss();
          toast.success('✅ Foto marcada como principal');
        } else {
          toast.dismiss();
          toast.error('Error al recargar las fotos.');
        }
        
        onRefresh();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.dismiss();
        toast.error(errorData.detail || 'Error al marcar foto como principal.');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Error al marcar foto como principal.');
      console.error('Error al marcar foto principal:', error);
    }
  };

  const handlePasteImage = async (e) => {
    e.preventDefault();
    const items = e.clipboardData?.items;
    if (!items || !producto) return;

    const imageFiles = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          imageFiles.push(blob);
        }
      }
    }

    if (imageFiles.length === 0) return;

    toast.loading('Subiendo fotos pegadas...');

    const uploadPromises = imageFiles.map(file => {
      const dataFoto = new FormData();
      dataFoto.append('producto', producto.id);
      dataFoto.append('imagen', file);
      
      return fetch(`${API_URL}/fotos/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` },
        body: dataFoto,
      }).then(response => {
        if (!response.ok) {
          throw new Error(`Error al subir imagen`);
        }
        return response.json();
      });
    });

    try {
      await Promise.all(uploadPromises);
      
      // Esperar un momento para que el servidor procese las imágenes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recargar el producto para obtener las fotos actualizadas con URLs correctas
      const response = await fetch(`${API_URL}/productos/${producto.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (response.ok) {
        const productoActualizado = await response.json();
        const fotosValidas = productoActualizado.fotos
          .filter(foto => foto.imagen && foto.imagen.trim() !== '')
          .map(foto => ({
            ...foto,
            imagen: foto.imagen || null
          }));
        console.log('Fotos recargadas (pegar):', fotosValidas);
        setFormData(prev => ({ ...prev, fotos: fotosValidas }));
        toast.dismiss();
        toast.success('¡Imágenes pegadas con éxito!');
      } else {
        toast.dismiss();
        toast.error('Error al recargar las fotos.');
      }
      
  onRefresh?.();
    } catch (error) {
      toast.dismiss();
      toast.error('Error al subir las imágenes pegadas.');
      console.error('Error al pegar imágenes:', error);
    }
  };

  const handleDropImage = async (e) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0 || !producto) return;

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) return;

    toast.loading('Subiendo imágenes...');

    const uploadPromises = imageFiles.map(file => {
      const dataFoto = new FormData();
      dataFoto.append('producto', producto.id);
      dataFoto.append('imagen', file);
      
      return fetch(`${API_URL}/fotos/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` },
        body: dataFoto,
      }).then(response => {
        if (!response.ok) {
          throw new Error(`Error al subir ${file.name}`);
        }
        return response.json();
      });
    });

    try {
      await Promise.all(uploadPromises);
      
      // Esperar un momento para que el servidor procese las imágenes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recargar el producto para obtener las fotos actualizadas con URLs correctas
      const response = await fetch(`${API_URL}/productos/${producto.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (response.ok) {
        const productoActualizado = await response.json();
        const fotosValidas = productoActualizado.fotos
          .filter(foto => foto.imagen && foto.imagen.trim() !== '')
          .map(foto => ({
            ...foto,
            imagen: foto.imagen || null
          }));
        console.log('Fotos recargadas (drag):', fotosValidas);
        setFormData(prev => ({ ...prev, fotos: fotosValidas }));
        toast.dismiss();
        toast.success('¡Imágenes subidas con éxito!');
      } else {
        toast.dismiss();
        toast.error('Error al recargar las fotos.');
      }
      
  onRefresh?.();
    } catch (error) {
      toast.dismiss();
      toast.error('Error al subir las imágenes.');
      console.error('Error al subir imágenes:', error);
    }
  };

  const handleAddReferencia = async (e) => {
    if (!producto) {
      toast.error('Debe crear el producto primero para agregar referencias');
      return;
    }
    e.preventDefault();
    const data = { ...nuevaReferencia, producto: producto.id };
    await fetch(`${API_URL}/numeros-parte/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json','Authorization': `Token ${token}` },
      body: JSON.stringify(data),
    });
    setNuevaReferencia({ marca: '', numero_de_parte: '' });
  onRefresh?.();
  };

  const handleDeleteReferencia = async (id) => {
    await fetch(`${API_URL}/numeros-parte/${id}/`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Token ${token}` }
    });
    toast.success('Referencia eliminada.');
  onRefresh?.();
  };

  const handleAddAplicacion = async (e) => {
    if (!producto) {
      toast.error('Debe crear el producto primero para agregar aplicaciones');
      return;
    }
    e.preventDefault();
    
    // Validación básica en el frontend - ambos campos son requeridos
    const marca = nuevaAplicacion.marca_vehiculo || '';
    const modelo = (nuevaAplicacion.modelo_vehiculo || '').trim();
    
    if (!marca) {
      toast.error('La marca del vehículo es requerida.');
      return;
    }
    
    if (!modelo) {
      toast.error('El modelo del vehículo es requerido.');
      return;
    }
    
    // Validar años
    const anoDesde = nuevaAplicacion.ano_desde ? parseInt(nuevaAplicacion.ano_desde) : null;
    const anoHasta = nuevaAplicacion.ano_hasta ? parseInt(nuevaAplicacion.ano_hasta) : null;
    
    if (anoDesde && anoHasta && anoDesde > anoHasta) {
      toast.error('El año "Desde" no puede ser mayor que el año "Hasta".');
      return;
    }
    
    // Preparar datos - convertir strings vacíos a null/undefined
    const data = {
      producto: producto.id,
      marca_vehiculo: marca && marca !== '' ? parseInt(marca) : null,
      modelo_vehiculo: modelo || '',
      cilindrada: nuevaAplicacion.cilindrada && nuevaAplicacion.cilindrada !== '' ? parseFloat(nuevaAplicacion.cilindrada) : null,
      cantidad_cilindros: nuevaAplicacion.cantidad_cilindros && nuevaAplicacion.cantidad_cilindros !== '' ? parseInt(nuevaAplicacion.cantidad_cilindros) : null,
      detalle_motor: nuevaAplicacion.detalle_motor || '',
      ano_desde: anoDesde || null,
      ano_hasta: anoHasta || null,
      cantidad_valvulas: nuevaAplicacion.cantidad_valvulas && nuevaAplicacion.cantidad_valvulas !== '' ? parseInt(nuevaAplicacion.cantidad_valvulas) : 1
    };
    
    try {
      const response = await fetch(`${API_URL}/aplicaciones/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        // Extraer mensajes de error del backend
        let errorMessage = 'Error al agregar la aplicación.';
        if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0];
        } else if (errorData.marca_vehiculo) {
          errorMessage = `Marca: ${errorData.marca_vehiculo[0]}`;
        } else if (errorData.modelo_vehiculo) {
          errorMessage = `Modelo: ${errorData.modelo_vehiculo[0]}`;
        } else if (errorData.ano_desde) {
          errorMessage = `Año Desde: ${errorData.ano_desde[0]}`;
        } else {
          // Mostrar el primer error que encuentre
          const firstError = Object.values(errorData)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          } else {
            errorMessage = JSON.stringify(errorData);
          }
        }
        toast.error(errorMessage);
        return;
      }
      
      toast.success('Aplicación agregada exitosamente.');
      setNuevaAplicacion({ marca_vehiculo: '', modelo_vehiculo: '', cilindrada: '', cantidad_cilindros: '', detalle_motor: '', ano_desde: '', ano_hasta: '', cantidad_valvulas: '' });
  onRefresh?.();
    } catch (error) {
      console.error('Error al agregar aplicación:', error);
      toast.error('Error al agregar la aplicación. Por favor, intente nuevamente.');
    }
  };

  const buscarAplicacionesExistentes = async () => {
    setCargandoAplicaciones(true);
    try {
      const params = new URLSearchParams();
      if (buscaModeloExistente) params.append('search', buscaModeloExistente);
      if (buscaMarcaExistente) params.append('marca_vehiculo', buscaMarcaExistente);
      const url = `${API_URL}/aplicaciones/?${params.toString()}`;
      const resp = await fetch(url);
      const data = await resp.json().catch(() => ({}));
      const items = Array.isArray(data) ? data : (data.results || []);
      setResultadosAplicaciones(items.slice(0, 25)); // limitar para UI
    } catch (e) {
      console.error('Error buscando aplicaciones existentes:', e);
      toast.error('No se pudieron cargar aplicaciones.');
    } finally {
      setCargandoAplicaciones(false);
    }
  };

  const handleAgregarAplicacionExistente = async (aplicacion) => {
    if (!producto) {
      toast.error('Primero guarda el producto.');
      return;
    }
    // Evitar duplicados básicos por marca+modelo en el mismo producto
    const marcaIdAplicacion = aplicacion.marca_vehiculo_id || aplicacion.marca_vehiculo;
    const yaExiste = (formData.aplicaciones || []).some(a => {
      const aMarcaId = a.marca_vehiculo_id || a.marca_vehiculo;
      return String(aMarcaId) === String(marcaIdAplicacion) && String(a.modelo_vehiculo).trim().toLowerCase() === String(aplicacion.modelo_vehiculo).trim().toLowerCase();
    });
    if (yaExiste) {
      toast('Ya existe una aplicación con esa Marca y Modelo en este producto.');
      return;
    }
    try {
      const payload = {
        producto: producto.id,
        marca_vehiculo: marcaIdAplicacion,
        modelo_vehiculo: aplicacion.modelo_vehiculo,
        cilindrada: aplicacion.cilindrada ?? null,
        cantidad_cilindros: aplicacion.cantidad_cilindros ?? null,
        detalle_motor: aplicacion.detalle_motor || '',
        ano_desde: aplicacion.ano_desde ?? null,
        ano_hasta: aplicacion.ano_hasta ?? null,
        cantidad_valvulas: aplicacion.cantidad_valvulas ?? 1
      };
      const resp = await fetch(`${API_URL}/aplicaciones/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || 'No se pudo añadir la aplicación existente');
      }
      toast.success('Aplicación añadida');
      // Refrescar lista local de aplicaciones del producto
      try {
        const productoResp = await fetch(`${API_URL}/productos/${producto.id}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        if (productoResp.ok) {
          const productoActualizado = await productoResp.json();
          setFormData(prev => ({ ...prev, aplicaciones: productoActualizado.aplicaciones }));
        }
      } catch {}
      onRefresh?.();
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Error al añadir aplicación');
    }
  };

  const handleDeleteAplicacion = async (id) => {
    await fetch(`${API_URL}/aplicaciones/${id}/`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Token ${token}` }
    });
    toast.success('Aplicación eliminada.');
    onRefresh?.();
  };

  // Fallback interno para eliminar producto si no se pasa onDelete desde el padre
  const handleDeleteProducto = async () => {
    if (!producto) return;
    const confirmar = window.confirm(`¿Seguro que deseas eliminar el producto ${producto.codigo_interno}? Esta acción no se puede deshacer.`);
    if (!confirmar) return;
    try {
      const res = await fetch(`${API_URL}/productos/${producto.id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || 'No se pudo eliminar el producto');
      }
      toast.success('Producto eliminado');
      onClose?.();
      onRefresh?.();
    } catch (e) {
      toast.error(e.message || 'Error al eliminar el producto');
    }
  };

  const renderCamposEspecificos = () => {
    const config = CAMPOS_POR_TIPO[formData.tipo_producto] || CAMPOS_POR_TIPO.VALVULA;
    
    return (
      <div className="form-grid">
        {config.campos.map(campo => (
          <div key={campo.name}>
            <label>{campo.label}:</label>
            {campo.type === 'select' ? (
              <select
                name={campo.name}
                value={formData.especificaciones[campo.name] || ''}
                onChange={handleSpecChange}
              >
                {campo.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : campo.type === 'textarea' ? (
              <textarea
                name={campo.name}
                value={formData.especificaciones[campo.name] || ''}
                onChange={handleSpecChange}
                rows="3"
              />
            ) : (
              <input
                name={campo.name}
                type={campo.type}
                step={campo.step || (campo.type === 'number' ? '0.01' : undefined)}
                value={formData.especificaciones[campo.name] || ''}
                onChange={handleSpecChange}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const titulo = modoCrear ? 'Crear Nuevo Producto' : `Editar Producto: ${producto?.codigo_interno}`;

  return (
    <div className="modal-overlay">
      <div ref={modalRef} className="modal-content large">
        <h2>{titulo}</h2>
        
        {!modoCrear && (
          <div className="modal-tabs">
            <button onClick={() => setActiveTab('datos')} className={`modal-tab-button ${activeTab === 'datos' ? 'active' : ''}`}>Datos y Fotos</button>
            <button onClick={() => setActiveTab('referencias')} className={`modal-tab-button ${activeTab === 'referencias' ? 'active' : ''}`}>Números de Parte</button>
            <button onClick={() => setActiveTab('aplicaciones')} className={`modal-tab-button ${activeTab === 'aplicaciones' ? 'active' : ''}`}>Aplicaciones</button>
          </div>
        )}

        {activeTab === 'datos' && (
          <div className="tab-content">
            <form className="edit-form">
              <h4>Datos Generales</h4>
              <div className="form-grid">
                <div>
                  <label>Tipo de Producto:</label>
                  {modoCrear ? (
                    <select name="tipo_producto" value={formData.tipo_producto || 'VALVULA'} onChange={handleChange}>
                      <option value="VALVULA">Válvula</option>
                      <option value="GUIA_VALVULA">Guía Válvula</option>
                      <option value="FILTRO">Filtro</option>
                      <option value="BUJIA">Bujía</option>
                      <option value="CABLE">Cable</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  ) : (
                    <input type="text" value={formData.tipo_producto} readOnly style={{background:'#eee'}} />
                  )}
                </div>
                {modoCrear && formData.tipo_producto === 'VALVULA' && (
                  <>
                    <div>
                      <label>Marca (para generar código):</label>
                      <select value={marcaIdParaCodigo} onChange={(e) => setMarcaIdParaCodigo(e.target.value)}>
                        <option value="">-- Seleccione --</option>
                        {Array.isArray(marcas) && marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>Código Interno:</label>
                      <input name="codigo_interno" type="text" value={formData.codigo_interno || ''} readOnly />
                    </div>
                  </>
                )}
                {modoCrear && formData.tipo_producto !== 'VALVULA' && (
                  <div>
                    <label>Código Interno:</label>
                    <input name="codigo_interno" type="text" value={formData.codigo_interno || ''} onChange={handleChange} required />
                  </div>
                )}
                <div><label>Stock:</label><input name="stock" type="number" value={formData.stock || ''} onChange={handleChange} /></div>
                <div><label>Stock Mínimo:</label><input name="stock_minimo" type="number" value={formData.stock_minimo || ''} onChange={handleChange} /></div>
                {user && user.groups.includes('Administrador') && (
                  <>
                    <div><label>Precio Costo:</label><input name="precio_costo" type="number" step="0.01" value={formData.precio_costo || ''} onChange={handleChange} /></div>
                    <div><label>Precio Venta:</label><input name="precio_venta" type="number" step="0.01" value={formData.precio_venta || ''} onChange={handleChange} /></div>
                  </>
                )}
                        <div>
                          <label>Peso (g):</label>
                          <input
                            name="peso"
                            type="number"
                            step="0.01"
                            placeholder="Opcional"
                            value={formData.peso ?? ''}
                            onChange={handleChange}
                          />
                        </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Observaciones:</label>
                  <textarea name="observaciones" value={formData.observaciones || ''} onChange={handleChange} rows="3" />
                </div>
              </div>
              <hr />
              
              <h4>Especificaciones de {CAMPOS_POR_TIPO[formData.tipo_producto]?.titulo || 'Producto'}</h4>
              {renderCamposEspecificos()}
              
              {!modoCrear && (
                <>
                  <hr />
                  <h4>Fotos</h4>
                  <div className="fotos-actuales">
                    {formData.fotos && formData.fotos.length > 0 ? (
                      formData.fotos.map(foto => (
                        <div key={foto.id} className="foto-container">
                          {foto.imagen && foto.imagen.trim() !== '' ? (
                            <img 
                              src={foto.imagen} 
                              alt="Miniatura" 
                              onError={(e) => {
                                console.error('Error cargando imagen:', foto.imagen, foto);
                                e.target.style.display = 'none';
                                const errorDiv = e.target.parentElement.querySelector('.error-message');
                                if (errorDiv) errorDiv.style.display = 'block';
                              }} 
                            />
                          ) : (
                            <div className="error-message" style={{padding: '20px', textAlign: 'center', color: '#999'}}>
                              Sin imagen
                            </div>
                          )}
                          <div className="error-message" style={{display: 'none', padding: '20px', textAlign: 'center', color: '#999', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}}>
                            Error al cargar
                          </div>
                          <div style={{position: 'absolute', top: '5px', right: '5px', display: 'flex', gap: '5px', zIndex: 10}}>
                          {foto.es_principal && (
                            <span style={{
                              background: '#4CAF50',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}>PRINCIPAL</span>
                          )}
                          {!foto.es_principal && (
                            <button 
                              type="button" 
                              className="set-principal-btn"
                              onClick={() => handleMarcarPrincipal(foto.id)}
                              style={{
                                background: '#2196F3',
                                color: 'white',
                                border: 'none',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '10px',
                                cursor: 'pointer'
                              }}
                              title="Marcar como principal"
                            >
                              ⭐ Principal
                            </button>
                          )}
                          <button type="button" className="delete-foto-btn" onClick={() => handleDeleteFoto(foto.id)}>X</button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{gridColumn: '1 / -1', textAlign: 'center', color: '#999', padding: '20px'}}>
                        No hay fotos cargadas
                      </div>
                    )}
                  </div>
                  <div 
                    style={{
                      border: '2px dashed #ccc',
                      borderRadius: '8px',
                      padding: '20px',
                      textAlign: 'center',
                      backgroundColor: '#f9f9f9',
                      cursor: 'pointer'
                    }}
                    onPaste={handlePasteImage}
                    onDrop={handleDropImage}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={(e) => e.preventDefault()}
                  >
                    <p style={{margin: '0 0 10px 0', color: '#666'}}>
                      📋 Pega imágenes aquí (Ctrl+V) o arrastra archivos
                    </p>
                    <input 
                      name="fotos" 
                      type="file" 
                      multiple 
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{marginTop: '10px'}}
                    />
                  </div>
                </>
              )}
            </form>
          </div>
        )}

        {!modoCrear && activeTab === 'referencias' && (
          <div className="tab-content">
            <h4>Referencias Existentes</h4>
            <ul className="related-list">
              {formData.numeros_de_parte && formData.numeros_de_parte.map(part => (
                <li key={part.id}>
                  <span>{part.marca} - {part.numero_de_parte}</span>
                  <button onClick={() => handleDeleteReferencia(part.id)}>Borrar</button>
                </li>
              ))}
            </ul><hr />
            <h4>Añadir Nueva Referencia</h4>
            <form onSubmit={handleAddReferencia} className="add-form">
              <input name="marca" type="text" placeholder="Marca (ej: TRW)" value={nuevaReferencia.marca} onChange={handleNuevaReferenciaChange} required />
              <input name="numero_de_parte" type="text" placeholder="Código" value={nuevaReferencia.numero_de_parte} onChange={handleNuevaReferenciaChange} required />
              <button type="submit">Añadir</button>
            </form>
          </div>
        )}

        {!modoCrear && activeTab === 'aplicaciones' && (
          <div className="tab-content">
            <h4>Aplicaciones Existentes</h4>
            <ul className="related-list">
              {formData.aplicaciones && formData.aplicaciones.map(app => (
                <li key={app.id}>
                  <span>{`${app.marca_vehiculo_nombre} ${app.modelo_vehiculo}`}</span>
                  <button onClick={() => handleDeleteAplicacion(app.id)}>Borrar</button>
                </li>
              ))}
            </ul><hr />
            <h4>Agregar desde catálogo</h4>
            <div className="catalogo-aplicaciones-busqueda" style={{display:'grid', gap:'8px', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))'}}>
              <select value={buscaMarcaExistente} onChange={(e)=>setBuscaMarcaExistente(e.target.value)}>
                <option value="">-- Marca --</option>
                {Array.isArray(marcas) && marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
              <input type="text" placeholder="Modelo contiene..." value={buscaModeloExistente} onChange={(e)=>setBuscaModeloExistente(e.target.value)} />
              <button type="button" onClick={buscarAplicacionesExistentes} disabled={cargandoAplicaciones}>
                {cargandoAplicaciones ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            <div className="resultados-aplicaciones" style={{marginTop:'10px'}}>
              {resultadosAplicaciones.length === 0 && !cargandoAplicaciones && <p style={{color:'#666'}}>Sin resultados (ajusta filtros).</p>}
              {resultadosAplicaciones.length > 0 && (
                <table style={{width:'100%', fontSize:'0.85rem'}}>
                  <thead>
                    <tr>
                      <th>Marca</th>
                      <th>Modelo</th>
                      <th>Años</th>
                      <th>Cil.</th>
                      <th>Motor</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultadosAplicaciones.map(app => (
                      <tr key={app.id}>
                        <td>{app.marca_vehiculo_nombre || app.marca_vehiculo}</td>
                        <td>{app.modelo_vehiculo}</td>
                        <td>{app.ano_desde || app.ano_hasta ? `${app.ano_desde || '?'}-${app.ano_hasta || '?'}` : '—'}</td>
                        <td>{app.cantidad_cilindros || '—'}</td>
                        <td>{app.detalle_motor || '—'}</td>
                        <td>
                          <button type="button" onClick={()=>handleAgregarAplicacionExistente(app)} title="Agregar al producto">➕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <hr />
            <h4>Añadir Nueva Aplicación</h4>
            <form onSubmit={handleAddAplicacion} className="add-form">
              <select name="marca_vehiculo" value={nuevaAplicacion.marca_vehiculo} onChange={handleNuevaAplicacionChange} required>
                <option value="">-- Marca * --</option>
                {Array.isArray(marcas) && marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
              <input name="modelo_vehiculo" type="text" placeholder="Modelo Vehículo *" value={nuevaAplicacion.modelo_vehiculo} onChange={handleNuevaAplicacionChange} required />
              <small style={{gridColumn: '1 / -1', color: '#666', fontSize: '0.85em'}}>
                * Marca y Modelo son campos requeridos. Los demás campos son opcionales.
              </small>
              <input name="detalle_motor" type="text" placeholder="Detalle Motor (ej: Zetec)" value={nuevaAplicacion.detalle_motor} onChange={handleNuevaAplicacionChange} />
              <input name="cilindrada" type="number" step="0.1" placeholder="Cilindrada (ej: 1.6)" value={nuevaAplicacion.cilindrada} onChange={handleNuevaAplicacionChange} />
              <input name="cantidad_cilindros" type="number" placeholder="N° Cilindros" value={nuevaAplicacion.cantidad_cilindros} onChange={handleNuevaAplicacionChange} />
              <input name="ano_desde" type="number" placeholder="Año Desde" value={nuevaAplicacion.ano_desde} onChange={handleNuevaAplicacionChange} />
              <input name="ano_hasta" type="number" placeholder="Año Hasta" value={nuevaAplicacion.ano_hasta} onChange={handleNuevaAplicacionChange} />
              <input name="cantidad_valvulas" type="number" placeholder="Cant. Válvulas" value={nuevaAplicacion.cantidad_valvulas} onChange={handleNuevaAplicacionChange} />
              <button type="submit">Añadir Aplicación</button>
            </form>
          </div>
        )}

        <div className="modal-actions">
          {!modoCrear && (
            <button type="button" className="btn btn-danger" onClick={() => (typeof onDelete === 'function' ? onDelete(producto.id) : handleDeleteProducto())}>
              Eliminar Producto
            </button>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={handleGlobalSave}>
              {modoCrear ? 'Crear Producto' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalEditarProducto;

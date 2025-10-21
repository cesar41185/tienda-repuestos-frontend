// En src/context/CarritoContext.jsx
import { createContext, useState, useContext, useEffect } from 'react'; 
import toast from 'react-hot-toast';
import API_URL, { JUEGO_UNIDADES } from '../apiConfig';
// 1. Creamos el Contexto
const CarritoContext = createContext();

// 2. Creamos un "Hook" personalizado para usar el contexto más fácilmente
export const useCarrito = () => useContext(CarritoContext);

// 3. Creamos el Proveedor del contexto, que contendrá toda la lógica
export const CarritoProvider = ({ children }) => {
  const [carrito, setCarrito] = useState(() => {
    try {
      const carritoGuardado = localStorage.getItem('carrito');
      return carritoGuardado ? JSON.parse(carritoGuardado) : [];
    } catch (error) {
      console.error("Error al cargar el carrito de localStorage", error);
      return [];
    }
  });
  const [clienteActivo, setClienteActivo] = useState(null);



  // 3. Este useEffect se ejecuta cada vez que el estado 'carrito' cambia.
  useEffect(() => {
    // Guarda el estado actual del carrito en localStorage.
    localStorage.setItem('carrito', JSON.stringify(carrito));
  }, [carrito]);

  const agregarAlCarrito = (producto, cantidadDeJuegos) => {
    // --- LÓGICA MODIFICADA ---
    const cantidadTotalUnidades = cantidadDeJuegos * JUEGO_UNIDADES;

    setCarrito(prevCarrito => {
      const itemExistente = prevCarrito.find(item => item.id === producto.id);
      if (itemExistente) {
        return prevCarrito.map(item =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + cantidadTotalUnidades } : item
        );
      }
      return [...prevCarrito, { ...producto, cantidad: cantidadTotalUnidades }];
    });
    toast.success(`${cantidadDeJuegos} juego(s) de ${producto.codigo_interno} añadido(s) al carrito!`);
  };


  const eliminarDelCarrito = (productoId) => {
    setCarrito(prevCarrito => prevCarrito.filter(item => item.id !== productoId));
    toast.error('Producto eliminado del carrito');
  };

  const actualizarCantidad = (productoId, nuevaCantidadUnidades) => {
    const cantidadFinal = Math.max(1, nuevaCantidadUnidades);
    setCarrito(prevCarrito =>
      prevCarrito.map(item =>
        item.id === productoId ? { ...item, cantidad: cantidadFinal } : item
      )
    );
  };

  const actualizarCantidadJuegos = (productoId, nuevaCantidadJuegos) => {
    const cantidadTotalUnidades = Math.max(1, nuevaCantidadJuegos) * JUEGO_UNIDADES;
    actualizarCantidad(productoId, cantidadTotalUnidades);
  };

  const limpiarCarrito = () => {
    setCarrito([]);
  };

  const seleccionarCliente = (cliente) => {
        setClienteActivo(cliente);
        toast.success(`Iniciando venta para: ${cliente.perfil.nombre_completo || cliente.username}`);
    };

    const limpiarCliente = () => {
        setClienteActivo(null);
    };

  const finalizarCompra = async (token) => {
    const ventaData = {
        detalles: carrito.map(item => ({
            producto: item.id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_venta
        }))
    };
    if (clienteActivo) {
      ventaData.usuario_id = clienteActivo.pk;
    }
    // Si no hay token, no se puede continuar.
    if (!token) {
      toast.error('Debes iniciar sesión para comprar.');
      return false;
    }
    
    try {
      toast.loading('Procesando venta...');
      const response = await fetch(`${API_URL}/ventas/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}` // <-- 2. Añade el token aquí
        },
        body: JSON.stringify(ventaData)
      });
             
        toast.dismiss();
        if (!response.ok) {
          // Leemos el error del backend para dar un mensaje más claro
          const errorData = await response.json();
          const errorMessage = errorData.non_field_errors?.[0] || 'No se pudo procesar la venta.';
          throw new Error(errorMessage);
        }
        toast.success('¡Venta realizada con éxito!');
        limpiarCarrito(); // Vaciamos el carrito
        // Nota: ya no es necesario recargar las válvulas desde aquí.
        return true; // Indica que la compra fue exitosa
    } catch (error) {
        toast.dismiss();
        toast.error(error.message);
        return false; // Indica que la compra falló
    }
    if(response.ok) {
        limpiarCliente();
    }
  };

  // Pasamos el estado y las funciones a todos los componentes hijos
  const value = {
    carrito,
    agregarAlCarrito,
    eliminarDelCarrito,
    actualizarCantidad,
    actualizarCantidadJuegos,
    limpiarCarrito,
    finalizarCompra, // <-- Añadido aquí
    clienteActivo,      // <-- EXPORTA
    seleccionarCliente, // <-- EXPORTA
    limpiarCliente      // <-- EXPORTA
  };

  return (
    <CarritoContext.Provider value={value}>
      {children}
    </CarritoContext.Provider>
  );
};
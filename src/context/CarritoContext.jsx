// En src/context/CarritoContext.jsx
import { createContext, useState, useContext, useEffect } from 'react'; 
import toast from 'react-hot-toast';

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

  // 3. Este useEffect se ejecuta cada vez que el estado 'carrito' cambia.
  useEffect(() => {
    // Guarda el estado actual del carrito en localStorage.
    localStorage.setItem('carrito', JSON.stringify(carrito));
  }, [carrito]);

  const agregarAlCarrito = (producto, cantidad) => {
    setCarrito(prevCarrito => {
      const itemExistente = prevCarrito.find(item => item.id === producto.id);
      if (itemExistente) {
        return prevCarrito.map(item =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + cantidad } : item
        );
      }
      return [...prevCarrito, { ...producto, cantidad }];
    });
    toast.success(`${producto.codigo_interno} añadido al carrito!`);
  };


  const eliminarDelCarrito = (productoId) => {
    setCarrito(prevCarrito => prevCarrito.filter(item => item.id !== productoId));
    toast.error('Producto eliminado del carrito');
  };

  const actualizarCantidad = (productoId, nuevaCantidad) => {
    const cantidadFinal = Math.max(1, nuevaCantidad);
    setCarrito(prevCarrito =>
      prevCarrito.map(item =>
        item.id === productoId ? { ...item, cantidad: cantidadFinal } : item
      )
    );
  };

  const limpiarCarrito = () => {
    setCarrito([]);
  };

  const finalizarCompra = async () => {
    const ventaData = {
        detalles: carrito.map(item => ({
            valvula: item.id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_venta
        }))
    };

    try {
        toast.loading('Procesando venta...');
        const response = await fetch('http://192.168.1.55:8000/api/ventas/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ventaData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            // Mostramos el error que viene del backend (ej: "No hay stock...")
            throw new Error(errorData.non_field_errors?.[0] || 'Error al procesar la venta.');
        }
        
        toast.dismiss();
        toast.success('¡Venta realizada con éxito!');
        limpiarCarrito(); // Vaciamos el carrito
        // Nota: ya no es necesario recargar las válvulas desde aquí.
        return true; // Indica que la compra fue exitosa
    } catch (error) {
        toast.dismiss();
        toast.error(error.message);
        return false; // Indica que la compra falló
    }
  };

  // Pasamos el estado y las funciones a todos los componentes hijos
  const value = {
    carrito,
    agregarAlCarrito,
    eliminarDelCarrito,
    actualizarCantidad,
    limpiarCarrito,
    finalizarCompra // <-- Añadido aquí
  };

  return (
    <CarritoContext.Provider value={value}>
      {children}
    </CarritoContext.Provider>
  );
};
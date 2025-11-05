import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../apiConfig';
import toast from 'react-hot-toast';

function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setCargando(true);
        const response = await fetch(`${API_URL}/dashboard/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('No se pudieron cargar las estadísticas');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    if (token) {
      fetchStats();
    }
  }, [token]);

  if (cargando) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: '#dc3545' }}>Error: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Función para formatear moneda
  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(valor);
  };

  // Función para generar PDF de productos bajo stock
  const handleImprimirBajoStock = async () => {
    if (!token) {
      toast.error('Debes iniciar sesión para generar el PDF.');
      return;
    }

    try {
      toast.loading('Generando PDF de productos bajo stock...');
      
      const response = await fetch(`${API_URL}/productos/imprimir_bajo_stock/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          toast.error('No tienes permisos para generar el PDF. Solo administradores.');
        } else {
          toast.error('Error al generar el PDF.');
        }
        return;
      }

      // Obtener el blob del PDF
      const blob = await response.blob();
      
      // Crear un enlace temporal para descargar el archivo
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      
      // Obtener el nombre del archivo del header Content-Disposition o usar uno por defecto
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'productos_bajo_stock.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      } else {
        // Si no hay header, usar fecha actual
        const fecha = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        filename = `productos_bajo_stock_${fecha}.pdf`;
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.dismiss();
      toast.success('PDF generado y descargado exitosamente');
    } catch (error) {
      toast.dismiss();
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el PDF de productos bajo stock.');
    }
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-titulo">Dashboard</h1>
      
      {/* CARDS DE RESÚMEN */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-icon" style={{ backgroundColor: '#28a745' }}>
            📦
          </div>
          <div className="dashboard-card-content">
            <h3>Total Productos</h3>
            <p className="dashboard-card-number">{stats.resumen.total_productos}</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon" style={{ backgroundColor: '#007bff' }}>
            👥
          </div>
          <div className="dashboard-card-content">
            <h3>Total Clientes</h3>
            <p className="dashboard-card-number">{stats.resumen.total_clientes}</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon" style={{ backgroundColor: '#17a2b8' }}>
            🛒
          </div>
          <div className="dashboard-card-content">
            <h3>Total Ventas</h3>
            <p className="dashboard-card-number">{stats.resumen.total_ventas}</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon" style={{ backgroundColor: '#ffc107' }}>
            ⏳
          </div>
          <div className="dashboard-card-content">
            <h3>Pendientes</h3>
            <p className="dashboard-card-number">{stats.resumen.ventas_pendientes}</p>
          </div>
        </div>

        <div 
          className="dashboard-card" 
          style={{ cursor: 'pointer' }}
          onClick={handleImprimirBajoStock}
          title="Click para generar PDF de productos bajo stock"
        >
          <div className="dashboard-card-icon" style={{ backgroundColor: '#ac1b1b' }}>
            ⚠️
          </div>
          <div className="dashboard-card-content">
            <h3>Bajo Stock</h3>
            <p className="dashboard-card-number">{stats.resumen.productos_bajo_stock}</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon" style={{ backgroundColor: '#6c757d' }}>
            📄
          </div>
          <div className="dashboard-card-content">
            <h3>Comprobantes Pend.</h3>
            <p className="dashboard-card-number">{stats.resumen.comprobantes_pendientes}</p>
          </div>
        </div>
      </div>

      {/* VENTAS ESTE MES Y ESTA SEMANA */}
      <div className="dashboard-ventas-container">
        <div className="dashboard-venta-card">
          <h2>Ventas Este Mes</h2>
          <p className="dashboard-venta-total">{formatearMoneda(stats.ventas.este_mes.total)}</p>
          <p className="dashboard-venta-cantidad">{stats.ventas.este_mes.cantidad} pedidos</p>
        </div>

        <div className="dashboard-venta-card">
          <h2>Ventas Esta Semana</h2>
          <p className="dashboard-venta-total">{formatearMoneda(stats.ventas.esta_semana.total)}</p>
          <p className="dashboard-venta-cantidad">{stats.ventas.esta_semana.cantidad} pedidos</p>
        </div>
      </div>

      {/* GRÁFICO DE VENTAS POR MES */}
      <div className="dashboard-grafico-container">
        <h2>Ventas por Mes (Últimos 6 meses)</h2>
        <div className="dashboard-grafico">
          {stats.ventas.por_mes.map((mes, index) => {
            const alturaMaxima = 200; // Altura máxima del gráfico en píxeles
            const maxTotal = Math.max(...stats.ventas.por_mes.map(m => m.total), 1);
            const altura = (mes.total / maxTotal) * alturaMaxima;
            
            return (
              <div key={index} className="dashboard-barra-container">
                <div 
                  className="dashboard-barra"
                  style={{
                    height: `${altura}px`,
                    backgroundColor: '#ac1b1b'
                  }}
                >
                  <div className="dashboard-barra-valor">
                    {formatearMoneda(mes.total)}
                  </div>
                </div>
                <p className="dashboard-barra-label">{mes.nombre}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOP PRODUCTOS */}
      <div className="dashboard-top-productos">
        <h2>Top 5 Productos Más Vendidos (Este Mes)</h2>
        {stats.top_productos.length > 0 ? (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Posición</th>
                <th>Código</th>
                <th>Cantidad Vendida</th>
                <th>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {stats.top_productos.map((producto, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td><strong>{producto.producto__codigo_interno}</strong></td>
                  <td>{producto.total_vendido} unidades</td>
                  <td>{formatearMoneda(parseFloat(producto.ingresos))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
            No hay productos vendidos este mes todavía.
          </p>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;

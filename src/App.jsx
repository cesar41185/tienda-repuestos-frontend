// En src/App.jsx
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Importación de Componentes
import Header from './components/Header';
import PasswordChangeBanner from './components/PasswordChangeBanner';
import ProtectedRoute from './components/ProtectedRoute';

// Importación de Páginas
import HomePage from './pages/HomePage';
import TiendaPage from './pages/TiendaPage';
import CarritoPage from './pages/CarritoPage';
import ProductoPage from './pages/ProductoPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PerfilPage from './pages/PerfilPage';
import MisPedidosPage from './pages/MisPedidosPage';
import GestorMarcasPage from './pages/GestorMarcasPage';
import ListaClientesPage from './pages/ListaClientesPage';
import DetallePedidoPage from './pages/DetallePedidoPage';
import GestionPedidosPage from './pages/GestionPedidosPage';
import GestionDetallePedidoPage from './pages/GestionDetallePedidoPage';
import DashboardPage from './pages/DashboardPage';
import DevolucionesPage from './pages/DevolucionesPage'; 

function App() {
  return (
    <div className="app-container">
      <Toaster position="top-right" />
      <Header />
      <PasswordChangeBanner />
      <main>
        <Routes>
          {/* --- Rutas Públicas --- */}
          <Route path="/" element={<HomePage />} />
          <Route path="/tienda" element={<TiendaPage />} />
          <Route path="/carrito" element={<CarritoPage />} />
          <Route path="/producto/:id" element={<ProductoPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />

          {/* --- Rutas para Usuarios Autenticados --- */}
          <Route
            path="/mi-perfil"
            element={
              <ProtectedRoute> {/* <-- SIN 'roles', solo requiere login */}
                <PerfilPage />
              </ProtectedRoute>
          }
          />
           <Route
            path="/mis-pedidos"
            element={
              <ProtectedRoute> {/* <-- SIN 'roles', solo requiere login */}
                <MisPedidosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pedidos/:id"
            element={
              <ProtectedRoute> {/* <-- Quita la propiedad 'roles' de aquí */}
                <DetallePedidoPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/devoluciones"
            element={
              <ProtectedRoute>
                <DevolucionesPage />
              </ProtectedRoute>
            }
          />

          {/* --- Rutas Específicas por Rol --- */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['Administrador']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/clientes"
            element={
              <ProtectedRoute roles={['Administrador', 'Vendedor']}>
                <ListaClientesPage />
              </ProtectedRoute>
            }
          />
        
          <Route
            path="/gestor-marcas"
            element={
              <ProtectedRoute roles={['Administrador']}>
                <GestorMarcasPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gestion-pedidos"
            element={
              <ProtectedRoute roles={['Administrador', 'Vendedor', 'Cajero', 'Almacen']}>
                <GestionPedidosPage />
              </ProtectedRoute>
            }
          />
           <Route
              path="/gestion-pedidos/:id"
              element={
                <ProtectedRoute roles={['Administrador', 'Vendedor', 'Cajero', 'Almacen']}>
                  <GestionDetallePedidoPage />
                </ProtectedRoute>
              }
            />
        </Routes>
      </main>
    </div>
  );
}

export default App;
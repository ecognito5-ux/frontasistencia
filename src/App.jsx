import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLayout from './pages/AdminPages/AdminLayout';
import AdminDashboard from './pages/AdminPages/Dashboard';
import GestionUnificada from './pages/AdminPages/GestionUnificada';
import Geolocalizacion from './pages/AdminPages/Geolocalizacion';
import MiPerfil from './pages/AdminPages/MiPerfil';
import AreaLayout from './pages/AreaPages/AreaLayout';
import AreaDashboard from './pages/AreaPages/AreaDashboard';
import GestionTrabajadores from './pages/AreaPages/GestionTrabajadores';
import AsignacionControl from './pages/AreaPages/AsignacionControl';
import AreaHistorial from './pages/AreaPages/Historial';
import AreaMiPerfil from './pages/AreaPages/MiPerfil';
import WorkerLayout from './pages/WorkerPages/WorkerLayout';
import WorkerDashboard from './pages/WorkerPages/WorkerDashboard';
import Historial from './pages/WorkerPages/Historial';
import WorkerMiPerfil from './pages/WorkerPages/MiPerfil';

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Login único - redirige según rol */}
        <Route path="/" element={<Login />} />
        {/* Panel Admin protegido */}
        <Route path="/admin" element={<RequireAuth allowedRole="admin"><AdminLayout /></RequireAuth>}>
          <Route index element={<AdminDashboard />} />
          <Route path="gestion-unificada" element={<GestionUnificada />} />
          <Route path="geolocalizacion" element={<Geolocalizacion />} />
          <Route path="mi-perfil" element={<MiPerfil />} />
        </Route>
        {/* Panel Área protegido */}
        <Route path="/area" element={<RequireAuth allowedRole="area"><AreaLayout /></RequireAuth>}>
          <Route index element={<AreaDashboard />} />
          <Route path="dashboard" element={<AreaDashboard />} />
          <Route path="gestion-trabajadores" element={<GestionTrabajadores />} />
          <Route path="asignacion-control" element={<AsignacionControl />} />
          <Route path="historial" element={<AreaHistorial />} />
          <Route path="mi-perfil" element={<AreaMiPerfil />} />
        </Route>
        {/* Panel Trabajador protegido */}
        <Route path="/worker" element={<RequireAuth allowedRole="trabajador"><WorkerLayout /></RequireAuth>}>
          <Route index element={<WorkerDashboard />} />
          <Route path="dashboard" element={<WorkerDashboard />} />
          <Route path="mi-perfil" element={<WorkerMiPerfil />} />
          <Route path="historial" element={<Historial />} />
        </Route>
        {/* Ruta por defecto para páginas no encontradas */}
        <Route path="*" element={
          <div className="container mt-5 text-center">
            <div className="row justify-content-center">
              <div className="col-md-6">
                <h1 className="display-1 text-primary">404</h1>
                <h2 className="mb-4">Página no encontrada</h2>
                <p className="text-muted mb-4">
                  La página que buscas no existe o ha sido movida.
                </p>
                <a href="/" className="btn btn-primary">
                  <i className="bi bi-house me-2"></i>
                  Volver al inicio
                </a>
              </div>
            </div>
          </div>
        } />
      </Routes>
    </div>
  );
}

export default App;

function RequireAuth({ children, allowedRole }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token) return <Navigate to="/" replace />;
  if (allowedRole && role !== allowedRole) return <Navigate to="/" replace />;
  return children;
}

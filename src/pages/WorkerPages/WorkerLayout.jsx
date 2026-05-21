import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const WorkerLayout = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('userData') || '{}');
    setUserData(data);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <div className={`d-flex panel-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Sidebar */}
      <div className="panel-sidebar panel-sidebar-worker p-3">
        <h4 className="mb-4">
          <i className="bi bi-person-badge me-2"></i>
          Panel de Trabajador
        </h4>
        
        {/* Información del Trabajador */}
        <div className="mb-4 p-3 panel-user-card">
          <p className="mb-1 small text-muted">Trabajador</p>
          <p className="mb-0 fw-bold">{userData.nombre_completo}</p>
          <p className="mb-0 small">@{userData.username}</p>
          <hr className="my-2" />
          <p className="mb-1 small">
            <i className="bi bi-building me-1"></i>
            <strong>Área:</strong> {userData.area_descripcion}
          </p>
          <p className="mb-1 small">
            <i className="bi bi-person-check me-1"></i>
            <strong>Encargado:</strong> {userData.encargado_nombre}
          </p>
          <p className="mb-0 small">
            <i className="bi bi-award me-1"></i>
            <strong>Rol(es):</strong> {userData.roles_asignados || 'Sin rol'}
          </p>
        </div>

        {/* Navegación */}
        <ul className="nav flex-column panel-nav">
          <li className="nav-item mb-2">
            <Link to="/worker/dashboard" className="nav-link" onClick={() => setSidebarOpen(false)}>
              <i className="bi bi-speedometer2 me-2"></i>Panel de control
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/worker/mi-perfil" className="nav-link" onClick={() => setSidebarOpen(false)}>
              <i className="bi bi-person-gear me-2"></i>Mi Perfil
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/worker/historial" className="nav-link" onClick={() => setSidebarOpen(false)}>
              <i className="bi bi-calendar-check me-2"></i>Historial
            </Link>
          </li>
        </ul>

        {/* Botón Cerrar Sesión */}
        <div className="position-absolute bottom-0 mb-3">
          <button onClick={handleLogout} className="btn btn-outline-light btn-sm">
            <i className="bi bi-box-arrow-right me-2"></i>Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Overlay para cerrar */}
      <div className="sidebar-overlay d-lg-none" onClick={() => setSidebarOpen(false)}></div>

      {/* Main Content */}
      <div className="panel-main panel-main-worker">
        <button className="btn btn-outline-secondary d-lg-none mb-3" onClick={() => setSidebarOpen((v)=>!v)}>
          <i className="bi bi-list"></i>
        </button>
        <Outlet />
      </div>
    </div>
  );
};

export default WorkerLayout;



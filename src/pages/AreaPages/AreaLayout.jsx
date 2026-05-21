import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const AreaLayout = () => {
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
      <div className="panel-sidebar panel-sidebar-area p-3">
        <h4 className="mb-4">
          <i className="bi bi-building me-2"></i>
          Panel de Área
        </h4>
        
        <div className="mb-4 p-3 panel-user-card">
          <p className="mb-1 small text-muted">Encargado</p>
          <p className="mb-0 fw-bold">{userData.nombre_completo}</p>
          <p className="mb-0 small">@{userData.username}</p>
          <hr className="my-2" />
          <p className="mb-0 small">
            <i className="bi bi-geo-alt me-1"></i>
            {userData.area_descripcion}
          </p>
        </div>

        <ul className="nav flex-column panel-nav">
          <li className="nav-item mb-2">
            <Link to="/area/dashboard" className="nav-link" onClick={() => setSidebarOpen(false)}>
              <i className="bi bi-speedometer2 me-2"></i>Panel de control
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/area/gestion-trabajadores" className="nav-link" onClick={() => setSidebarOpen(false)}>
              <i className="bi bi-people-fill me-2"></i>Gestión de Trabajadores
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/area/asignacion-control" className="nav-link" onClick={() => setSidebarOpen(false)}>
              <i className="bi bi-list-task me-2"></i>Asignación de Control
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/area/historial" className="nav-link" onClick={() => setSidebarOpen(false)}>
              <i className="bi bi-clock-history me-2"></i>Historial de Asistencias
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/area/mi-perfil" className="nav-link" onClick={() => setSidebarOpen(false)}>
              <i className="bi bi-person-gear me-2"></i>Mi Perfil
            </Link>
          </li>
        </ul>

        <div className="position-absolute bottom-0 mb-3">
          <button onClick={handleLogout} className="btn btn-outline-light btn-sm">
            <i className="bi bi-box-arrow-right me-2"></i>Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Overlay */}
      <div className="sidebar-overlay d-lg-none" onClick={() => setSidebarOpen(false)}></div>

      {/* Main Content */}
      <div className="panel-main panel-main-area">
        <button className="btn btn-outline-secondary d-lg-none mb-3" onClick={() => setSidebarOpen((v)=>!v)}>
          <i className="bi bi-list"></i>
        </button>
        <Outlet />
      </div>
    </div>
  );
};

export default AreaLayout;

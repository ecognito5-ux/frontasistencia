import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';

const Sidebar = ({ onLogout, onNavigate }) => (
  <div className="panel-sidebar panel-sidebar-admin p-3" style={{ minHeight: '100vh' }}>
    <h4 className="mb-4">
      <i className="bi bi-shield-lock me-2"></i>
      Super Admin
    </h4>
    <ul className="nav flex-column panel-nav">
      <li className="nav-item mb-2">
        <Link to="/admin" className="nav-link" onClick={onNavigate}>
          <i className="bi bi-speedometer2 me-2"></i>Panel de control
        </Link>
      </li>
      <li className="nav-item mb-2">
        <Link to="/admin/gestion-unificada" className="nav-link" onClick={onNavigate}>
          <i className="bi bi-diagram-3-fill me-2"></i>Gestión Unificada
        </Link>
      </li>
      <li className="nav-item mb-2">
        <Link to="/admin/geolocalizacion" className="nav-link" onClick={onNavigate}>
          <i className="bi bi-geo-alt me-2"></i>Geolocalización
        </Link>
      </li>
      <li className="nav-item mb-2">
        <Link to="/admin/super-admins" className="nav-link" onClick={onNavigate}>
          <i className="bi bi-shield-plus me-2"></i>Super Admins
        </Link>
      </li>
      <li className="nav-item mb-2">
        <Link to="/admin/mi-perfil" className="nav-link" onClick={onNavigate}>
          <i className="bi bi-person-gear me-2"></i>Mi Perfil
        </Link>
      </li>
    </ul>
    <div className="mt-auto pt-4">
      <button onClick={onLogout} className="btn btn-outline-light btn-sm w-100">
        <i className="bi bi-box-arrow-right me-2"></i>Cerrar sesión
      </button>
    </div>
  </div>
);

const AdminLayout = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <div className={`d-flex panel-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar onLogout={handleLogout} onNavigate={() => setSidebarOpen(false)} />
      <div className="sidebar-overlay d-lg-none" onClick={() => setSidebarOpen(false)}></div>
      <div className="panel-main panel-main-admin">
        <button className="btn btn-outline-secondary d-lg-none mb-3" onClick={() => setSidebarOpen((v) => !v)}>
          <i className="bi bi-list"></i>
        </button>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;

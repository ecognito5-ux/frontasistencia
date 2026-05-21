import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const openModal = () => {
    setConfirmationText('');
    setFeedback(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (!loading) setShowModal(false);
  };

  const handlePurge = async () => {
    if (confirmationText !== 'BORRAR_TODO') return;
    try {
      setLoading(true);
      setFeedback(null);
      await apiService.adminPurge('BORRAR_TODO');
      setFeedback({ type: 'success', message: 'Base de datos limpiada (excepto super_admin).' });
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Error al limpiar la base de datos';
      setFeedback({ type: 'danger', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* Encabezado con gradiente */}
      <div
        className="p-4 p-md-5 text-white"
        style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #1e293b 60%, #0f172a 100%)',
          borderRadius: '0.5rem'
        }}
      >
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
          <div>
            <h2 className="mb-1">Panel del Super Admin</h2>
            <p className="mb-0 text-white-50">
              Control central del sistema, accesos rápidos y acciones críticas.
            </p>
          </div>
          <div className="d-flex gap-2">
            <Link to="/admin/gestion-unificada" className="btn btn-light">
              <i className="bi bi-diagram-3 me-2"></i> Gestión Unificada
            </Link>
            <Link to="/admin/geolocalizacion" className="btn btn-outline-light">
              <i className="bi bi-geo-alt me-2"></i> Geolocalización
            </Link>
            <Link to="/admin/super-admins" className="btn btn-outline-light">
              <i className="bi bi-shield-plus me-2"></i> Super Admins
            </Link>
            <button className="btn btn-danger" onClick={openModal}>
              <i className="bi bi-trash3 me-2"></i> Limpiar Base de Datos
            </button>
          </div>
        </div>
      </div>

      {/* Sección de tarjetas de atajos */}
      <div className="row g-3 mt-3">
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-uppercase text-muted mb-2">Áreas</h6>
                  <h3 className="mb-0">Gestión</h3>
                </div>
                <i className="bi bi-grid fs-1 text-primary"></i>
              </div>
              <p className="text-muted mt-3 mb-3">Administra las áreas laborales y sus roles.</p>
              <Link to="/admin/gestion-unificada" className="btn btn-primary btn-sm">
                Ir a Gestión
              </Link>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-uppercase text-muted mb-2">Ubicaciones</h6>
                  <h3 className="mb-0">Geolocalización</h3>
                </div>
                <i className="bi bi-geo-alt fs-1 text-success"></i>
              </div>
              <p className="text-muted mt-3 mb-3">Define zonas y radios de operación.</p>
              <Link to="/admin/geolocalizacion" className="btn btn-success btn-sm">
                Administrar
              </Link>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-uppercase text-muted mb-2">Seguridad</h6>
                  <h3 className="mb-0">Super Admins</h3>
                </div>
                <i className="bi bi-shield-plus fs-1 text-warning"></i>
              </div>
              <p className="text-muted mt-3 mb-3">Crea más cuentas de super administrador del sistema.</p>
              <Link to="/admin/super-admins" className="btn btn-warning btn-sm">
                Gestionar
              </Link>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-uppercase text-muted mb-2">Mantenimiento</h6>
                  <h3 className="mb-0">Limpieza</h3>
                </div>
                <i className="bi bi-broom fs-1 text-danger"></i>
              </div>
              <p className="text-muted mt-3 mb-3">Limpia datos no necesarios para pruebas.</p>
              <button className="btn btn-danger btn-sm" onClick={openModal}>
                Limpiar ahora
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showModal && (
        <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle me-2 text-danger"></i>
                  Acción destructiva: Limpiar Base de Datos
                </h5>
                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <p className="mb-2">
                  Esta acción eliminará todos los datos del sistema excepto la tabla <code>super_admin</code>.
                  No se puede deshacer.
                </p>
                <p className="mb-3">
                  Escribe <code>BORRAR_TODO</code> para confirmar.
                </p>
                <input
                  type="text"
                  className="form-control"
                  value={confirmationText}
                  placeholder="BORRAR_TODO"
                  onChange={(e) => setConfirmationText(e.target.value)}
                  disabled={loading}
                />
                {feedback && (
                  <div className={`alert alert-${feedback.type} mt-3 mb-0`} role="alert">
                    {feedback.message}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={loading}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handlePurge}
                  disabled={loading || confirmationText !== 'BORRAR_TODO'}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Limpiando...
                    </>
                  ) : (
                    'Sí, eliminar todo'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
import { useState, useEffect } from 'react';
import api from '../../services/api';

const MiPerfil = () => {
  const [correo, setCorreo] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [userData, setUserData] = useState({});

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        const { data } = await api.get('/trabajadores/me');
        const user = data.data || data;
        setUserData(user);
        setCorreo(user.correo || '');
      } catch (err) {
        setMessage({ type: 'danger', text: err.response?.data?.message || 'Error al cargar perfil' });
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, []);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);
    try {
      const payload = { correo: correo.trim() || null };
      if (passwordForm.newPassword && passwordForm.newPassword.trim()) {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
          setMessage({ type: 'danger', text: 'Las contraseñas nuevas no coinciden' });
          setLoading(false);
          return;
        }
        payload.currentPassword = passwordForm.currentPassword;
        payload.newPassword = passwordForm.newPassword;
      }
      const { data } = await api.put('/trabajadores/me', payload);
      localStorage.setItem('userData', JSON.stringify({ ...JSON.parse(localStorage.getItem('userData') || '{}'), ...data.data }));
      setMessage({ type: 'success', text: data.message || 'Perfil actualizado correctamente' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || err.message || 'Error al actualizar' });
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <h2 className="mb-4">
        <i className="bi bi-person-gear me-2"></i>
        Mi Perfil
      </h2>

      <div className="row">
        <div className="col-md-8 col-lg-6">
          <div className="card bg-light mb-4">
            <div className="card-body">
              <h6 className="text-muted mb-2">Información (editable por tu encargado)</h6>
              <p className="mb-1"><strong>Nombre:</strong> {userData.nombre_completo}</p>
              <p className="mb-1"><strong>Usuario:</strong> @{userData.username}</p>
              <p className="mb-0"><strong>Área:</strong> {userData.area_descripcion}</p>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">
                <i className="bi bi-pencil-square me-2"></i>
                Editar Mi Perfil
              </h5>
            </div>
            <div className="card-body">
              {message.text && (
                <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
                  {message.text}
                  <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    className="form-control"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="tu@correo.com"
                  />
                  <small className="text-muted">Si configuras un correo Gmail, podrás iniciar sesión con Google</small>
                </div>

                <hr className="my-4" />
                <h6 className="mb-3"><i className="bi bi-shield-lock me-2"></i>Cambiar Contraseña</h6>
                <p className="text-muted small">Deja los campos vacíos si no deseas cambiar la contraseña</p>
                <div className="mb-3">
                  <label className="form-label">Contraseña Actual</label>
                  <input type="password" className="form-control" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange} placeholder="Solo si vas a cambiar la contraseña" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Nueva Contraseña</label>
                  <input type="password" className="form-control" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} placeholder="Nueva contraseña" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirmar Nueva Contraseña</label>
                  <input type="password" className="form-control" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} placeholder="Repite la nueva contraseña" />
                </div>

                <button type="submit" className="btn btn-dark" disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Guardando...</> : <><i className="bi bi-check-circle me-2"></i>Guardar Cambios</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiPerfil;

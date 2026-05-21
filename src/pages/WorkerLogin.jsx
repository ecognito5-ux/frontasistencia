import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api, { apiService } from '../services/api';

const WorkerLogin = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/trabajadores/login', form);

      // Guardar token y datos del usuario
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', 'trabajador');
      localStorage.setItem('userData', JSON.stringify(data.user));

      // Redirigir al dashboard de trabajador
      navigate('/worker');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    setError('');

    try {
      const { data } = await apiService.googleLogin(credentialResponse.credential, 'trabajador');

      // Guardar token y datos del usuario
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', 'trabajador');
      localStorage.setItem('userData', JSON.stringify(data.user));

      // Redirigir al dashboard de trabajador
      navigate('/worker');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Error al conectar con Google. Por favor, intenta de nuevo.');
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-5" style={{ backgroundColor: '#f6f7fb' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div className="card border-0 shadow">
              <div className="card-header bg-dark text-white text-center">
                <h4 className="mb-0">
                  <i className="bi bi-people-fill me-2"></i>
                  Acceso Personal Trabajador
                </h4>
              </div>
              <div className="card-body p-4">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} autoComplete="off">
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">Usuario</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      className="form-control"
                      placeholder=""
                      autoComplete="off"
                      value={form.username}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Contraseña</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className="form-control"
                      placeholder=""
                      autoComplete="current-password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <button type="submit" className="btn btn-dark w-100" disabled={loading || googleLoading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Iniciando sesión...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Iniciar sesión
                      </>
                    )}
                  </button>
                </form>

                {/* Separador */}
                <div className="d-flex align-items-center my-4">
                  <hr className="flex-grow-1" />
                  <span className="px-3 text-muted small">o continúa con</span>
                  <hr className="flex-grow-1" />
                </div>

                {/* Botón de Google */}
                <div className="d-flex justify-content-center">
                  {googleLoading ? (
                    <div className="d-flex align-items-center">
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Conectando con Google...
                    </div>
                  ) : (
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      theme="outline"
                      size="large"
                      text="signin_with"
                      shape="rectangular"
                      locale="es"
                    />
                  )}
                </div>
              </div>
              <div className="card-footer text-center text-muted">
                <small>Para personal operativo del sistema</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerLogin;
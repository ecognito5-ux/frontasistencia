import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { apiService } from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const redirectByRole = (role) => {
    if (role === 'admin') navigate('/admin');
    else if (role === 'area') navigate('/area');
    else if (role === 'trabajador') navigate('/worker');
    else navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await apiService.login({ email, password });
      if (data?.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('userData', JSON.stringify(data.user || {}));
        redirectByRole(data.role);
      } else {
        throw new Error('Respuesta inválida');
      }
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError(err.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    setError('');
    try {
      const { data } = await apiService.googleLogin(credentialResponse.credential);
      if (data?.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('userData', JSON.stringify(data.user || {}));
        redirectByRole(data.role);
      } else {
        throw new Error('Respuesta inválida');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Error al conectar con Google. Intenta de nuevo.');
  };

  return (
    <div 
      className="min-vh-100 d-flex align-items-center justify-content-center py-5"
      style={{
        background: 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Outfit', 'Inter', sans-serif"
      }}
    >
      {/* Elementos decorativos de fondo */}
      <div 
        style={{
          position: 'absolute',
          top: '-30%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: 'rgba(102, 126, 234, 0.15)',
          borderRadius: '50%',
          filter: 'blur(100px)'
        }}
      />
      <div 
        style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '500px',
          height: '500px',
          background: 'rgba(118, 75, 162, 0.12)',
          borderRadius: '50%',
          filter: 'blur(80px)'
        }}
      />

      <div className="container position-relative" style={{ zIndex: 1 }}>
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div 
              className="card border-0"
              style={{
                borderRadius: '24px',
                boxShadow: '0 25px 70px rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(15px)',
                background: 'rgba(255, 255, 255, 0.96)',
                overflow: 'hidden'
              }}
            >
              {/* Header con gradiente premium */}
              <div 
                className="text-white text-center py-4"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  position: 'relative'
                }}
              >
                <div className="mb-2">
                  <div 
                    style={{
                      width: '72px',
                      height: '72px',
                      margin: '0 auto',
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255, 255, 255, 0.4)'
                    }}
                  >
                    <i className="bi bi-shield-lock-fill" style={{ fontSize: '2.2rem' }}></i>
                  </div>
                </div>
                <h3 className="mb-0 fw-bold" style={{ letterSpacing: '-0.5px' }}>COSSMIL</h3>
                <p className="mb-0 opacity-80" style={{ fontSize: '0.9rem', fontWeight: 300 }}>
                  Sistema Integrado de Asistencia
                </p>
              </div>

              <div className="card-body p-4 p-md-5">
                {error && (
                  <div 
                    className="alert alert-danger d-flex align-items-center mb-4 fade show" 
                    role="alert"
                    style={{ borderRadius: '14px', border: 'none', background: 'rgba(220, 53, 69, 0.1)', color: '#dc3545', padding: '12px 16px' }}
                  >
                    <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{error}</span>
                  </div>
                )}

                {/* Formulario de Credenciales */}
                <form onSubmit={handleSubmit} autoComplete="off">
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label text-secondary fw-semibold mb-1" style={{ fontSize: '0.85rem' }}>
                      Usuario o Correo Electrónico
                    </label>
                    <div className="input-group" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e0e0e0', transition: 'border-color 0.2s' }}>
                      <span className="input-group-text bg-light border-0 text-muted px-3">
                        <i className="bi bi-person-fill"></i>
                      </span>
                      <input
                        type="text"
                        id="email"
                        className="form-control bg-light border-0 py-2.5 ps-2"
                        placeholder="Ej. juan.perez o correo@cossmil.mil"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ fontSize: '0.95rem', boxShadow: 'none' }}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label text-secondary fw-semibold mb-1" style={{ fontSize: '0.85rem' }}>
                      Contraseña
                    </label>
                    <div className="input-group" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e0e0e0', transition: 'border-color 0.2s' }}>
                      <span className="input-group-text bg-light border-0 text-muted px-3">
                        <i className="bi bi-lock-fill"></i>
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        className="form-control bg-light border-0 py-2.5 ps-2"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ fontSize: '0.95rem', boxShadow: 'none' }}
                      />
                      <button 
                        type="button" 
                        className="btn bg-light border-0 text-muted px-3"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ boxShadow: 'none' }}
                      >
                        <i className={showPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"}></i>
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || googleLoading}
                    className="btn w-100 py-2.5 fw-semibold text-white mb-2" 
                    style={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '0.95rem',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {loading ? (
                      <span className="d-flex align-items-center justify-content-center">
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Validando credenciales...
                      </span>
                    ) : (
                      <span className="d-flex align-items-center justify-content-center">
                        <i className="bi bi-box-arrow-in-right me-2 fs-5"></i>
                        Iniciar Sesión
                      </span>
                    )}
                  </button>
                </form>

                {/* Separador elegante */}
                <div className="d-flex align-items-center my-4">
                  <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }}></div>
                  <span className="text-muted mx-3" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                    O ingresa con
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }}></div>
                </div>

                {/* Google Login */}
                <div className="d-flex justify-content-center mb-2">
                  {googleLoading ? (
                    <div className="d-flex flex-column align-items-center py-2">
                      <div className="spinner-border text-primary mb-2" role="status" style={{ width: '2rem', height: '2rem' }}>
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                      <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Conectando con Google...</p>
                    </div>
                  ) : (
                    <div style={{ width: '100%', maxWidth: '280px', display: 'flex', justifyContent: 'center' }}>
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="outline"
                        size="large"
                        text="signin_with"
                        shape="pill"
                        locale="es"
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>

                <div className="text-center mt-4">
                  <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
                    <i className="bi bi-info-circle-fill text-primary me-1"></i>
                    El sistema detectará tu rol de acceso automáticamente.
                  </p>
                </div>
              </div>

              {/* Footer con diseño premium y seguro */}
              <div 
                className="text-center py-3"
                style={{
                  background: 'rgba(248, 249, 250, 0.8)',
                  borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                  fontSize: '0.8rem'
                }}
              >
                <span className="text-muted fw-medium">
                  <i className="bi bi-shield-fill-check text-success me-1"></i>
                  Acceso seguro mediante cifrado SSL
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

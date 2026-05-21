import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { apiService } from '../services/api';

const Login = () => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const redirectByRole = (role) => {
    if (role === 'admin') navigate('/admin');
    else if (role === 'area') navigate('/area');
    else if (role === 'trabajador') navigate('/worker');
    else navigate('/');
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Elementos decorativos de fondo */}
      <div 
        style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(80px)'
        }}
      />
      <div 
        style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-10%',
          width: '500px',
          height: '500px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }}
      />

      <div className="container position-relative" style={{ zIndex: 1 }}>
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div 
              className="card border-0"
              style={{
                borderRadius: '20px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)',
                background: 'rgba(255, 255, 255, 0.95)',
                overflow: 'hidden'
              }}
            >
              {/* Header con gradiente */}
              <div 
                className="text-white text-center py-4"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  position: 'relative'
                }}
              >
                <div className="mb-3">
                  <div 
                    style={{
                      width: '80px',
                      height: '80px',
                      margin: '0 auto',
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <i className="bi bi-shield-lock" style={{ fontSize: '2.5rem' }}></i>
                  </div>
                </div>
                <h3 className="mb-1 fw-bold">Bienvenido</h3>
                <p className="mb-0 opacity-90" style={{ fontSize: '0.95rem' }}>
                  Acceso al Sistema
                </p>
              </div>

              <div className="card-body p-5">
                {error && (
                  <div 
                    className="alert alert-danger d-flex align-items-center mb-4" 
                    role="alert"
                    style={{ borderRadius: '12px', border: 'none' }}
                  >
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <span>{error}</span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <p className="text-muted mb-4" style={{ fontSize: '1rem' }}>
                    Inicia sesión de forma rápida y segura con tu cuenta de Google
                  </p>
                </div>

                <div className="d-flex justify-content-center mb-4">
                  {googleLoading ? (
                    <div className="d-flex flex-column align-items-center">
                      <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                      <p className="text-muted mb-0">Conectando con Google...</p>
                    </div>
                  ) : (
                    <div style={{ transform: 'scale(1.1)' }}>
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="filled_blue"
                        size="large"
                        text="signin_with"
                        shape="rectangular"
                        locale="es"
                      />
                    </div>
                  )}
                </div>

                <div className="text-center mt-4">
                  <div className="d-flex align-items-center justify-content-center mb-3">
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #dee2e6, transparent)' }}></div>
                    <i className="bi bi-shield-check-fill text-primary mx-3" style={{ fontSize: '1.2rem' }}></i>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #dee2e6, transparent)' }}></div>
                  </div>
                  <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
                    <i className="bi bi-info-circle me-1"></i>
                    Serás redirigido automáticamente a tu panel según tu rol
                  </p>
                </div>
              </div>

              {/* Footer decorativo */}
              <div 
                className="text-center py-3"
                style={{
                  background: 'linear-gradient(to right, transparent, rgba(102, 126, 234, 0.1), transparent)',
                  borderTop: '1px solid rgba(0, 0, 0, 0.05)'
                }}
              >
                <small className="text-muted">
                  <i className="bi bi-lock-fill me-1"></i>
                  Acceso seguro y protegido
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

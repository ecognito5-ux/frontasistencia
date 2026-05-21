import axios from 'axios';

/**
 * URL del API:
 * - Producción (Vercel): definir VITE_API_BASE_URL=https://tu-backend.railway.app/api
 * - Desarrollo local: opcional VITE_API_PORT=3000 o solo VITE_API_BASE_URL
 */
const ENV_BASE = import.meta.env?.VITE_API_BASE_URL?.replace(/\/$/, '');
const API_PORT = import.meta.env?.VITE_API_PORT || '3000';

const resolveBaseUrl = () => {
  if (ENV_BASE) return ENV_BASE.endsWith('/api') ? ENV_BASE : `${ENV_BASE}/api`;

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:${API_PORT}/api`;
    }
  }

  return '';
};

const API_BASE_URL = resolveBaseUrl();

if (!API_BASE_URL && import.meta.env?.PROD) {
  console.error('COSSMIL: configure VITE_API_BASE_URL en Vercel (URL del backend Railway + /api)');
}

const api = axios.create({
  baseURL: API_BASE_URL || 'http://localhost:3000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userData');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  healthCheck: () => api.get('/health'),

  adminLogin: (credentials) => api.post('/admin/login', credentials),
  adminMe: () => api.get('/admin/me'),
  adminUpdateMe: (data) => api.put('/admin/me', data),
    adminPurge: (confirm) => api.post('/admin/purge', { confirm }),

    getSuperAdmins: () => api.get('/admin/admins'),
    getSuperAdmin: (id) => api.get(`/admin/admins/${id}`),
    createSuperAdmin: (data) => api.post('/admin/admins', data),
    updateSuperAdmin: (id, data) => api.put(`/admin/admins/${id}`, data),
    deleteSuperAdmin: (id) => api.delete(`/admin/admins/${id}`),

  getAreas: () => api.get('/areas'),
  getArea: (id) => api.get(`/areas/${id}`),
  createArea: (areaData) => api.post('/areas', areaData),
  updateArea: (id, areaData) => api.put(`/areas/${id}`, areaData),
  deleteArea: (id) => api.delete(`/areas/${id}`),

  getPersonalArea: () => api.get('/personal-area'),
  getPersonalAreaById: (id) => api.get(`/personal-area/${id}`),
  getPersonalByArea: (areaId) => api.get(`/personal-area/area/${areaId}`),
  createPersonalArea: (personalData) => api.post('/personal-area', personalData),
  updatePersonalArea: (id, personalData) => api.put(`/personal-area/${id}`, personalData),
  deletePersonalArea: (id) => api.delete(`/personal-area/${id}`),

  getPersonal: () => api.get('/personal'),
  getPersonalById: (id) => api.get(`/personal/${id}`),
  createPersonal: (personalData) => api.post('/personal', personalData),
  updatePersonal: (id, personalData) => api.put(`/personal/${id}`, personalData),
  deletePersonal: (id) => api.delete(`/personal/${id}`),

  getRoles: () => api.get('/roles'),
  getRole: (id) => api.get(`/roles/${id}`),
  getRolesByArea: (areaId) => api.get(`/roles/area/${areaId}`),
  getRolesByPersonalArea: (personalAreaId) => api.get(`/roles/personal-area/${personalAreaId}`),
  createRole: (roleData) => api.post('/roles', roleData),
  updateRole: (id, roleData) => api.put(`/roles/${id}`, roleData),
  deleteRole: (id) => api.delete(`/roles/${id}`),

  getTrabajadores: () => api.get('/trabajadores'),
  getTrabajador: (id) => api.get(`/trabajadores/${id}`),
  getTrabajadoresByArea: (areaId) => api.get(`/trabajadores/area/${areaId}`),
  getTrabajadoresByPersonalArea: (personalAreaId) => api.get(`/trabajadores/personal-area/${personalAreaId}`),
  createTrabajador: (trabajadorData) => api.post('/trabajadores', trabajadorData),
  updateTrabajador: (id, trabajadorData) => api.put(`/trabajadores/${id}`, trabajadorData),
  deleteTrabajador: (id) => api.delete(`/trabajadores/${id}`),

  getUbicaciones: () => api.get('/ubicaciones'),
  getUbicacion: (id) => api.get(`/ubicaciones/${id}`),
  createUbicacion: (ubicacionData) => api.post('/ubicaciones', ubicacionData),
  updateUbicacion: (id, ubicacionData) => api.put(`/ubicaciones/${id}`, ubicacionData),
  deleteUbicacion: (id) => api.delete(`/ubicaciones/${id}`),

  getAsignaciones: (params) => api.get('/asignaciones', { params }),
  createAsignacion: (payload) => api.post('/asignaciones', payload),
  updateAsignacion: (id, payload) => api.put(`/asignaciones/${id}`, payload),
  deleteAsignacion: (id) => api.delete(`/asignaciones/${id}`),

  getAsistencias: (params) => api.get('/asistencias', { params }),
  getReporteEncargado: (fecha) => api.get('/asistencias/reporte-encargado', { params: { fecha } }),
  marcarAsistencia: (payload) => api.post('/asistencias', payload),
  actualizarComentarioAsistencia: (id, comentario) => api.patch(`/asistencias/${id}/comentario`, { comentario }),

  googleLogin: (credential) => api.post('/auth/google/login', { credential }),
  getGoogleConfig: () => api.get('/auth/google/config'),
};

export default api;

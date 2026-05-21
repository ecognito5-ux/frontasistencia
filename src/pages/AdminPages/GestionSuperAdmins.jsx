import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';
import { useDialog } from '../../hooks/useDialog.jsx';

const emptyForm = () => ({
  username: '',
  password: '',
  nombre_completo: '',
  correo: '',
});

const GestionSuperAdmins = () => {
  const { alert, confirm } = useDialog();
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getSuperAdmins();
      setAdmins(res?.data?.data || []);
    } catch (e) {
      await alert(e?.response?.data?.message || 'Error al cargar super admins');
    } finally {
      setLoading(false);
    }
  }, [alert]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirCrear = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const abrirEditar = (admin) => {
    setEditing(admin);
    setForm({
      username: admin.username || '',
      password: '',
      nombre_completo: admin.nombre_completo || '',
      correo: admin.correo || '',
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    if (!saving) setShowModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const guardar = async () => {
    if (!form.username.trim() || !form.nombre_completo.trim()) {
      await alert('Usuario y nombre completo son obligatorios.');
      return;
    }
    if (!editing && !form.password.trim()) {
      await alert('La contraseña es obligatoria al crear un super admin.');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        username: form.username.trim(),
        nombre_completo: form.nombre_completo.trim(),
        correo: form.correo.trim() || null,
      };
      if (form.password.trim()) payload.password = form.password.trim();

      if (editing) {
        await apiService.updateSuperAdmin(editing.id, payload);
        await alert('Super admin actualizado correctamente.');
      } else {
        await apiService.createSuperAdmin(payload);
        await alert('Super admin creado correctamente.');
      }
      setShowModal(false);
      await cargar();
    } catch (e) {
      await alert(e?.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (admin) => {
    const ok = await confirm(
      `¿Eliminar al super admin "${admin.nombre_completo}" (@${admin.username})?`,
      { title: 'Confirmar eliminación', confirmText: 'Eliminar', cancelText: 'Cancelar' }
    );
    if (!ok) return;
    try {
      await apiService.deleteSuperAdmin(admin.id);
      await alert('Super admin eliminado.');
      await cargar();
    } catch (e) {
      await alert(e?.response?.data?.message || 'No se pudo eliminar');
    }
  };

  return (
    <div className="container-fluid">
      <div
        className="p-4 text-white mb-4"
        style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #1e293b 100%)',
          borderRadius: '12px',
        }}
      >
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h2 className="mb-1">
              <i className="bi bi-shield-plus me-2"></i>
              Super administradores
            </h2>
            <p className="mb-0 text-white-50">
              Crea y administra cuentas con acceso total al sistema.
            </p>
          </div>
          <button type="button" className="btn btn-light" onClick={abrirCrear}>
            <i className="bi bi-person-plus-fill me-2"></i>
            Nuevo super admin
          </button>
        </div>
      </div>

      <div className="card panel-card shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-people-fill me-2 text-primary"></i>
            Listado ({admins.length})
          </h5>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={cargar} disabled={loading}>
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-shield-x fs-1 d-block mb-2"></i>
              No hay super admins registrados
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="ps-3">#</th>
                    <th>Nombre</th>
                    <th>Usuario</th>
                    <th>Correo</th>
                    <th className="text-end pe-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a, i) => (
                    <tr key={a.id}>
                      <td className="ps-3 text-muted">{i + 1}</td>
                      <td>
                        <strong>{a.nombre_completo}</strong>
                        {userData.id === a.id && (
                          <span className="badge bg-primary ms-2">Tú</span>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-secondary bg-opacity-10 text-dark border">
                          @{a.username}
                        </span>
                      </td>
                      <td className="small">{a.correo || '—'}</td>
                      <td className="text-end pe-3">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => abrirEditar(a)}
                          title="Editar"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => eliminar(a)}
                          disabled={userData.id === a.id}
                          title={userData.id === a.id ? 'No puedes eliminarte' : 'Eliminar'}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="alert alert-info mt-3 small">
        <i className="bi bi-info-circle me-2"></i>
        El correo debe coincidir con la cuenta de Google si usarán inicio de sesión con Google.
        La contraseña sirve para entrar con usuario y contraseña en el login unificado.
      </div>

      {showModal && (
        <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(15,23,42,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editing ? 'Editar super admin' : 'Nuevo super admin'}
                </h5>
                <button type="button" className="btn-close" onClick={cerrarModal} aria-label="Cerrar"></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Nombre completo *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="nombre_completo"
                    value={form.nombre_completo}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Usuario *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    disabled={saving}
                    autoComplete="off"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Correo (Google / login)</label>
                  <input
                    type="email"
                    className="form-control"
                    name="correo"
                    value={form.correo}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="ejemplo@gmail.com"
                  />
                </div>
                <div className="mb-0">
                  <label className="form-label">
                    Contraseña {editing ? '(dejar vacío para no cambiar)' : '*'}
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    disabled={saving}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={cerrarModal} disabled={saving}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary" onClick={guardar} disabled={saving}>
                  {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear super admin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionSuperAdmins;

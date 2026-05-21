import { useState, useEffect, useCallback } from 'react';
import { useDialog } from '../../hooks/useDialog.jsx';
import api from '../../services/api';

const GestionUnificada = () => {
  const { alert, confirm } = useDialog();
  // Estados principales
  const [areas, setAreas] = useState([]);
  const [personalArea, setPersonalArea] = useState([]);
  const [roles, setRoles] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  
  // Estados de selección
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedPersonalArea, setSelectedPersonalArea] = useState(null);
  
  // Estados de carga
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados de modales
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showTrabajadorModal, setShowTrabajadorModal] = useState(false);
  const [showAreaManagementModal, setShowAreaManagementModal] = useState(false);
  
  // Estados de edición
  const [editingArea, setEditingArea] = useState(null);
  const [editingPersonal, setEditingPersonal] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [editingTrabajador, setEditingTrabajador] = useState(null);
  
  // Estados de formularios
  const [areaForm, setAreaForm] = useState({ descripcion: '' });
  const [personalForm, setPersonalForm] = useState({
    username: '',
    password: '',
    nombre_completo: '',
    correo: '',
    id_area_laboral: ''
  });
  const [roleForm, setRoleForm] = useState({
    descripcion: '',
    id_area_laboral: ''
  });
  const [trabajadorForm, setTrabajadorForm] = useState({
    username: '',
    password: '',
    nombre_completo: '',
    correo: '',
    id_personal_area: '',
    id_area_laboral: '',
    roles_ids: []
  });

  // Token se envía automáticamente por interceptor de apiService

  // Cargar todas las áreas
  const loadAreas = useCallback(async () => {
    try {
      const res = await api.get('/areas');
      const data = res?.data;
      setAreas(data.data || data || []);
    } catch (err) {
      console.error('Error cargando áreas:', err);
    }
  }, []);

  // Cargar personal de área por área seleccionada
  const loadPersonalArea = useCallback(async (areaId) => {
    if (!areaId) {
      setPersonalArea([]);
      return;
    }
    
    try {
      const res = await api.get(`/personal-area/area/${areaId}`);
      const data = res?.data;
      setPersonalArea(data.data || data || []);
    } catch (err) {
      console.error('Error cargando personal de área:', err);
    }
  }, []);

  // Cargar roles por área laboral
  const loadRolesByArea = useCallback(async (areaId) => {
    if (!areaId) {
      setRoles([]);
      return;
    }
    
    try {
      const res = await api.get(`/roles/area/${areaId}`);
      const data = res?.data;
      setRoles(data.data || data || []);
    } catch (err) {
      console.error('Error cargando roles:', err);
    }
  }, []);

  // Cargar roles por personal de área específico
  const loadRolesByPersonal = useCallback(async (personalAreaId) => {
    if (!personalAreaId) {
      setRoles([]);
      return;
    }
    
    try {
      const res = await api.get(`/roles/personal-area/${personalAreaId}`);
      const data = res?.data;
      setRoles(data.data || data || []);
    } catch (err) {
      console.error('Error cargando roles:', err);
    }
  }, []);

  // Cargar trabajadores por personal de área específico
  const loadTrabajadoresByPersonal = useCallback(async (personalAreaId) => {
    if (!personalAreaId) {
      setTrabajadores([]);
      return;
    }
    
    try {
      const res = await api.get(`/trabajadores/personal-area/${personalAreaId}`);
      const data = res?.data;
      setTrabajadores(data.data || data || []);
    } catch (err) {
      console.error('Error cargando trabajadores:', err);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await loadAreas();
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [loadAreas]);

  // Manejar selección de área
  const handleAreaSelect = async (area) => {
    setSelectedArea(area);
    setSelectedPersonalArea(null);
    setPersonalArea([]);
    setRoles([]);
    setTrabajadores([]);
    
    if (area) {
      // Cargar personal y roles del área
      await loadPersonalArea(area.id);
      await loadRolesByArea(area.id);
      
      // Si existe personal de área, cargar también los trabajadores
      try {
        const res = await api.get(`/personal-area/area/${area.id}`);
        const data = res?.data;
        const personal = data.data || data || [];
        
        if (personal.length > 0) {
          setSelectedPersonalArea(personal[0]);
          await loadTrabajadoresByPersonal(personal[0].id);
        }
      } catch {
        // ignore
      }
      
      setShowAreaManagementModal(true);
    }
  };


  // Funciones para manejar formularios
  const handleAreaFormChange = (e) => {
    const { name, value } = e.target;
    setAreaForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePersonalFormChange = (e) => {
    const { name, value } = e.target;
    setPersonalForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleFormChange = (e) => {
    const { name, value } = e.target;
    setRoleForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTrabajadorFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'roles_ids') {
      const selectedRoles = Array.from(e.target.selectedOptions, option => parseInt(option.value));
      setTrabajadorForm(prev => ({ ...prev, [name]: selectedRoles }));
    } else {
      setTrabajadorForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Funciones para abrir modales
  const openAreaModal = (area = null) => {
    setEditingArea(area);
    setAreaForm(area ? { descripcion: area.descripcion } : { descripcion: '' });
    setShowAreaModal(true);
  };

  const openPersonalModal = (personal = null) => {
    setEditingPersonal(personal);
    setPersonalForm(personal ? {
      username: personal.username,
      password: '',
      nombre_completo: personal.nombre_completo,
      correo: personal.correo || '',
      id_area_laboral: personal.id_area_laboral.toString()
    } : {
      username: '',
      password: '',
      nombre_completo: '',
      correo: '',
      id_area_laboral: selectedArea ? selectedArea.id.toString() : ''
    });
    setShowPersonalModal(true);
  };

  const openRoleModal = (role = null) => {
    setEditingRole(role);
    setRoleForm(role ? {
      descripcion: role.descripcion,
      id_area_laboral: role.id_area_laboral.toString()
    } : {
      descripcion: '',
      id_area_laboral: selectedArea ? selectedArea.id.toString() : ''
    });
    setShowRoleModal(true);
  };

  const openTrabajadorModal = async (trabajador = null) => {
    // Asegurarnos de que hay un personal de área seleccionado
    const personalDeArea = selectedPersonalArea || (personalArea.length > 0 ? personalArea[0] : null);
    
    if (!personalDeArea) {
      await alert('Primero debes crear un encargado de área.');
      return;
    }
    
    setEditingTrabajador(trabajador);
    setTrabajadorForm(trabajador ? {
      username: trabajador.username,
      password: '', // No mostrar la contraseña al editar
      nombre_completo: trabajador.nombre_completo,
      correo: trabajador.correo || '',
      id_personal_area: trabajador.id_personal_area.toString(),
      id_area_laboral: trabajador.id_area_laboral.toString(),
      roles_ids: trabajador.roles_ids || []
    } : {
      username: '',
      password: '',
      nombre_completo: '',
      correo: '',
      id_personal_area: personalDeArea.id.toString(),
      id_area_laboral: selectedArea ? selectedArea.id.toString() : '',
      roles_ids: []
    });
    setShowTrabajadorModal(true);
  };

  // Funciones para guardar
  const saveArea = async (e) => {
    e.preventDefault();
    
    try {
      const result = editingArea
        ? (await api.put(`/areas/${editingArea.id}`, areaForm)).data
        : (await api.post('/areas', areaForm)).data;
      await loadAreas();
      setShowAreaModal(false);
      await alert(result.message || 'Operación exitosa');
    } catch (err) {
      await alert(err.message || 'Ocurrió un error');
    }
  };

  const savePersonal = async (e) => {
    e.preventDefault();
    
    // Validar que no exista ya un personal de área si es creación nueva
    if (!editingPersonal && personalArea.length > 0) {
      await alert('Ya existe un encargado para esta área. Solo se permite uno por área.');
      return;
    }
    
    try {
      const payload = { 
        ...personalForm, 
        id_area_laboral: parseInt(personalForm.id_area_laboral),
        correo: personalForm.correo || null
      };
      const result = editingPersonal
        ? (await api.put(`/personal-area/${editingPersonal.id}`, payload)).data
        : (await api.post('/personal-area', payload)).data;
      
      // Recargar personal de área
      await loadPersonalArea(selectedArea?.id);
      
      // Si es nuevo, cargar el personal recién creado y sus trabajadores
      if (!editingPersonal) {
        try {
          const data = (await api.get(`/personal-area/area/${selectedArea.id}`)).data;
          const personal = data.data || data || [];
          if (personal.length > 0) {
            setSelectedPersonalArea(personal[0]);
            await loadTrabajadoresByPersonal(personal[0].id);
          }
      } catch {
        // ignore
      }
      }
      
      setShowPersonalModal(false);
      await alert(result.message || 'Operación exitosa');
    } catch (err) {
      await alert(err.message || 'Ocurrió un error');
    }
  };

  const saveRole = async (e) => {
    e.preventDefault();
    
    try {
      const payload = { ...roleForm, id_area_laboral: parseInt(roleForm.id_area_laboral) };
      const result = editingRole
        ? (await api.put(`/roles/${editingRole.id}`, payload)).data
        : (await api.post('/roles', payload)).data;
      // Recargar roles del área o del personal de área según el contexto
      if (selectedArea && !selectedPersonalArea) {
        await loadRolesByArea(selectedArea.id);
      } else if (selectedPersonalArea) {
        await loadRolesByPersonal(selectedPersonalArea.id);
      }
      setShowRoleModal(false);
      await alert(result.message || 'Operación exitosa');
    } catch (err) {
      await alert(err.message || 'Ocurrió un error');
    }
  };

  const saveTrabajador = async (e) => {
    e.preventDefault();
    
    try {
      // Asegurarnos de que tenemos el personal de área correcto
      const personalDeArea = selectedPersonalArea || (personalArea.length > 0 ? personalArea[0] : null);
      
      if (!personalDeArea) {
        await alert('Error: No se encontró el encargado de área.');
        return;
      }
      
      const url = editingTrabajador ? `/trabajadores/${editingTrabajador.id}` : '/trabajadores';
      // Preparar datos para enviar
      const dataToSend = {
        username: trabajadorForm.username,
        nombre_completo: trabajadorForm.nombre_completo,
        correo: trabajadorForm.correo || null,
        id_personal_area: parseInt(personalDeArea.id),
        id_area_laboral: parseInt(selectedArea.id),
        roles_ids: trabajadorForm.roles_ids
      };
      
      // Solo incluir password si se proporcionó (en creación siempre, en edición solo si no está vacío)
      if (!editingTrabajador || trabajadorForm.password) {
        dataToSend.password = trabajadorForm.password;
      }
      
      const result = editingTrabajador
        ? (await api.put(url, dataToSend)).data
        : (await api.post(url, dataToSend)).data;
      
      // Recargar trabajadores
      await loadTrabajadoresByPersonal(personalDeArea.id);
      
      setShowTrabajadorModal(false);
      await alert(result.message || 'Operación exitosa');
    } catch (err) {
      await alert(err.message || 'Ocurrió un error');
    }
  };

  // Funciones para eliminar
  const deleteArea = async (id) => {
    if (!(await confirm('¿Estás seguro de que quieres eliminar esta área?'))) return;
    
    try {
      const result = (await api.delete(`/areas/${id}`)).data;
      await loadAreas();
      if (selectedArea?.id === id) {
        setSelectedArea(null);
        setPersonalArea([]);
        setRoles([]);
        setTrabajadores([]);
      }
      await alert(result.message || 'Área eliminada');
    } catch (err) {
      await alert(err.message || 'Ocurrió un error');
    }
  };

  const deletePersonal = async (id) => {
    if (!(await confirm('¿Estás seguro de que quieres eliminar este personal de área?'))) return;
    
    try {
      const result = (await api.delete(`/personal-area/${id}`)).data;
      await loadPersonalArea(selectedArea?.id);
      if (selectedPersonalArea?.id === id) {
        setSelectedPersonalArea(null);
        setTrabajadores([]);
      }
      await alert(result.message || 'Encargado eliminado');
    } catch (err) {
      await alert(err.message || 'Ocurrió un error');
    }
  };

  const deleteRole = async (id) => {
    if (!(await confirm('¿Estás seguro de que quieres eliminar este rol?'))) return;
    
    try {
      const result = (await api.delete(`/roles/${id}`)).data;
      // Recargar roles del área o del personal de área según el contexto
      if (selectedArea && !selectedPersonalArea) {
        await loadRolesByArea(selectedArea.id);
      } else if (selectedPersonalArea) {
        await loadRolesByPersonal(selectedPersonalArea.id);
      }
      await alert(result.message || 'Rol eliminado');
    } catch (err) {
      await alert(err.message || 'Ocurrió un error');
    }
  };

  const deleteTrabajador = async (id) => {
    if (!(await confirm('¿Estás seguro de que quieres eliminar este trabajador?'))) return;
    
    try {
      const result = (await api.delete(`/trabajadores/${id}`)).data;
      await loadTrabajadoresByPersonal(selectedPersonalArea?.id);
      await alert(result.message || 'Trabajador eliminado');
    } catch (err) {
      await alert(err.message || 'Ocurrió un error');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Gestión Unificada del Sistema</h2>
            <button 
              className="btn btn-primary btn-lg"
              onClick={() => openAreaModal()}
            >
              <i className="fas fa-plus me-2"></i>Nueva Área
            </button>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {/* Selección de Área */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-building me-2"></i>
                Seleccionar Área Laboral
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                {areas.map(area => (
                  <div key={area.id} className="col-md-3 mb-3">
                    <div 
                      className={`card h-100 cursor-pointer ${selectedArea?.id === area.id ? 'border-primary bg-light' : ''}`}
                      onClick={() => handleAreaSelect(area)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="card-body text-center">
                        <h6 className="card-title">{area.descripcion}</h6>
                        <div className="btn-group btn-group-sm mt-2">
                          <button 
                            className="btn btn-outline-primary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAreaModal(area);
                            }}
                            title="Editar área"
                          >
                            <i className="fas fa-pencil-alt"></i>
                          </button>
                          <button 
                            className="btn btn-outline-danger btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteArea(area.id);
                            }}
                            title="Eliminar área"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modales */}
          {/* Modal Principal de Gestión de Área */}
          {showAreaManagementModal && selectedArea && (
            <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-xl">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      <i className="fas fa-building me-2"></i>
                      Gestión de Área: {selectedArea.descripcion}
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close" 
                      onClick={() => setShowAreaManagementModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    {/* Paso 1: Personal de Área (solo uno) */}
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6><i className="fas fa-user-tie me-2"></i>Encargado del Área</h6>
                        {personalArea.length === 0 && (
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => openPersonalModal()}
                          >
                            <i className="fas fa-plus me-1"></i>Crear Encargado
                          </button>
                        )}
                      </div>
                      
                      {personalArea.length === 0 ? (
                        <div className="alert alert-info">
                          <i className="fas fa-info-circle me-2"></i>
                          Primero debes crear el <strong>Encargado del Área</strong>. Solo se permite un encargado por área.
                        </div>
                      ) : (
                        <div className="card bg-light mb-3">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="mb-1">{personalArea[0].nombre_completo}</h6>
                                <p className="text-muted small mb-0">@{personalArea[0].username}</p>
                              </div>
                              <div className="btn-group btn-group-sm">
                                <button 
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => openPersonalModal(personalArea[0])}
                                  title="Editar encargado"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button 
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => deletePersonal(personalArea[0].id)}
                                  title="Eliminar encargado"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Paso 2 y 3: Roles y Trabajadores (solo si existe personal) */}
                    {personalArea.length > 0 && (
                      <>
                        <hr />
                        {/* Pestañas para Roles y Trabajadores */}
                        <ul className="nav nav-tabs mb-3" id="managementTabs" role="tablist">
                          <li className="nav-item" role="presentation">
                            <button 
                              className="nav-link active" 
                              id="roles-tab" 
                              data-bs-toggle="tab" 
                              data-bs-target="#roles-content" 
                              type="button" 
                              role="tab"
                            >
                              <i className="fas fa-tags me-2"></i>Roles
                            </button>
                          </li>
                          <li className="nav-item" role="presentation">
                            <button 
                              className="nav-link" 
                              id="trabajadores-tab" 
                              data-bs-toggle="tab" 
                              data-bs-target="#trabajadores-content" 
                              type="button" 
                              role="tab"
                            >
                              <i className="fas fa-users me-2"></i>Trabajadores
                            </button>
                          </li>
                        </ul>

                        <div className="tab-content" id="managementTabContent">
                          {/* Pestaña Roles */}
                          <div className="tab-pane fade show active" id="roles-content" role="tabpanel">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6>Roles del Área</h6>
                              <button 
                                className="btn btn-info btn-sm"
                                onClick={() => openRoleModal()}
                              >
                                <i className="fas fa-plus me-1"></i>Agregar Rol
                              </button>
                            </div>
                            
                            {roles.length === 0 ? (
                              <div className="text-center py-4">
                                <p className="text-muted">Crea roles para poder asignarlos a los trabajadores</p>
                                <button 
                                  className="btn btn-info"
                                  onClick={() => openRoleModal()}
                                >
                                  <i className="fas fa-plus me-2"></i>Crear Primer Rol
                                </button>
                              </div>
                            ) : (
                              <div className="row">
                                {roles.map(role => (
                                  <div key={role.id} className="col-md-4 mb-3">
                                    <div className="card h-100">
                                      <div className="card-body">
                                        <h6 className="card-title">{role.descripcion}</h6>
                                        <div className="btn-group btn-group-sm">
                                          <button 
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={() => openRoleModal(role)}
                                            title="Editar rol"
                                          >
                                            <i className="fas fa-edit"></i>
                                          </button>
                                          <button 
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() => deleteRole(role.id)}
                                            title="Eliminar rol"
                                          >
                                            <i className="fas fa-trash"></i>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Pestaña Trabajadores */}
                          <div className="tab-pane fade" id="trabajadores-content" role="tabpanel">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6>Trabajadores</h6>
                              <button 
                                className="btn btn-warning btn-sm"
                                onClick={() => openTrabajadorModal()}
                                disabled={roles.length === 0}
                              >
                                <i className="fas fa-plus me-1"></i>Agregar Trabajador
                              </button>
                            </div>

                            {roles.length === 0 ? (
                              <div className="alert alert-warning">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                Primero debes crear <strong>roles</strong> antes de agregar trabajadores.
                              </div>
                            ) : trabajadores.length === 0 ? (
                              <div className="text-center py-4">
                                <p className="text-muted">No hay trabajadores asignados</p>
                                <button 
                                  className="btn btn-warning"
                                  onClick={() => openTrabajadorModal()}
                                >
                                  <i className="fas fa-plus me-2"></i>Agregar Primer Trabajador
                                </button>
                              </div>
                            ) : (
                              <div className="table-responsive">
                                <table className="table table-striped">
                                  <thead className="table-dark">
                                    <tr>
                                      <th>Nombre Completo</th>
                                      <th>Roles Asignados</th>
                                      <th>Acciones</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {trabajadores.map(trabajador => (
                                      <tr key={trabajador.id}>
                                        <td>{trabajador.nombre_completo}</td>
                                        <td>
                                          <span className="badge bg-secondary">
                                            {trabajador.roles_asignados || 'Sin roles'}
                                          </span>
                                        </td>
                                        <td>
                                          <div className="btn-group btn-group-sm">
                                            <button 
                                              className="btn btn-outline-primary btn-sm"
                                              onClick={() => openTrabajadorModal(trabajador)}
                                              title="Editar trabajador"
                                            >
                                              <i className="fas fa-edit"></i>
                                            </button>
                                            <button 
                                              className="btn btn-outline-danger btn-sm"
                                              onClick={() => deleteTrabajador(trabajador.id)}
                                              title="Eliminar trabajador"
                                            >
                                              <i className="fas fa-trash"></i>
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowAreaManagementModal(false)}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Área */}
          {showAreaModal && (
            <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {editingArea ? 'Editar Área' : 'Nueva Área'}
                    </h5>
                    <button type="button" className="btn-close" onClick={() => setShowAreaModal(false)}></button>
                  </div>
                  <form onSubmit={saveArea} autoComplete="off">
                    <div className="modal-body">
                      <div className="mb-3">
                        <label className="form-label">Descripción del Área *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="descripcion"
                          value={areaForm.descripcion}
                          onChange={handleAreaFormChange}
                          placeholder=""
                          autoComplete="off"
                          required
                        />
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowAreaModal(false)}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary">
                        {editingArea ? 'Actualizar' : 'Crear'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Modal Personal de Área */}
          {showPersonalModal && (
            <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {editingPersonal ? 'Editar Personal de Área' : 'Nuevo Personal de Área'}
                    </h5>
                    <button type="button" className="btn-close" onClick={() => setShowPersonalModal(false)}></button>
                  </div>
                  <form onSubmit={savePersonal} autoComplete="off">
                    <div className="modal-body">
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Username *</label>
                          <input
                            type="text"
                            className="form-control"
                            name="username"
                            value={personalForm.username}
                            onChange={handlePersonalFormChange}
                            placeholder=""
                            autoComplete="off"
                            required
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Contraseña *</label>
                          <input
                            type="password"
                            className="form-control"
                            name="password"
                            value={personalForm.password}
                            onChange={handlePersonalFormChange}
                            placeholder=""
                            autoComplete="new-password"
                            required
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Nombre Completo *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="nombre_completo"
                          value={personalForm.nombre_completo}
                          onChange={handlePersonalFormChange}
                          placeholder=""
                          autoComplete="off"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Correo Electrónico (Gmail para login con Google)</label>
                        <input
                          type="email"
                          className="form-control"
                          name="correo"
                          value={personalForm.correo}
                          onChange={handlePersonalFormChange}
                          placeholder="ejemplo@gmail.com"
                          autoComplete="off"
                        />
                        <small className="text-muted">
                          <i className="bi bi-info-circle me-1"></i>
                          Si se proporciona, el usuario podrá iniciar sesión con Google
                        </small>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Área Laboral *</label>
                        <select
                          className="form-select"
                          name="id_area_laboral"
                          value={personalForm.id_area_laboral}
                          onChange={handlePersonalFormChange}
                          required
                        >
                          <option value="">Seleccionar área...</option>
                          {areas.map(area => (
                            <option key={area.id} value={area.id}>
                              {area.descripcion}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowPersonalModal(false)}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary">
                        {editingPersonal ? 'Actualizar' : 'Crear'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Modal Rol */}
          {showRoleModal && (
            <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
                    </h5>
                    <button type="button" className="btn-close" onClick={() => setShowRoleModal(false)}></button>
                  </div>
                  <form onSubmit={saveRole} autoComplete="off">
                    <div className="modal-body">
                      <div className="mb-3">
                        <label className="form-label">Descripción del Rol *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="descripcion"
                          value={roleForm.descripcion}
                          onChange={handleRoleFormChange}
                          placeholder=""
                          autoComplete="off"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Área Laboral *</label>
                        <select
                          className="form-select"
                          name="id_area_laboral"
                          value={roleForm.id_area_laboral}
                          onChange={handleRoleFormChange}
                          required
                        >
                          <option value="">Seleccionar área...</option>
                          {areas.map(area => (
                            <option key={area.id} value={area.id}>
                              {area.descripcion}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary">
                        {editingRole ? 'Actualizar' : 'Crear'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Modal Trabajador */}
          {showTrabajadorModal && (
            <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {editingTrabajador ? 'Editar Trabajador' : 'Nuevo Trabajador'}
                    </h5>
                    <button type="button" className="btn-close" onClick={() => setShowTrabajadorModal(false)}></button>
                  </div>
                  <form onSubmit={saveTrabajador} autoComplete="off">
                    <div className="modal-body">
                      {/* Información del contexto */}
                      <div className="alert alert-info mb-3">
                        <small>
                          <strong>Área:</strong> {selectedArea?.descripcion}<br />
                          <strong>Encargado:</strong> {(selectedPersonalArea || personalArea[0])?.nombre_completo}
                        </small>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Usuario (Username) *</label>
                          <input
                            type="text"
                            className="form-control"
                            name="username"
                            value={trabajadorForm.username}
                            onChange={handleTrabajadorFormChange}
                            placeholder=""
                            autoComplete="off"
                            required
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">
                            Contraseña {editingTrabajador ? '' : '*'}
                          </label>
                          <input
                            type="password"
                            className="form-control"
                            name="password"
                            value={trabajadorForm.password}
                            onChange={handleTrabajadorFormChange}
                            placeholder={editingTrabajador ? '' : ''}
                            autoComplete={editingTrabajador ? 'current-password' : 'new-password'}
                            required={!editingTrabajador}
                          />
                          {editingTrabajador && (
                            <small className="text-muted">Dejar en blanco para mantener la contraseña actual</small>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Nombre Completo *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="nombre_completo"
                          value={trabajadorForm.nombre_completo}
                          onChange={handleTrabajadorFormChange}
                          placeholder=""
                          autoComplete="off"
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Correo Electrónico (Gmail para login con Google)</label>
                        <input
                          type="email"
                          className="form-control"
                          name="correo"
                          value={trabajadorForm.correo}
                          onChange={handleTrabajadorFormChange}
                          placeholder="ejemplo@gmail.com"
                          autoComplete="off"
                        />
                        <small className="text-muted">
                          <i className="bi bi-info-circle me-1"></i>
                          Si se proporciona, el trabajador podrá iniciar sesión con Google
                        </small>
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">Roles (Mantén Ctrl para seleccionar múltiples) *</label>
                        <select
                          className="form-select"
                          name="roles_ids"
                          multiple
                          size="5"
                          value={trabajadorForm.roles_ids}
                          onChange={handleTrabajadorFormChange}
                          style={{ minHeight: '120px' }}
                        >
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>
                              {role.descripcion}
                            </option>
                          ))}
                        </select>
                        <div className="form-text">
                          <i className="fas fa-info-circle me-1"></i>
                          Mantén presionado Ctrl (o Cmd en Mac) para seleccionar múltiples roles
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowTrabajadorModal(false)}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary">
                        {editingTrabajador ? 'Actualizar' : 'Crear'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GestionUnificada;

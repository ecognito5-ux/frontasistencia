import { useEffect, useMemo, useState } from 'react';
import { useDialog } from '../../hooks/useDialog.jsx';
import { apiService } from '../../services/api';

const MINUTOS_MARCAJE_OPCIONES = [5, 10, 15, 20, 30];

function addMinutesToTime(timeStr, minutes) {
  const [h, m] = (timeStr || '08:00').split(':').map(Number);
  const d = new Date(2000, 0, 1, h || 0, m || 0, 0);
  d.setMinutes(d.getMinutes() + minutes);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function minutosEntre(desde, hasta) {
  const [h1, m1] = (desde || '00:00').split(':').map(Number);
  const [h2, m2] = (hasta || '00:00').split(':').map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}

const dayOptions = [
  { key: 'lun', label: 'Lunes' },
  { key: 'mar', label: 'Martes' },
  { key: 'mie', label: 'Miércoles' },
  { key: 'jue', label: 'Jueves' },
  { key: 'vie', label: 'Viernes' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
];

const getId = (item) => item?.id ?? item?._id ?? item?.ID ?? item?.Id ?? String(item?.nombre || item?.descripcion || Math.random());
const getLabelTrabajador = (t) => t?.nombre_completo || [t?.nombres, t?.apellidos].filter(Boolean).join(' ') || t?.nombre || `Trabajador ${t?.id ?? ''}`;
const getLabelUbicacion = (u) => {
  const name = u?.name || u?.nombre || u?.nombre_ubicacion || u?.ubicacion || u?.alias || `Ubicación ${u?.id ?? ''}`;
  const desc = u?.description || u?.descripcion || u?.descripcion_ubicacion || u?.detalle || '';
  return desc ? `${name} — ${desc}` : name;
};

const AsignacionControl = () => {
  const { alert, confirm } = useDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState({ trabajadores: false, ubicaciones: false, asignaciones: false });
  const [trabajadores, setTrabajadores] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);

  const [selectedTrabajador, setSelectedTrabajador] = useState('');
  const [selectedUbicacion, setSelectedUbicacion] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [horaEntrada, setHoraEntrada] = useState('08:00');
  const [horaSalida, setHoraSalida] = useState('17:00');
  const [minutosMarcaje, setMinutosMarcaje] = useState(15);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);

  const userData = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('userData') || '{}'); } catch { return {}; }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading({ trabajadores: true, ubicaciones: true, asignaciones: true });
      try {
        // Trabajadores del encargado de área actual
        if (userData?.id) {
          const resTrab = await apiService.getTrabajadoresByPersonalArea(userData.id);
          const dataTrab = resTrab?.data?.data || resTrab?.data || [];
          setTrabajadores(Array.isArray(dataTrab) ? dataTrab : []);
        } else {
          setTrabajadores([]);
        }

        // Ubicaciones disponibles
        const resUb = await apiService.getUbicaciones();
        const dataUb = resUb?.data?.data || resUb?.data || [];
        setUbicaciones(Array.isArray(dataUb) ? dataUb : []);

        // Asignaciones del creador (encargado actual)
        if (userData?.id) {
          const resAsig = await apiService.getAsignaciones({ creadorId: userData.id });
          const dataAsig = resAsig?.data?.data || resAsig?.data || [];
          setAsignaciones(Array.isArray(dataAsig) ? dataAsig : []);
        } else {
          setAsignaciones([]);
        }
      } catch (err) {
        console.error('Error cargando datos para asignación:', err);
      } finally {
        setLoading({ trabajadores: false, ubicaciones: false, asignaciones: false });
      }
    };
    loadData();
  }, [userData?.id]);

  const toggleDay = (key) => {
    setSelectedDays((prev) => prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
  };

  const resetForm = () => {
    setSelectedTrabajador('');
    setSelectedUbicacion('');
    setSelectedDays([]);
    setHoraEntrada('08:00');
    setHoraSalida('17:00');
    setMinutosMarcaje(15);
  };

  const openCreate = () => {
    resetForm();
    setEditId(null);
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditId(item.id);
    setSelectedTrabajador(String(item.id_personal_trabajador));
    setSelectedUbicacion(String(item.id_ubicacion_geografica));
    const diasArr = typeof item.dias === 'string' ? item.dias.split(',').map((d) => d.trim()).filter(Boolean) : [];
    setSelectedDays(diasArr);
    setHoraEntrada(item.hora_entrada?.slice(0,5) || '08:00');
    setHoraSalida(item.hora_salida?.slice(0,5) || '17:00');
    const diff = item.ventana_desde && item.ventana_hasta
      ? minutosEntre(item.ventana_desde.slice(0,5), item.ventana_hasta.slice(0,5))
      : 15;
    const nearest = MINUTOS_MARCAJE_OPCIONES.reduce((a, b) => Math.abs(b - diff) < Math.abs(a - diff) ? b : a);
    setMinutosMarcaje(nearest);
    setIsModalOpen(true);
  };

  const reloadAsignaciones = async () => {
    try {
      setLoading((prev) => ({ ...prev, asignaciones: true }));
      const resAsig = await apiService.getAsignaciones({ creadorId: userData.id });
      const dataAsig = resAsig?.data?.data || resAsig?.data || [];
      setAsignaciones(Array.isArray(dataAsig) ? dataAsig : []);
    } catch (e) {
      console.error('Error recargando asignaciones:', e);
    } finally {
      setLoading((prev) => ({ ...prev, asignaciones: false }));
    }
  };

  const handleSave = async () => {
    if (!selectedTrabajador || !selectedUbicacion || selectedDays.length === 0 || !horaEntrada) {
      await alert('Completa trabajador, ubicación, días y hora de entrada.');
      return;
    }
    const ventanaDesde = horaEntrada;
    const ventanaHasta = addMinutesToTime(horaEntrada, minutosMarcaje);
    const payload = {
      id_personal_trabajador: parseInt(selectedTrabajador, 10),
      id_ubicacion_geografica: parseInt(selectedUbicacion, 10),
      dias: selectedDays.join(','),
      hora_entrada: horaEntrada,
      hora_salida: horaSalida || '17:00',
      ventana_desde: ventanaDesde,
      ventana_hasta: ventanaHasta,
    };
    setSubmitting(true);
    try {
      if (editId) {
        await apiService.updateAsignacion(editId, payload);
      } else {
        await apiService.createAsignacion(payload);
      }
      await reloadAsignaciones();
      closeModal();
      resetForm();
    } catch (e) {
      console.error('Error guardando asignación:', e);
      await alert('Ocurrió un error al guardar la asignación.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm('¿Eliminar esta asignación?');
    if (!ok) return;
    try {
      await apiService.deleteAsignacion(id);
      await reloadAsignaciones();
    } catch (e) {
      console.error('Error eliminando asignación:', e);
      await alert('No se pudo eliminar.');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="bi bi-list-task me-2"></i>Asignación de Control</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-lg me-2"></i>Registrar control
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex align-items-start">
            <i className="bi bi-info-circle me-3 text-muted" style={{ fontSize: '1.5rem' }}></i>
            <div>
              <h5 className="mb-1">Configuración preliminar</h5>
              <p className="text-muted mb-0">Primero registra a tus trabajadores y las ubicaciones. Luego podrás asignar días y horarios.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0"><i className="bi bi-table me-2"></i>Asignaciones registradas</h5>
          <button className="btn btn-sm btn-outline-primary" onClick={reloadAsignaciones} disabled={loading.asignaciones}>
            <i className="bi bi-arrow-repeat me-1"></i>Refrescar
          </button>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped mb-0">
              <thead>
                <tr>
                  <th>Trabajador</th>
                  <th>Ubicación</th>
                  <th>Días</th>
                  <th>Entrada</th>
                  <th>Salida est.</th>
                  <th>Marcaje (entrada)</th>
                  <th style={{ width: '120px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading.asignaciones ? (
                  <tr><td colSpan={7} className="text-center py-4">Cargando...</td></tr>
                ) : asignaciones.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-4 text-muted">Sin asignaciones</td></tr>
                ) : (
                  asignaciones.map((a) => {
                    const diasText = Array.isArray(a.dias)
                      ? a.dias.join(', ')
                      : String(a.dias || '')
                          .split(',')
                          .map((d) => {
                            const found = dayOptions.find((x) => x.key === d.trim());
                            return found ? found.label : d.trim();
                          })
                          .join(', ');
                    const ubicacionText = a.ubicacion_descripcion
                      ? `${a.ubicacion_nombre} — ${a.ubicacion_descripcion}`
                      : a.ubicacion_nombre;
                    const ventanaText = a.ventana_desde || a.ventana_hasta
                      ? `${(a.ventana_desde || '').slice(0,5)} - ${(a.ventana_hasta || '').slice(0,5)}`
                      : '-';
                    return (
                      <tr key={a.id}>
                        <td>{a.trabajador_nombre}</td>
                        <td>{ubicacionText}</td>
                        <td>{diasText}</td>
                        <td>{(a.hora_entrada || '').slice(0,5)}</td>
                        <td>{(a.hora_salida || '').slice(0,5)}</td>
                        <td>{ventanaText}</td>
                        <td>
                          <div className="btn-group btn-group-sm" role="group">
                            <button className="btn btn-outline-secondary" onClick={() => openEdit(a)} title="Editar">
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn btn-outline-danger" onClick={() => handleDelete(a.id)} title="Eliminar">
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-clipboard-plus me-2"></i>Registrar control</h5>
                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
              </div>

              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Trabajador</label>
                    <select
                      className="form-select"
                      value={selectedTrabajador}
                      onChange={(e) => setSelectedTrabajador(e.target.value)}
                      disabled={loading.trabajadores}
                    >
                      <option value="">Selecciona un trabajador</option>
                      {trabajadores.map((t) => (
                        <option key={getId(t)} value={String(getId(t))}>
                          {getLabelTrabajador(t)}
                        </option>
                      ))}
                    </select>
                    <div className="form-text">Selecciona un trabajador del área para asignarle control.</div>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Ubicación</label>
                    <select
                      className="form-select"
                      value={selectedUbicacion}
                      onChange={(e) => setSelectedUbicacion(e.target.value)}
                      disabled={loading.ubicaciones}
                    >
                      <option value="">Selecciona una ubicación</option>
                      {ubicaciones.map((u) => (
                        <option key={getId(u)} value={String(getId(u))}>
                          {getLabelUbicacion(u)}
                        </option>
                      ))}
                    </select>
                    <div className="form-text">El trabajador deberá estar físicamente en esta ubicación para marcar.</div>
                  </div>

                  <div className="col-12">
                    <label className="form-label d-block mb-2">Días</label>
                    <div className="d-flex flex-wrap gap-3">
                      {dayOptions.map((d) => (
                        <div className="form-check" key={d.key}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`day-${d.key}`}
                            checked={selectedDays.includes(d.key)}
                            onChange={() => toggleDay(d.key)}
                          />
                          <label className="form-check-label" htmlFor={`day-${d.key}`}>{d.label}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Hora de entrada</label>
                    <input type="time" className="form-control" value={horaEntrada} onChange={(e) => setHoraEntrada(e.target.value)} />
                    <div className="form-text">Hora programada de inicio de jornada.</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Hora de salida estimada</label>
                    <input type="time" className="form-control" value={horaSalida} onChange={(e) => setHoraSalida(e.target.value)} />
                    <div className="form-text">Solo referencia. El trabajador puede irse cuando quiera; los reportes mostrarán la hora real de salida.</div>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-bold">Tiempo de marcaje permitido (minutos después de la hora de entrada)</label>
                    <select
                      className="form-select"
                      style={{ maxWidth: '180px' }}
                      value={minutosMarcaje}
                      onChange={(e) => setMinutosMarcaje(Number(e.target.value))}
                    >
                      {MINUTOS_MARCAJE_OPCIONES.map((m) => (
                        <option key={m} value={m}>{m} minutos</option>
                      ))}
                    </select>
                    <div className="form-text mt-1">
                      Se calculará automáticamente: desde {horaEntrada} hasta {addMinutesToTime(horaEntrada, minutosMarcaje)}
                    </div>
                    <div className="alert alert-info mt-2 mb-0">
                      <div className="d-flex">
                        <i className="bi bi-clock-history me-2"></i>
                        <div>
                          <strong>A tiempo:</strong> Marcas entre {horaEntrada} y {addMinutesToTime(horaEntrada, minutosMarcaje)} se registran como a tiempo.
                          <br />
                          <strong>Tarde:</strong> Si marca después, se registra igual pero se clasifica como tarde y se guarda cuántos minutos de retraso.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>Cancelar</button>
                <button type="button" className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                  <i className="bi bi-save me-2"></i>{editId ? 'Guardar cambios' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AsignacionControl;


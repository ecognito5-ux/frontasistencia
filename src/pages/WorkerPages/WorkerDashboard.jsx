import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Rectangle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { apiService } from '../../services/api';
import { useDialog } from '../../hooks/useDialog.jsx';

const WorkerDashboard = () => {
  const { alert } = useDialog();
  const [asignaciones, setAsignaciones] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState(null); // [lat, lng]
  const [markingId, setMarkingId] = useState(null);
  const [accuracy, setAccuracy] = useState(null); // en metros
  const [selectedId, setSelectedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAssignment, setModalAssignment] = useState(null);
  const [confirmMarcaje, setConfirmMarcaje] = useState(null);
  const [comentarioMarcaje, setComentarioMarcaje] = useState('Tiempo correcto');
  const [editandoComentarioId, setEditandoComentarioId] = useState(null);
  const [comentarioEdit, setComentarioEdit] = useState('');

  const userData = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('userData') || '{}'); } catch { return {}; }
  }, []);

  useEffect(() => {
    let watchId;
    const load = async () => {
      try {
        setLoading(true);
        // Asignaciones del trabajador actual
        const res = await apiService.getAsignaciones({ trabajadorId: userData.id });
        const data = res?.data?.data || res?.data || [];
        const arr = Array.isArray(data) ? data : [];
        setAsignaciones(arr);
        // Asistencias del trabajador
        try {
          const resAsis = await apiService.getAsistencias({ trabajadorId: userData.id });
          const dataAsis = resAsis?.data?.data || [];
          setAsistencias(Array.isArray(dataAsis) ? dataAsis : []);
        } catch {}
        if (!selectedId && arr.length > 0) {
          setSelectedId(arr[0].id);
        }
      } catch (e) {
        console.error('Error cargando asignaciones del trabajador:', e);
      } finally {
        setLoading(false);
      }
    };

    load();

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => console.warn('Geoloc error:', err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      );
    }

    return () => {
      if (watchId && navigator.geolocation) navigator.geolocation.clearWatch(watchId);
    };
  }, [userData.id]);

  const selectedAssignment = () => asignaciones.find((x) => x.id === selectedId) || null;
  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const getTodayAsistenciasByAsignacion = (asignacionId) => {
    const key = todayKey();
    return (asistencias || []).filter((r) => {
      if (r.id_asignacion !== asignacionId) return false;
      const dt = new Date(r.fecha_hora);
      const k = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
      return k === key;
    });
  };
  const hasEntradaHoy = (asignacionId) => getTodayAsistenciasByAsignacion(asignacionId).some((r) => r.tipo !== 'salida');
  const hasSalidaHoy = (asignacionId) => getTodayAsistenciasByAsignacion(asignacionId).some((r) => r.tipo === 'salida');
  const getEntradaHoy = (asignacionId) => getTodayAsistenciasByAsignacion(asignacionId).find((r) => r.tipo !== 'salida');
  const getSalidaHoy = (asignacionId) => getTodayAsistenciasByAsignacion(asignacionId).find((r) => r.tipo === 'salida');
  const getAssignmentCenter = (a) => {
    if (!a || !a.geometry) return null;
    const g = a.geometry;
    if (g.type === 'circle' && Array.isArray(g.center)) return g.center;
    if (g.type === 'rectangle' && Array.isArray(g.start) && Array.isArray(g.end)) {
      const lat = (parseFloat(g.start[0]) + parseFloat(g.end[0])) / 2;
      const lng = (parseFloat(g.start[1]) + parseFloat(g.end[1])) / 2;
      return [lat, lng];
    }
    return null;
  };
  const selectedGeometryCenter = () => getAssignmentCenter(selectedAssignment());
  const centerMap = () => getAssignmentCenter(isModalOpen ? modalAssignment : selectedAssignment()) || position || [-16.5, -68.15];

  const mapRef = useRef(null);
  const [mapKey, setMapKey] = useState(0);
  const watchIdRef = useRef(null);
  const clearWatchTimeoutRef = useRef(null);
  const flyTo = (coords, zoom = 17) => {
    if (mapRef.current && coords) {
      mapRef.current.flyTo(coords, zoom, { duration: 0.8 });
    }
  };

  const handleVerUbicacion = () => {};

  const handleVerMiUbicacion = () => {
    // Intento 1: Leaflet locate (setView automático)
    if (mapRef.current && mapRef.current.locate) {
      try {
        mapRef.current.locate({ setView: true, maxZoom: 19, enableHighAccuracy: true, watch: false });
      } catch {}
    }

    // Intento 2: API Geolocation con alta precisión
    if (navigator.geolocation) {
      // limpiar watch previo
      if (watchIdRef.current) {
        try { navigator.geolocation.clearWatch(watchIdRef.current); } catch {}
        watchIdRef.current = null;
      }
      if (clearWatchTimeoutRef.current) {
        clearTimeout(clearWatchTimeoutRef.current);
        clearWatchTimeoutRef.current = null;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p = [pos.coords.latitude, pos.coords.longitude];
          setPosition(p);
          setAccuracy(pos.coords.accuracy ?? null);
          flyTo(p, 19);
          // pequeño invalidate para asegurar render
          setTimeout(() => { try { mapRef.current && mapRef.current.invalidateSize(); } catch {} }, 120);
        },
        (err) => {
          console.warn('Geoloc error:', err);
          // Fallback: iniciar watch para obtener primer fix y luego parar
          try {
            watchIdRef.current = navigator.geolocation.watchPosition(
              (p2) => {
                const p = [p2.coords.latitude, p2.coords.longitude];
                setPosition(p);
                setAccuracy(p2.coords.accuracy ?? null);
                flyTo(p, 19);
                if (watchIdRef.current) {
                  try { navigator.geolocation.clearWatch(watchIdRef.current); } catch {}
                  watchIdRef.current = null;
                }
              },
              () => {},
              { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
            );
          } catch {}
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );

      // Mantener un watch por unos segundos para mejorar precisión y seguir al usuario
      try {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const p = [pos.coords.latitude, pos.coords.longitude];
            setPosition(p);
            setAccuracy(pos.coords.accuracy ?? null);
            flyTo(p, 19);
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
        );
        clearWatchTimeoutRef.current = setTimeout(() => {
          if (watchIdRef.current) {
            try { navigator.geolocation.clearWatch(watchIdRef.current); } catch {}
            watchIdRef.current = null;
          }
        }, 15000); // seguir 15s para refinar precisión
      } catch {}
    }
  };

  const handleVerLugar = () => {
    const c = getAssignmentCenter(isModalOpen ? modalAssignment : selectedAssignment());
    if (c) {
      flyTo(c, 17);
    }
  };

  // Recentrar cuando cambie la asignación seleccionada o la posición
  useEffect(() => {
    const c = selectedGeometryCenter() || position;
    if (c && mapRef.current) {
      mapRef.current.setView(c, 16, { animate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, position?.[0], position?.[1]]);

  // Invalidate size after map is mounted or when selection changes to ensure proper rendering
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        try { mapRef.current.invalidateSize(); } catch {}
      }, 150);
    }
  }, [selectedId]);

  // Limpiar watches en desmontaje
  useEffect(() => () => {
    if (watchIdRef.current) {
      try { navigator.geolocation.clearWatch(watchIdRef.current); } catch {}
      watchIdRef.current = null;
    }
    if (clearWatchTimeoutRef.current) {
      clearTimeout(clearWatchTimeoutRef.current);
      clearWatchTimeoutRef.current = null;
    }
  }, []);

  // Utilidades de geocerca
  const toRad = (v) => (v * Math.PI) / 180;
  const distanceMeters = (a, b) => {
    if (!a || !b) return Infinity;
    const R = 6371000; // radio tierra en m
    const dLat = toRad(b[0] - a[0]);
    const dLng = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  const insideRectangle = (p, start, end) => {
    if (!p || !start || !end) return false;
    const minLat = Math.min(start[0], end[0]);
    const maxLat = Math.max(start[0], end[0]);
    const minLng = Math.min(start[1], end[1]);
    const maxLng = Math.max(start[1], end[1]);
    return p[0] >= minLat && p[0] <= maxLat && p[1] >= minLng && p[1] <= maxLng;
  };

  const isInsideAssignment = (a) => {
    if (!position || !a?.geometry) return false;
    const g = a.geometry;
    if (g.type === 'circle') {
      return distanceMeters(position, g.center) <= (g.radius || 0);
    }
    if (g.type === 'rectangle') {
      return insideRectangle(position, g.start, g.end);
    }
    return false;
  };

  const ensurePosition = () => new Promise((resolve, reject) => {
    if (position) return resolve(position);
    if (!navigator.geolocation) return reject(new Error('Geolocalización no disponible'));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        setPosition(p);
        resolve(p);
      },
      (err) => reject(err),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  });

  const formatHora = (f) => (f ? new Date(f).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '—');
  const formatFechaHora = (d = new Date()) => d.toLocaleString('es', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  const estimarRetraso = (a) => {
    if (!a?.ventana_hasta) return { tarde: false, minutos: 0 };
    const now = new Date();
    const [vh, vm] = String(a.ventana_hasta).split(':').map(Number);
    const limite = new Date(now.getFullYear(), now.getMonth(), now.getDate(), vh || 0, vm || 0, 0);
    if (now <= limite) return { tarde: false, minutos: 0 };
    return { tarde: true, minutos: Math.floor((now - limite) / 60000) };
  };

  const refrescarAsistencias = async () => {
    try {
      const resAsis = await apiService.getAsistencias();
      const dataAsis = resAsis?.data?.data || [];
      setAsistencias(Array.isArray(dataAsis) ? dataAsis : []);
    } catch {}
  };

  const solicitarMarcaje = (a, tipo) => {
    const retraso = tipo === 'entrada' ? estimarRetraso(a) : { tarde: false, minutos: 0 };
    setComentarioMarcaje(retraso.tarde ? '' : 'Tiempo correcto');
    setConfirmMarcaje({ a, tipo, retraso });
  };

  const confirmarMarcaje = async () => {
    if (!confirmMarcaje) return;
    const { a, tipo } = confirmMarcaje;
    const comentario = comentarioMarcaje.trim();
    if (tipo === 'entrada' && confirmMarcaje.retraso?.tarde && !comentario) {
      await alert('Indica el motivo del retraso (ej. tráfico, emergencia).');
      return;
    }
    setConfirmMarcaje(null);
    await handleMarcar(a, tipo, comentario);
  };

  const handleMarcar = async (a, tipo = 'entrada', comentario = '') => {
    try {
      setMarkingId(a.id);
      const p = await ensurePosition();
      if (!isInsideAssignment(a)) {
        await alert('Debes estar dentro del área asignada para marcar asistencia.');
        return;
      }
      const res = await apiService.marcarAsistencia({
        id_asignacion: a.id,
        lat: p[0],
        lng: p[1],
        tipo,
        comentario: comentario || undefined,
      });
      await refrescarAsistencias();
      await alert(res?.data?.message || `Asistencia de ${tipo === 'salida' ? 'salida' : 'entrada'} registrada.`);
    } catch (e) {
      const msg = e?.response?.data?.message || 'No se pudo marcar asistencia.';
      await alert(msg);
    } finally {
      setMarkingId(null);
    }
  };

  const guardarComentarioEditado = async (asistenciaId) => {
    const texto = comentarioEdit.trim();
    if (!texto) {
      await alert('La descripción no puede estar vacía.');
      return;
    }
    try {
      await apiService.actualizarComentarioAsistencia(asistenciaId, texto);
      setEditandoComentarioId(null);
      await refrescarAsistencias();
      await alert('Descripción actualizada.');
    } catch (e) {
      await alert(e?.response?.data?.message || 'No se pudo actualizar la descripción.');
    }
  };

  const handleActualizarUbicacion = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        setPosition(p);
        setAccuracy(pos.coords.accuracy ?? null);
        try { flyTo(p, 19); } catch {}
        setTimeout(() => { try { mapRef.current && mapRef.current.invalidateSize(); } catch {} }, 120);
      },
      (err) => console.warn('Geoloc error:', err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  };

  // Al abrir modal: forzar remount del mapa, centrar e invalidar tamaño
  useEffect(() => {
    if (isModalOpen) {
      setMapKey((k) => k + 1);
      const c = centerMap();
      if (c && mapRef.current) {
        try { mapRef.current.setView(c, 16, { animate: false }); } catch {}
      }
      handleActualizarUbicacion();
      setTimeout(() => { try { mapRef.current && mapRef.current.invalidateSize(); } catch {} }, 150);
      setTimeout(() => { try { mapRef.current && mapRef.current.invalidateSize(); } catch {} }, 400);
    }
  }, [isModalOpen]);

  return (
    <div className="container-fluid">
      <div className="panel-page-header">
        <h2><i className="bi bi-speedometer2 me-2"></i>Panel de control</h2>
        <p>Marcaje de asistencia y ubicaciones asignadas</p>
      </div>

      {loading ? (
        <div className="text-center text-muted py-4">Cargando...</div>
      ) : asignaciones.length === 0 ? (
        <div className="text-center text-muted py-4">No tienes asignaciones pendientes</div>
      ) : (
        <div className="row">
          {asignaciones.map((a) => {
            const diasText = String(a.dias || '')
              .split(',').map((d) => d.trim()).filter(Boolean).join(', ');
            const ubicacionText = a.ubicacion_descripcion ? `${a.ubicacion_nombre} — ${a.ubicacion_descripcion}` : a.ubicacion_nombre;
            const inside = isInsideAssignment(a);
            const entrada = getEntradaHoy(a.id);
            const salida = getSalidaHoy(a.id);
            return (
              <div className="col-lg-6 mb-3" key={a.id}>
                <div className="card panel-card h-100">
                  <div className="card-header d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-bold">{ubicacionText}</div>
                      <div className="text-muted small">Días: {diasText}</div>
                      <div className="text-muted small">Horario: {(a.hora_entrada || '').slice(0,5)} - {(a.hora_salida || '').slice(0,5)}</div>
                    </div>
                    <span className={`badge ${inside ? 'bg-success' : 'bg-secondary'}`}>{inside ? 'Dentro' : 'Fuera'}</span>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <div className="small fw-semibold text-muted mb-1">Marcaje de hoy</div>
                      <div className="d-flex flex-column gap-1 small">
                        <div className="d-flex align-items-center gap-2">
                          <i className={`bi ${entrada ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'}`} style={{ fontSize: '1rem' }}></i>
                          <span>Entrada:</span>
                          {entrada ? (
                            <span className="d-flex flex-column">
                              <span>
                                {formatHora(entrada.fecha_hora)}
                                {entrada.estado === 'tarde' && entrada.minutos_tarde != null && (
                                  <span className="badge bg-warning text-dark ms-1">Tarde ({entrada.minutos_tarde} min)</span>
                                )}
                                {entrada.estado === 'a_tiempo' && (
                                  <span className="badge bg-success ms-1">A tiempo</span>
                                )}
                              </span>
                              {editandoComentarioId === entrada.id ? (
                                <div className="mt-1">
                                  <textarea
                                    className="form-control form-control-sm"
                                    rows={2}
                                    value={comentarioEdit}
                                    onChange={(e) => setComentarioEdit(e.target.value)}
                                    maxLength={500}
                                  />
                                  <div className="d-flex gap-1 mt-1">
                                    <button type="button" className="btn btn-sm btn-primary" onClick={() => guardarComentarioEditado(entrada.id)}>Guardar</button>
                                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEditandoComentarioId(null)}>Cancelar</button>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted mt-1">
                                  <i className="bi bi-chat-left-text me-1"></i>
                                  {entrada.comentario || 'Sin descripción'}
                                  <button
                                    type="button"
                                    className="btn btn-link btn-sm p-0 ms-1"
                                    onClick={() => { setEditandoComentarioId(entrada.id); setComentarioEdit(entrada.comentario || ''); }}
                                  >
                                    Editar
                                  </button>
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted">No marcada</span>
                          )}
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <i className={`bi ${salida ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'}`} style={{ fontSize: '1rem' }}></i>
                          <span>Salida:</span>
                          {salida ? (
                            <span>{formatHora(salida.fecha_hora)}</span>
                          ) : (
                            <span className="text-muted">No marcada</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
                      <div>
                        {!entrada && (
                          <button
                            className="btn btn-sm btn-success"
                            disabled={!inside || markingId === a.id}
                            onClick={() => solicitarMarcaje(a, 'entrada')}
                          >
                            {markingId === a.id ? '...' : <><i className="bi bi-box-arrow-in-right me-1"></i>Marcar entrada</>}
                          </button>
                        )}
                        {entrada && !salida && (
                          <button
                            className="btn btn-sm btn-warning"
                            disabled={!inside || markingId === a.id}
                            onClick={() => solicitarMarcaje(a, 'salida')}
                          >
                            {markingId === a.id ? '...' : <><i className="bi bi-box-arrow-right me-1"></i>Marcar salida</>}
                          </button>
                        )}
                        {entrada && salida && (
                          <span className="badge bg-secondary">Asistencia completa</span>
                        )}
                      </div>
                      <button className="btn btn-sm btn-outline-primary" onClick={() => { setSelectedId(a.id); setModalAssignment(a); setIsModalOpen(true); }}>
                        <i className="bi bi-map me-1"></i>Ver mapa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmMarcaje && (
        <div className="modal d-block panel-confirm-modal" tabIndex="-1" role="dialog" style={{ background: 'rgba(15,23,42,0.55)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div
                className="modal-header"
                style={confirmMarcaje.tipo === 'entrada'
                  ? { background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff' }
                  : undefined}
              >
                <h5 className="modal-title mb-0 text-white">
                  <i className={`bi ${confirmMarcaje.tipo === 'salida' ? 'bi-box-arrow-right' : 'bi-box-arrow-in-right'} me-2`}></i>
                  Confirmar {confirmMarcaje.tipo === 'salida' ? 'salida' : 'entrada'}
                </h5>
                <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={() => setConfirmMarcaje(null)}></button>
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">Revisa los datos antes de registrar:</p>
                <dl className="panel-confirm-detail mb-3">
                  <dt>Ubicación</dt>
                  <dd>
                    {confirmMarcaje.a.ubicacion_descripcion
                      ? `${confirmMarcaje.a.ubicacion_nombre} — ${confirmMarcaje.a.ubicacion_descripcion}`
                      : confirmMarcaje.a.ubicacion_nombre}
                  </dd>
                  <dt>Días asignados</dt>
                  <dd>{String(confirmMarcaje.a.dias || '').split(',').map((d) => d.trim()).filter(Boolean).join(', ') || '—'}</dd>
                  <dt>Horario programado</dt>
                  <dd>{(confirmMarcaje.a.hora_entrada || '').slice(0, 5)} – {(confirmMarcaje.a.hora_salida || '').slice(0, 5)}</dd>
                  {confirmMarcaje.tipo === 'salida' && (
                    <>
                      <dt>Entrada registrada hoy</dt>
                      <dd>{formatHora(getEntradaHoy(confirmMarcaje.a.id)?.fecha_hora)}</dd>
                    </>
                  )}
                  {confirmMarcaje.tipo === 'entrada' && confirmMarcaje.retraso?.tarde && (
                    <>
                      <dt>Estado estimado</dt>
                      <dd>
                        <span className="badge bg-warning text-dark">
                          Tarde (~{confirmMarcaje.retraso.minutos} min)
                        </span>
                      </dd>
                    </>
                  )}
                  <dt>Hora ({confirmMarcaje.tipo === 'salida' ? 'salida' : 'entrada'})</dt>
                  <dd>{formatFechaHora()}</dd>
                  <dt>Ubicación GPS</dt>
                  <dd>
                    <span className={`badge ${isInsideAssignment(confirmMarcaje.a) ? 'bg-success' : 'bg-secondary'}`}>
                      {isInsideAssignment(confirmMarcaje.a) ? 'Dentro del área' : 'Fuera del área'}
                    </span>
                    {!isInsideAssignment(confirmMarcaje.a) && (
                      <span className="text-danger small d-block mt-1">Debes estar dentro del área para confirmar.</span>
                    )}
                  </dd>
                </dl>
                {confirmMarcaje.tipo === 'entrada' && (
                  <div>
                    <label className="form-label fw-semibold">
                      Descripción {confirmMarcaje.retraso?.tarde ? <span className="text-danger">*</span> : '(opcional)'}
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      maxLength={500}
                      placeholder={confirmMarcaje.retraso?.tarde
                        ? 'Ej: Llegué tarde por tráfico en la avenida principal...'
                        : 'Tiempo correcto (puedes dejarlo así o agregar un comentario)'}
                      value={comentarioMarcaje}
                      onChange={(e) => setComentarioMarcaje(e.target.value)}
                    />
                    <div className="form-text">
                      {confirmMarcaje.retraso?.tarde
                        ? 'Obligatorio si llegas tarde. Explica el motivo del retraso.'
                        : 'Por defecto: "Tiempo correcto". Puedes editarlo después.'}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setConfirmMarcaje(null)}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className={`btn ${confirmMarcaje.tipo === 'salida' ? 'btn-warning' : 'btn-success'}`}
                  disabled={!isInsideAssignment(confirmMarcaje.a) || markingId === confirmMarcaje.a.id}
                  onClick={confirmarMarcaje}
                >
                  <i className="bi bi-check-lg me-1"></i>
                  {markingId === confirmMarcaje.a.id ? 'Registrando...' : `Confirmar ${confirmMarcaje.tipo}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title mb-0"><i className="bi bi-geo-alt me-2"></i>{modalAssignment?.ubicacion_nombre}</h5>
                  <div className="small text-muted">
                    Días: {String(modalAssignment?.dias || '').split(',').map((d) => d.trim()).filter(Boolean).join(', ')} · Horario: {(modalAssignment?.hora_entrada || '').slice(0,5)} - {(modalAssignment?.hora_salida || '').slice(0,5)}
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => { setIsModalOpen(false); setModalAssignment(null); }} aria-label="Close"></button>
              </div>
              <div className="modal-body" style={{ minHeight: 300 }}>
                <div style={{ height: 480, width: '100%' }}>
                  <MapContainer key={mapKey} center={centerMap()} zoom={16} maxZoom={20} whenCreated={(map)=> (mapRef.current = map)} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {position && (
                      <Marker position={position}>
                        <Popup>Tu ubicación actual</Popup>
                      </Marker>
                    )}
                    {position && accuracy && (
                      <Circle center={position} radius={Math.max(accuracy, 10)} pathOptions={{ color: '#3388ff' }} />
                    )}
                    {modalAssignment?.geometry?.type === 'circle' && (
                      <Circle center={modalAssignment.geometry.center} radius={modalAssignment.geometry.radius} pathOptions={{ color: isInsideAssignment(modalAssignment) ? 'green' : 'red' }} />
                    )}
                    {modalAssignment?.geometry?.type === 'rectangle' && (
                      <Rectangle bounds={[modalAssignment.geometry.start, modalAssignment.geometry.end]} pathOptions={{ color: isInsideAssignment(modalAssignment) ? 'green' : 'red' }} />
                    )}
                  </MapContainer>
                </div>
              </div>
              <div className="modal-footer d-flex justify-content-between align-items-center">
                <div className="small text-muted">
                  {accuracy ? `Precisión: ±${Math.round(accuracy)} m` : 'Precisión desconocida'}
                </div>
                <div className="flex-grow-1 text-center">
                  <span className={`badge ${isInsideAssignment(modalAssignment) ? 'bg-success' : 'bg-secondary'}`}>
                    {isInsideAssignment(modalAssignment) ? 'Dentro del área' : 'Fuera del área'}
                  </span>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary" onClick={handleActualizarUbicacion}>
                    <i className="bi bi-arrow-clockwise me-1"></i>Actualizar ubicación
                  </button>
                  {!hasEntradaHoy(modalAssignment?.id) && (
                    <button className="btn btn-success" disabled={!isInsideAssignment(modalAssignment) || markingId === modalAssignment?.id} onClick={() => solicitarMarcaje(modalAssignment, 'entrada')}>
                      {markingId === modalAssignment?.id ? 'Marcando...' : 'Marcar entrada'}
                    </button>
                  )}
                  {hasEntradaHoy(modalAssignment?.id) && !hasSalidaHoy(modalAssignment?.id) && (
                    <button className="btn btn-warning" disabled={!isInsideAssignment(modalAssignment) || markingId === modalAssignment?.id} onClick={() => solicitarMarcaje(modalAssignment, 'salida')}>
                      {markingId === modalAssignment?.id ? 'Marcando...' : 'Marcar salida'}
                    </button>
                  )}
                  {hasEntradaHoy(modalAssignment?.id) && hasSalidaHoy(modalAssignment?.id) && (
                    <span className="badge bg-secondary align-self-center">Asistencia del día completa</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;

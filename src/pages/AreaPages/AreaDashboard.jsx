import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';
import jsPDF from 'jspdf';

const AreaDashboard = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

  const [stats, setStats] = useState({ totalRoles: 0, totalTrabajadores: 0 });
  const [metricas, setMetricas] = useState(null);
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadingReporte, setLoadingReporte] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const [rolesRes, trabRes] = await Promise.all([
          apiService.getRolesByArea(userData.id_area_laboral),
          apiService.getTrabajadoresByPersonalArea(userData.id),
        ]);
        const todos = trabRes?.data?.data || [];
        const filtrados = todos.filter((t) => t.username !== userData.username);
        setStats({
          totalRoles: rolesRes?.data?.data?.length || 0,
          totalTrabajadores: filtrados.length,
        });
      } catch (err) {
        console.error('Error cargando datos:', err);
      } finally {
        setLoading(false);
      }
    };
    if (userData.id && userData.id_area_laboral) loadStats();
  }, [userData.id, userData.id_area_laboral, userData.username]);

  const cargarReporte = useCallback(async () => {
    if (!userData.id) return;
    try {
      setLoadingReporte(true);
      const res = await apiService.getReporteEncargado(selectedDate);
      const data = res?.data?.data;
      setMetricas(data?.metricas || null);
      setTrabajadores(data?.trabajadores || []);
    } catch (err) {
      console.error('Error cargando reporte:', err);
      setMetricas(null);
      setTrabajadores([]);
    } finally {
      setLoadingReporte(false);
    }
  }, [selectedDate, userData.id]);

  useEffect(() => {
    cargarReporte();
  }, [cargarReporte]);

  const cambiarFecha = (dias) => {
    const nueva = new Date(selectedDate + 'T12:00:00');
    nueva.setDate(nueva.getDate() + dias);
    setSelectedDate(nueva.toISOString().split('T')[0]);
  };

  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr + 'T12:00:00');
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    if (fecha.toDateString() === hoy.toDateString()) return 'Hoy';
    if (fecha.toDateString() === ayer.toDateString()) return 'Ayer';
    return fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const formatHora = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const exportarCSV = () => {
    const headers = ['Trabajador', 'Usuario', 'Roles', 'Entrada', 'Salida', 'Estado', 'Descripción'];
    const rows = trabajadores.map((t) => [
      t.nombre_completo,
      t.username,
      t.roles_asignados || '',
      t.marco_entrada ? formatHora(t.hora_entrada) : 'No marcó',
      t.marco_salida ? formatHora(t.hora_salida) : (t.marco_entrada ? 'Sin salida' : '—'),
      !t.marco_entrada ? 'No marcó' : t.estado_entrada === 'tarde' ? `Tarde (${t.minutos_tarde || 0} min)` : t.estado_entrada === 'a_tiempo' ? 'A tiempo' : 'Marcado',
      t.comentario || '—',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${selectedDate}_${userData.area_descripcion?.replace(/\s+/g, '_') || 'area'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const fecha = new Date(selectedDate + 'T12:00:00');
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Asistencias', 14, 15);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${fecha.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 22);
    doc.text(`Área: ${userData.area_descripcion || 'N/A'}`, 14, 28);
    if (metricas) {
      doc.text(`Puntualidad: ${metricas.puntualidad_pct}% | Marcaron: ${metricas.marcaron_entrada}/${metricas.total_trabajadores}`, 14, 34);
    }

    const headers = ['#', 'Trabajador', 'Entrada', 'Salida', 'Estado', 'Descripción'];
    const widths = [10, 55, 28, 28, 35, 70];
    let y = 42;
    const rh = 8;
    doc.setFillColor(52, 58, 64);
    doc.rect(14, y - 5, 260, rh, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    let x = 14;
    headers.forEach((h, i) => { doc.text(h, x + 2, y); x += widths[i]; });
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    y += rh;

    trabajadores.forEach((t, i) => {
      const estado = !t.marco_entrada ? 'No marcó'
        : t.estado_entrada === 'tarde' ? `Tarde ${t.minutos_tarde || 0}m`
        : t.estado_entrada === 'a_tiempo' ? 'A tiempo' : 'Marcado';
      const row = [
        String(i + 1),
        t.nombre_completo,
        t.marco_entrada ? formatHora(t.hora_entrada) : '—',
        t.marco_salida ? formatHora(t.hora_salida) : '—',
        estado,
        (t.comentario || '—').slice(0, 60),
      ];
      if (i % 2 === 0) { doc.setFillColor(248, 249, 250); doc.rect(14, y - 5, 260, rh, 'F'); }
      x = 14;
      row.forEach((cell, idx) => { doc.text(String(cell).slice(0, 40), x + 2, y); x += widths[idx]; });
      y += rh;
    });

    doc.save(`asistencias_${selectedDate}.pdf`);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border" role="status"><span className="visually-hidden">Cargando...</span></div>
      </div>
    );
  }

  const m = metricas || {};

  return (
    <div className="container-fluid">
      <div className="panel-page-header">
        <h2><i className="bi bi-speedometer2 me-2"></i>Panel de control</h2>
        <p>Resumen, métricas y reporte de asistencias de tu personal</p>
      </div>

      {/* Métricas del día */}
      <div className="row mb-4 g-3">
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card panel-card h-100 border-0 text-center">
            <div className="card-body py-3">
              <div className="text-muted small text-uppercase">Trabajadores</div>
              <div className="fs-3 fw-bold text-primary">{m.total_trabajadores ?? stats.totalTrabajadores}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card panel-card h-100 border-0 text-center">
            <div className="card-body py-3">
              <div className="text-muted small text-uppercase">Marcaron</div>
              <div className="fs-3 fw-bold text-success">{m.marcaron_entrada ?? '—'}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card panel-card h-100 border-0 text-center">
            <div className="card-body py-3">
              <div className="text-muted small text-uppercase">No marcaron</div>
              <div className="fs-3 fw-bold text-danger">{m.no_marcaron ?? '—'}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card panel-card h-100 border-0 text-center">
            <div className="card-body py-3">
              <div className="text-muted small text-uppercase">A tiempo</div>
              <div className="fs-3 fw-bold text-info">{m.a_tiempo ?? '—'}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card panel-card h-100 border-0 text-center">
            <div className="card-body py-3">
              <div className="text-muted small text-uppercase">Tarde</div>
              <div className="fs-3 fw-bold text-warning">{m.tarde ?? '—'}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card panel-card h-100 border-0 text-center">
            <div className="card-body py-3">
              <div className="text-muted small text-uppercase">Puntualidad</div>
              <div className="fs-3 fw-bold">{m.puntualidad_pct != null ? `${m.puntualidad_pct}%` : '—'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4 g-3">
        <div className="col-md-4">
          <div className="card panel-card border-info h-100">
            <div className="card-body d-flex align-items-center">
              <i className="bi bi-tags fs-2 text-info me-3"></i>
              <div>
                <div className="text-muted small">Roles creados</div>
                <div className="fs-4 fw-bold">{stats.totalRoles}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card panel-card border-warning h-100">
            <div className="card-body d-flex align-items-center">
              <i className="bi bi-box-arrow-right fs-2 text-warning me-3"></i>
              <div>
                <div className="text-muted small">Con salida registrada</div>
                <div className="fs-4 fw-bold">{m.con_salida ?? '—'}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card panel-card border-secondary h-100">
            <div className="card-body d-flex align-items-center">
              <i className="bi bi-hourglass-split fs-2 text-secondary me-3"></i>
              <div>
                <div className="text-muted small">Entrada sin salida</div>
                <div className="fs-4 fw-bold">{m.sin_salida ?? '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card panel-card">
        <div className="card-header bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h5 className="mb-1 fw-bold">
                <i className="bi bi-calendar-check-fill me-2 text-primary"></i>
                Reporte de asistencias
              </h5>
              <span className="text-muted small">
                <i className="bi bi-calendar3 me-1"></i>{formatearFecha(selectedDate)}
                <span className="mx-2">·</span>
                <i className="bi bi-building me-1"></i>{userData.area_descripcion}
              </span>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button className="btn btn-sm btn-outline-secondary" onClick={() => cambiarFecha(-1)}><i className="bi bi-chevron-left"></i></button>
              <input type="date" className="form-control form-control-sm" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ width: '140px' }} />
              <button className="btn btn-sm btn-outline-secondary" onClick={() => cambiarFecha(1)} disabled={selectedDate >= new Date().toISOString().split('T')[0]}><i className="bi bi-chevron-right"></i></button>
              <button className="btn btn-sm btn-primary" onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}>Hoy</button>
              <button className="btn btn-sm btn-outline-primary" onClick={cargarReporte} disabled={loadingReporte}><i className="bi bi-arrow-clockwise"></i></button>
              <button className="btn btn-sm btn-success" onClick={exportarCSV} disabled={!trabajadores.length}><i className="bi bi-file-earmark-spreadsheet me-1"></i>CSV</button>
              <button className="btn btn-sm btn-danger" onClick={exportarPDF} disabled={!trabajadores.length}><i className="bi bi-file-pdf me-1"></i>PDF</button>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          {loadingReporte ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : trabajadores.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-people fs-1 d-block mb-2"></i>
              <p className="mb-0">No hay trabajadores bajo tu encargo</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="ps-3">#</th>
                    <th>Trabajador</th>
                    <th>Roles</th>
                    <th className="text-center">Entrada</th>
                    <th className="text-center">Salida</th>
                    <th className="text-center">Estado</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {trabajadores.map((t, index) => (
                    <tr key={t.id}>
                      <td className="ps-3 text-muted">{index + 1}</td>
                      <td>
                        <strong>{t.nombre_completo}</strong>
                        <div className="small text-muted">@{t.username}</div>
                      </td>
                      <td><span className="small">{t.roles_asignados || '—'}</span></td>
                      <td className="text-center">{t.marco_entrada ? formatHora(t.hora_entrada) : <span className="badge bg-danger">No</span>}</td>
                      <td className="text-center">
                        {!t.marco_entrada ? '—' : t.marco_salida ? formatHora(t.hora_salida) : <span className="badge bg-secondary">Pendiente</span>}
                      </td>
                      <td className="text-center">
                        {!t.marco_entrada ? <span className="badge bg-danger">No marcó</span>
                          : t.estado_entrada === 'tarde' ? <span className="badge bg-warning text-dark">Tarde {t.minutos_tarde}m</span>
                          : t.estado_entrada === 'a_tiempo' ? <span className="badge bg-success">A tiempo</span>
                          : <span className="badge bg-secondary">Marcado</span>}
                      </td>
                      <td className="small" style={{ maxWidth: '220px' }}>
                        {t.comentario ? (
                          <span title={t.comentario}><i className="bi bi-chat-left-text me-1 text-muted"></i>{t.comentario}</span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AreaDashboard;

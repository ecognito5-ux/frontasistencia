import { useState, useEffect } from 'react';
import { useDialog } from '../../hooks/useDialog.jsx';
import { apiService } from '../../services/api';

const Historial = () => {
  const { alert } = useDialog();
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const [registros, setRegistros] = useState([]);

  const cargarHistorial = async () => {
    try {
      const res = await apiService.getAsistencias({ trabajadorId: userData.id });
      const data = res?.data?.data || [];
      setRegistros(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error cargando historial de asistencias:', e);
    }
  };

  useEffect(() => { cargarHistorial(); }, [userData.id]);

  const exportarHistorial = () => {
    const texto = registros.map(r => {
      const fecha = new Date(r.fecha_hora);
      const tipo = (r.tipo === 'salida' ? 'SALIDA' : 'ENTRADA');
      const ubic = r.ubicacion_descripcion ? `${r.ubicacion_nombre} — ${r.ubicacion_descripcion}` : r.ubicacion_nombre;
      return `${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()} | ${tipo} | ${ubic}`;
    }).join('\n');
    navigator.clipboard.writeText(texto).then(async () => {
      await alert('Historial copiado al portapapeles');
    }).catch(async () => { await alert('Error al copiar historial'); });
  };

  return (
    <div className="container-fluid">
      <div className="panel-page-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="mb-0"><i className="bi bi-calendar-check me-2"></i>Historial de Asistencias</h2>
        </div>
        <div className="d-flex gap-2 flex-shrink-0">
          <button className="btn btn-light btn-sm" onClick={cargarHistorial}>
            <i className="bi bi-arrow-clockwise me-2"></i>Actualizar
          </button>
          <button className="btn btn-outline-light btn-sm" onClick={exportarHistorial} disabled={registros.length === 0}>
            <i className="bi bi-download me-2"></i>Exportar
          </button>
        </div>
      </div>

      <div className="card panel-card">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0"><i className="bi bi-table me-2"></i>Registros</h5>
        </div>
        <div className="card-body">
          {registros.length === 0 ? (
            <div className="text-center py-5 text-muted">Sin registros</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Tipo</th>
                    <th>Ubicación</th>
                    <th>Horario</th>
                    <th>Días</th>
                    <th>Estado</th>
                    <th>Retraso</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r, idx) => (
                    <tr key={idx}>
                      <td>{new Date(r.fecha_hora).toLocaleDateString()}</td>
                      <td>{new Date(r.fecha_hora).toLocaleTimeString()}</td>
                      <td>
                        <span className={`badge ${r.tipo === 'salida' ? 'bg-warning text-dark' : 'bg-success'}`}>
                          {r.tipo === 'salida' ? 'Salida' : 'Entrada'}
                        </span>
                      </td>
                      <td>{r.ubicacion_descripcion ? `${r.ubicacion_nombre} — ${r.ubicacion_descripcion}` : r.ubicacion_nombre}</td>
                      <td>{(r.hora_entrada || '').slice(0,5)} - {(r.hora_salida || '').slice(0,5)}</td>
                      <td>{String(r.dias || '').split(',').map((d)=>d.trim()).filter(Boolean).join(', ')}</td>
                      <td>
                        {r.tipo === 'entrada' ? (
                          <span className={`badge ${r.estado === 'tarde' ? 'bg-warning text-dark' : 'bg-success'}`}>
                            {r.estado === 'tarde' ? 'Tarde' : 'A tiempo'}
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        {r.estado === 'tarde' && r.minutos_tarde != null
                          ? `${r.minutos_tarde} min`
                          : '-'}
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

export default Historial;



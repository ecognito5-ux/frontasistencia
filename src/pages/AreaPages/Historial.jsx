import { useEffect, useMemo, useState } from 'react';
import { apiService } from '../../services/api';

const AreaHistorial = () => {
  const userData = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('userData') || '{}'); } catch { return {}; }
  }, []);
  const [loading, setLoading] = useState(true);
  const [asistencias, setAsistencias] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Filtra por creador (encargado actual) para no cruzar áreas
        const res = await apiService.getAsistencias({ creadorId: userData.id });
        const data = res?.data?.data || res?.data || [];
        setAsistencias(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Error cargando historial de área:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userData.id]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="bi bi-clock-history me-2"></i>Historial de Asistencias del Área</h2>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Fecha y hora</th>
                  <th>Trabajador</th>
                  <th>Ubicación</th>
                  <th>Días</th>
                  <th>Horario</th>
                  <th>Estado</th>
                  <th>Retraso</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-4">Cargando...</td></tr>
                ) : asistencias.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-4 text-muted">Sin asistencias registradas</td></tr>
                ) : (
                  asistencias.map((a) => (
                    <tr key={a.id}>
                      <td>{new Date(a.fecha_hora).toLocaleString()}</td>
                      <td>{a.trabajador_nombre}</td>
                      <td>{a.ubicacion_descripcion ? `${a.ubicacion_nombre} — ${a.ubicacion_descripcion}` : a.ubicacion_nombre}</td>
                      <td>{String(a.dias || '').split(',').map((d)=>d.trim()).filter(Boolean).join(', ')}</td>
                      <td>{(a.hora_entrada || '').slice(0,5)} - {(a.hora_salida || '').slice(0,5)}</td>
                      <td>
                        {a.tipo === 'entrada' ? (
                          <span className={`badge ${a.estado === 'tarde' ? 'bg-warning text-dark' : 'bg-success'}`}>
                            {a.estado === 'tarde' ? 'Tarde' : 'A tiempo'}
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        {a.estado === 'tarde' && a.minutos_tarde != null
                          ? `${a.minutos_tarde} min`
                          : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaHistorial;



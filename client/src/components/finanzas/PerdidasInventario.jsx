import { useState, useEffect } from 'react';
import { listarPerdidasInventario } from '../../services/perdidasInventario.service.js';
import '../../styles/CierreMensual.css';

const MESES = [
  { valor: 1, nombre: 'Enero' },
  { valor: 2, nombre: 'Febrero' },
  { valor: 3, nombre: 'Marzo' },
  { valor: 4, nombre: 'Abril' },
  { valor: 5, nombre: 'Mayo' },
  { valor: 6, nombre: 'Junio' },
  { valor: 7, nombre: 'Julio' },
  { valor: 8, nombre: 'Agosto' },
  { valor: 9, nombre: 'Septiembre' },
  { valor: 10, nombre: 'Octubre' },
  { valor: 11, nombre: 'Noviembre' },
  { valor: 12, nombre: 'Diciembre' },
];

const ETIQUETA_TIPO = {
  DANO: { texto: 'DAÑO', clase: 'cm-badge-dano' },
  PERDIDA: { texto: 'PÉRDIDA', clase: 'cm-badge-perdida' },
  ROBO: { texto: 'ROBO', clase: 'cm-badge-robo' },
};

export default function PerdidasInventario() {
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1;

  const [anio, setAnio] = useState(anioActual);
  const [mes, setMes] = useState(mesActual);

  const [incidentes, setIncidentes] = useState([]);
  const [totalPerdidas, setTotalPerdidas] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        setError('');
        const res = await listarPerdidasInventario(anio, mes);
        const data = res?.data || res || {};
        setIncidentes(data.incidentes || []);
        setTotalPerdidas(Number(data.total_perdidas || 0));
      } catch (err) {
        setError(err.message || 'Error al cargar el reporte de pérdidas.');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [anio, mes]);

  const nombreMes = MESES.find((m) => m.valor === Number(mes))?.nombre || '';

  return (
    <div className="cm-contenedor">
      {/* Selector de Período */}
      <div className="cm-periodo-barra">
        <div className="cm-periodo-controles">
          <span className="cm-periodo-label">Período Contable:</span>
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="cm-select-mes"
          >
            {MESES.map((m) => {
              const futuro = Number(anio) === anioActual && m.valor > mesActual;
              return (
                <option key={m.valor} value={m.valor} disabled={futuro}>
                  {m.nombre} {futuro ? '(Futuro - Bloqueado)' : ''}
                </option>
              );
            })}
          </select>

          <input
            type="number"
            min="2000"
            max={anioActual}
            value={anio}
            onChange={(e) => {
              const val = Number(e.target.value);
              const nuevoAnio = val > anioActual ? anioActual : val;
              setAnio(nuevoAnio);
              if (nuevoAnio === anioActual && Number(mes) > mesActual) {
                setMes(mesActual);
              }
            }}
            className="cm-input-anio"
          />
        </div>

        <span className="cm-total-perdido-cab">
          Total Perdido en el Mes: ${totalPerdidas.toLocaleString('es-CL')}
        </span>
      </div>

      {error && <div className="cm-alerta-error">{error}</div>}

      {/* Tabla RF-P8-03 */}
      <div className="cm-card">
        <h3 className="cm-card-titulo">
          Reporte de Pérdidas de Inventario — {nombreMes} {anio}
        </h3>

        {cargando ? (
          <p className="cm-texto-carga">Cargando incidentes del mes...</p>
        ) : incidentes.length === 0 ? (
          <div className="cm-vacio">
            No hay incidentes de pérdida, daño o robo registrados en este mes.
          </div>
        ) : (
          <div className="cm-tabla-scroll-lg">
            <table className="cm-tabla">
              <thead>
                <tr>
                  <th>EQUIPO</th>
                  <th>TIPO</th>
                  <th>ORIGEN</th>
                  <th>RESPONSABLE</th>
                  <th className="cm-th-der">VALOR</th>
                </tr>
              </thead>
              <tbody>
                {incidentes.map((inc) => {
                  const badge = ETIQUETA_TIPO[inc.tipo] || {
                    texto: inc.tipo,
                    clase: '',
                  };
                  return (
                    <tr key={inc.id_incidente}>
                      <td className="cm-td-fuerte">{inc.equipo}</td>
                      <td>
                        <span className={`cm-badge-tipo ${badge.clase}`}>
                          {badge.texto}
                        </span>
                      </td>
                      <td className="cm-td-texto">{inc.origen}</td>
                      <td className="cm-td-texto">{inc.responsable}</td>
                      <td className="cm-td-monto-neg">
                        ${inc.valor.toLocaleString('es-CL')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
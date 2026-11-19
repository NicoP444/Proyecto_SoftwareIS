import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerPanel } from "../../services/panel.service.js";

const plata = (n) =>
  (Number(n) < 0 ? "-$" : "$") +
  Math.abs(Number(n ?? 0)).toLocaleString("es-CL");
const horaDe = (valor) => (valor ? String(valor).slice(11, 16) : "");
// "2026-11-05T00:00:00.000Z" -> "05/11"
const fechaCorta = (f) =>
  String(f).slice(0, 10).split("-").reverse().slice(0, 2).join("/");

const Vacio = ({ texto }) => (
  <div className="empty">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
    {texto}
  </div>
);

// Tarjeta de arriba; si trae "ruta", al hacer clic lleva a esa pantalla
function Kpi({ titulo, valor, nota, color, claseValor = "dato", ruta }) {
  const navigate = useNavigate();
  return (
    <div
      className={`kpi kpi-${color} ${ruta ? "clickeable" : ""}`}
      onClick={ruta ? () => navigate(ruta) : undefined}
    >
      <span className="kpi-label">{titulo}</span>
      <span className={`kpi-value ${claseValor}`}>{valor}</span>
      <span className="kpi-note">{nota}</span>
    </div>
  );
}

// Un panel con título y un enlace "Ver ... →" arriba a la derecha
function Panel({ titulo, enlace, ruta, children }) {
  const navigate = useNavigate();
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>{titulo}</h3>
        {enlace && (
          <button
            type="button"
            className="panel-link"
            onClick={() => navigate(ruta)}
          >
            {enlace} →
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function ListaEventos({ eventos, conKits = false }) {
  if (eventos.length === 0)
    return <Vacio texto="No hay transmisiones próximas" />;
  return (
    <div className="lista-panel">
      {eventos.map((e) => (
        <div key={e.id_evento} className="fila-panel">
          <div>
            <strong>{e.tipo}</strong>
            <small>
              {e.cliente?.nombre} · {e.direccion}
            </small>
            {conKits && (
              <small>
                Kits:{" "}
                {e.reservas_kit?.length > 0
                  ? e.reservas_kit.map((r) => r.kit.nombre).join(", ")
                  : "sin kits asignados"}
              </small>
            )}
          </div>
          <div className="fila-panel-der">
            <strong>{fechaCorta(e.fecha)}</strong>
            <small>
              {horaDe(e.hora_inicio)} – {horaDe(e.hora_termino)}
            </small>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Dueño ----------
function VistaDueno({ datos }) {
  const navigate = useNavigate();
  const r = datos.resultado_mes;
  const color = r.resultado === "PERDIDA" ? "rojo" : "verde";
  const clase = r.resultado === "PERDIDA" ? "valor-negativo" : "valor-positivo";
  const nombreResultado = {
    GANANCIA: "Ganancia",
    PERDIDA: "Pérdida",
    EQUILIBRIO: "Equilibrio",
  }[r.resultado];

  return (
    <>
      <section className="kpis">
        <Kpi
          titulo="Resultado del mes"
          valor={plata(r.utilidad_neta)}
          nota={nombreResultado}
          color={color}
          claseValor={clase}
          ruta="/finanzas"
        />
        <Kpi
          titulo="Próximos eventos"
          valor={datos.total_proximos ?? datos.proximos_eventos.length}
          nota="Ver calendario"
          color="azul"
          ruta="/calendario"
        />
        <Kpi
          titulo="Alertas"
          valor={datos.alertas.length}
          nota={
            datos.alertas.length === 0 ? "Todo al día" : "Requieren tu atención"
          }
          color={datos.alertas.length === 0 ? "verde" : "naranja"}
        />
      </section>

      <section className="panels-row">
        <Panel
          titulo="Próximos eventos"
          enlace="Ver calendario"
          ruta="/calendario"
        >
          <ListaEventos eventos={datos.proximos_eventos} />
        </Panel>
        <Panel titulo="Alertas" enlace="Ver reportes" ruta="/finanzas">
          {datos.alertas.length === 0 ? (
            <Vacio texto="No hay alertas pendientes" />
          ) : (
            <div className="lista-panel">
              {datos.alertas.map((a) => (
                <div
                  key={a.clave}
                  className="fila-panel fila-alerta"
                  onClick={() => navigate(a.ruta)}
                >
                  <span>{a.texto}</span>
                  <span className="badge-alerta">{a.cantidad}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>
    </>
  );
}

// ---------- Contador ----------
function VistaContador({ datos }) {
  const saldos = datos.saldos_por_cobrar;
  const rem = datos.remuneraciones_por_pagar;
  const acuerdos = datos.acuerdos_vencidos;

  return (
    <>
      <section className="kpis">
        <Kpi
          titulo="Rendiciones pendientes"
          valor={datos.rendiciones_pendientes}
          nota="Trabajadores por rendir"
          color="naranja"
          ruta="/finanzas"
        />
        <Kpi
          titulo="Saldos por cobrar"
          valor={plata(saldos.total)}
          nota={`${saldos.cantidad} evento(s)`}
          color="azul"
          ruta="/calendario"
        />
        <Kpi
          titulo="Remuneraciones por pagar"
          valor={plata(rem.total)}
          nota={`${rem.cantidad} trabajador(es)`}
          color="naranja"
          ruta="/finanzas"
        />
        <Kpi
          titulo="Acuerdos vencidos"
          valor={acuerdos.cantidad}
          nota="Auspicios sin cumplir"
          color={acuerdos.cantidad > 0 ? "rojo" : "verde"}
          ruta="/auspiciadores"
        />
      </section>

      <section className="panels-row">
        <Panel
          titulo="Saldos por cobrar"
          enlace="Ver calendario"
          ruta="/calendario"
        >
          {saldos.eventos.length === 0 ? (
            <Vacio texto="No hay saldos pendientes" />
          ) : (
            <div className="lista-panel">
              {saldos.eventos.map((e) => (
                <div key={e.id_evento} className="fila-panel">
                  <div>
                    <strong>{e.tipo}</strong>
                    <small>
                      {e.cliente} · {fechaCorta(e.fecha)}
                    </small>
                  </div>
                  <strong>{plata(e.saldo)}</strong>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel
          titulo="Acuerdos vencidos"
          enlace="Ver auspiciadores"
          ruta="/auspiciadores"
        >
          {acuerdos.lista.length === 0 ? (
            <Vacio texto="No hay acuerdos vencidos" />
          ) : (
            <div className="lista-panel">
              {acuerdos.lista.map((a) => (
                <div key={a.id_acuerdo} className="fila-panel">
                  <div>
                    <strong>{a.auspiciador?.nombre}</strong>
                    <small>
                      {a.glosa} · plazo {fechaCorta(a.fecha_comprometida)}
                    </small>
                  </div>
                  <strong>{plata(a.monto_comprometido)}</strong>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>
    </>
  );
}

// ---------- Jefe de área técnica (sin datos financieros) ----------
function VistaJefe({ datos }) {
  return (
    <>
      <section className="kpis">
        <Kpi
          titulo="Próximos eventos"
          valor={datos.total_proximos ?? datos.proximos_eventos.length}
          nota="Ver calendario"
          color="azul"
          ruta="/calendario"
        />
        <Kpi
          titulo="Kits en terreno"
          valor={datos.kits_en_terreno.length}
          nota="Aún sin retorno registrado"
          color="naranja"
          ruta="/salida-kits"
        />
        <Kpi
          titulo="Kits sin retorno"
          valor={datos.kits_sin_retorno}
          nota="Más de 24 horas desde el término"
          color={datos.kits_sin_retorno > 0 ? "rojo" : "verde"}
          ruta="/salida-kits"
        />
      </section>

      <section className="panels-row">
        <Panel
          titulo="Próximos eventos y sus kits"
          enlace="Ver calendario"
          ruta="/calendario"
        >
          <ListaEventos eventos={datos.proximos_eventos} conKits />
        </Panel>
        <Panel
          titulo="Kits en terreno"
          enlace="Ver salidas"
          ruta="/salida-kits"
        >
          {datos.kits_en_terreno.length === 0 ? (
            <Vacio texto="No hay kits en terreno" />
          ) : (
            <div className="lista-panel">
              {datos.kits_en_terreno.map((s) => (
                <div key={s.id_salida} className="fila-panel">
                  <div>
                    <strong>{s.reserva.kit.nombre}</strong>
                    <small>
                      {s.reserva.evento.tipo} ·{" "}
                      {fechaCorta(s.reserva.evento.fecha)}
                    </small>
                  </div>
                  <small>{s.responsable?.trabajador?.nombre}</small>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>
    </>
  );
}

/**
 * RF-T-07: panel de inicio según el rol.
 *  Dueño: resultado del mes, próximos eventos y alertas.
 *  Contador: rendiciones pendientes, saldos por cobrar, remuneraciones por pagar y acuerdos vencidos.
 *  Jefe técnico: próximos eventos con sus kits, kits en terreno y kits sin retorno.
 */
export default function PanelPorRol({ rol }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let vigente = true;
    setDatos(null);
    setError("");
    obtenerPanel(rol)
      .then((d) => vigente && setDatos(d))
      .catch((err) => vigente && setError(err.message));
    return () => {
      vigente = false;
    };
  }, [rol]);

  const titulo = (
    <div className="section-heading">
      <h2>
        Resumen de {new Date().toLocaleString("es-CL", { month: "long" })}
      </h2>
      <span className="section-line" />
    </div>
  );

  if (error) {
    return (
      <>
        {titulo}
        <Panel titulo="No se pudo cargar el panel">
          <Vacio texto={error} />
        </Panel>
      </>
    );
  }
  if (!datos) {
    return (
      <>
        {titulo}
        <p className="texto-carga">Cargando panel…</p>
      </>
    );
  }

  return (
    <>
      {titulo}
      {datos.rol === "DUENO" && <VistaDueno datos={datos} />}
      {datos.rol === "CONTADOR" && <VistaContador datos={datos} />}
      {datos.rol === "JEFE_TECNICO" && <VistaJefe datos={datos} />}
    </>
  );
}

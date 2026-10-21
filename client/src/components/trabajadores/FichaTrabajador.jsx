import { useEffect, useState } from 'react';
import { CalendarDays, CalendarRange, Clock, Mail, Phone, Tags, UserRound } from 'lucide-react';
import { actualizarTrabajador, listarDisponibilidad } from '../../services/personalServicio.js';
import { SemanaMarcada } from './TarjetaTrabajador';
import EditorDisponibilidad from './EditorDisponibilidad';
import RolesTrabajador from './RolesTrabajador';
import FormularioTrabajador from './FormularioTrabajador';
import { horasSemanales, iniciales, nombreCompleto, rolesDe, textoEstado, textoPeriodo } from './ayudas.js';

/** Cuadro con un número destacado (mismo estilo que el Panel Principal). */
function Indicador({ icono: Icono, titulo, valor, detalle, color }) {
  return (
    <div className={`indicador ${color}`}>
      <span className="indicador-titulo">
        <Icono size={16} /> {titulo}
      </span>
      <strong className="indicador-valor">{valor}</strong>
      <span className="indicador-detalle">{detalle}</span>
    </div>
  );
}

/** Caja blanca con título e ícono. */
function Seccion({ icono: Icono, titulo, descripcion, children }) {
  return (
    <section className="seccion">
      <div className="seccion-cabecera">
        <Icono size={18} />
        <div>
          <h3>{titulo}</h3>
          <p>{descripcion}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

/**
 * Ficha completa del trabajador: todo visible y editable de inmediato.
 * Clic 1: abrir la ficha · Clic 2: guardar.
 */
export default function FichaTrabajador({ trabajador, roles, onCambio, onCrearRol, onEditarRol }) {
  const [disponibilidad, setDisponibilidad] = useState([]);
  const nombre = nombreCompleto(trabajador);
  const rolesAsignados = rolesDe(trabajador);
    const comisionMaxima = Math.max(0, ...rolesAsignados.map((r) => Number(r.porcentaje_referencial ?? 0)));

  function cargarDisponibilidad() {
    listarDisponibilidad(trabajador.id_trabajador)
      .then(setDisponibilidad)
      .catch(() => setDisponibilidad([]));
  }

  // Se pide la disponibilidad cada vez que se abre la ficha de otro trabajador
  useEffect(cargarDisponibilidad, [trabajador.id_trabajador]); // eslint-disable-line react-hooks/exhaustive-deps

  async function guardarDatos(datos) {
    await actualizarTrabajador(trabajador.id_trabajador, datos);
    onCambio();
  }

  return (
    <div className="ficha">
      {/* Encabezado con los datos principales */}
      <div className={`ficha-encabezado ${trabajador.estado}`}>
        <span className="avatar avatar-grande">{iniciales(nombre)}</span>
        <div className="ficha-identidad">
          <div className="tarjeta-nombre">
            <h3>{nombre}</h3>
            <span className={`chip-estado ${trabajador.estado}`}>{textoEstado(trabajador.estado)}</span>
          </div>
          <div className="lista-roles">
            {rolesAsignados.length === 0 && <span className="texto-tenue">Sin rol asignado</span>}
            {rolesAsignados.map((rol) => (
              <span key={rol.id_rol} className="chip-rol">
                {rol.nombre}
              </span>
            ))}
          </div>
          <div className="ficha-contacto">
            <span><Phone size={16} /> {trabajador.telefono_whatsapp || 'Sin teléfono'}</span>
            <span><Mail size={16} /> {trabajador.correo || 'Sin correo'}</span>
          </div>
        </div>
        <div className="ficha-semana">
          <span className="etiqueta">Semana disponible</span>
          <SemanaMarcada disponibilidad={disponibilidad} />
        </div>
      </div>

      {/* Indicadores rápidos */}
      <div className="indicadores">
        <Indicador icono={Tags} color="azul" titulo="Roles asignados" valor={rolesAsignados.length}
          detalle={comisionMaxima ? `Comisión hasta ${comisionMaxima}%` : 'Sin comisión'} />
        <Indicador icono={CalendarDays} color="verde" titulo="Días disponibles" valor={`${disponibilidad.length} / 7`} detalle="Por semana" />
        <Indicador icono={Clock} color="naranjo" titulo="Horas semanales" valor={`${horasSemanales(disponibilidad)} h`} detalle="Según horario" />
        <Indicador icono={CalendarRange} color="morado" titulo="Período" valor={textoPeriodo(disponibilidad)} detalle="Vigencia de la disponibilidad" />
      </div>

      {/* Edición: disponibilidad a la izquierda, roles y datos a la derecha */}
      <div className="ficha-columnas">
        <Seccion icono={CalendarDays} titulo="Disponibilidad" descripcion="Período, días y horarios en que puede trabajar">
          <EditorDisponibilidad
            idTrabajador={trabajador.id_trabajador}
            disponibilidad={disponibilidad}
            onGuardado={() => {
              cargarDisponibilidad();
              onCambio();
            }}
          />
        </Seccion>

        <div className="ficha-columna">
          <Seccion icono={Tags} titulo="Roles y comisiones" descripcion="Asigna, quita o crea roles">
            <RolesTrabajador trabajador={trabajador} roles={roles} onCambio={onCambio} onCrearRol={onCrearRol} onEditarRol={onEditarRol} />
          </Seccion>

          <Seccion icono={UserRound} titulo="Datos personales" descripcion="Contacto y estado del trabajador">
            <FormularioTrabajador
              key={trabajador.id_trabajador}
              inicial={{
                nombre: trabajador.nombre ?? '',
                apellido: trabajador.apellido ?? '',
                telefono_whatsapp: trabajador.telefono_whatsapp ?? '',
                correo: trabajador.correo ?? '',
                observaciones: trabajador.observaciones ?? '',
                estado: trabajador.estado ?? 'activo',
              }}
              textoBoton="Guardar cambios"
              onGuardar={guardarDatos}
            />
          </Seccion>
        </div>
      </div>
    </div>
  );
}

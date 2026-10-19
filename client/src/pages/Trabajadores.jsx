import { useEffect, useState } from 'react';
import { Plus, Search, Tags, Users, UserCheck, UserMinus, UserX } from 'lucide-react';
import Modal from '../components/Modal';
import TarjetaTrabajador from '../components/trabajadores/TarjetaTrabajador';
import FichaTrabajador from '../components/trabajadores/FichaTrabajador';
import FormularioTrabajador from '../components/trabajadores/FormularioTrabajador';
import FormularioRol from '../components/trabajadores/FormularioRol';
import { ESTADOS, nombreCompleto, rolesDe } from '../components/trabajadores/ayudas.js';
import { actualizarRol, crearRol, crearTrabajador, listarRoles, listarTrabajadores } from '../services/personalServicio.js';
import '../styles/Trabajadores.css';

// Cuadros de arriba. Al hacer clic filtran por ese estado.
const RESUMEN = [
  { estado: '', texto: 'Total personal', icono: Users, color: 'azul' },
  { estado: 'activo', texto: 'Activos', icono: UserCheck, color: 'verde' },
  { estado: 'licencia', texto: 'Con licencia', icono: UserMinus, color: 'naranjo' },
  { estado: 'inactivo', texto: 'Inactivos', icono: UserX, color: 'rojo' },
];

export default function Trabajadores() {
  // Datos que vienen del back
  const [trabajadores, setTrabajadores] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Ventanas abiertas
  const [idAbierto, setIdAbierto] = useState(null); // ficha del trabajador
  const [creandoTrabajador, setCreandoTrabajador] = useState(false);
  const [rolEditando, setRolEditando] = useState(undefined); // undefined = cerrado, null = crear, objeto = modificar

  // Cambia cada vez que se guarda algo, para que las tarjetas se actualicen
  const [version, setVersion] = useState(0);

  async function cargarDatos() {
    try {
      setError('');
      const [listaTrabajadores, listaRoles] = await Promise.all([listarTrabajadores(), listarRoles()]);
      setTrabajadores(listaTrabajadores);
      setRoles(listaRoles);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  function alCambiar() {
    cargarDatos();
    setVersion(version + 1);
  }

  async function guardarTrabajadorNuevo(datos) {
    const nuevo = await crearTrabajador(datos);
    setCreandoTrabajador(false);
    await cargarDatos();
    setIdAbierto(nuevo.id_trabajador); // se abre su ficha para asignarle roles y disponibilidad
  }

  async function guardarRol(datos) {
    if (rolEditando) {
      await actualizarRol(rolEditando.id_rol, datos);
    } else {
      await crearRol(datos);
    }
    setRolEditando(undefined);
    cargarDatos();
  }

  // Aplicar filtros
  const texto = busqueda.trim().toLowerCase();
  const filtrados = trabajadores.filter((t) => {
    const coincideTexto = nombreCompleto(t).toLowerCase().includes(texto);
    const coincideRol = !filtroRol || rolesDe(t).some((r) => r.id_rol === Number(filtroRol));
    const coincideEstado = !filtroEstado || t.estado === filtroEstado;
    return coincideTexto && coincideRol && coincideEstado;
  });

  const trabajadorAbierto = trabajadores.find((t) => t.id_trabajador === idAbierto);

  function contar(estado) {
    return estado ? trabajadores.filter((t) => t.estado === estado).length : trabajadores.length;
  }

  return (
    <div>
      {/* Título y botones */}
      <div className="encabezado">
        <div>
          <h1>Personal</h1>
          <p>Roles, comisión y disponibilidad del equipo</p>
        </div>
        <div className="encabezado-botones">
          <button type="button" className="boton boton-secundario" onClick={() => setRolEditando(null)}>
            <Tags size={18} /> Nuevo rol
          </button>
          <button type="button" className="boton boton-principal" onClick={() => setCreandoTrabajador(true)}>
            <Plus size={18} /> Añadir trabajador
          </button>
        </div>
      </div>

      {/* Resumen por estado (también sirve de filtro) */}
      <div className="indicadores">
        {RESUMEN.map(({ estado, texto, icono: Icono, color }) => (
          <button
            key={texto}
            type="button"
            className={`indicador ${color} clickeable ${filtroEstado === estado ? 'seleccionado' : ''}`}
            onClick={() => setFiltroEstado(estado)}
          >
            <span className="indicador-titulo">
              <Icono size={16} /> {texto}
            </span>
            <strong className="indicador-valor">{contar(estado)}</strong>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="filtros">
        <div className="buscador">
          <Search size={18} />
          <input
            className="input"
            type="search"
            placeholder="Buscar por nombre"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar trabajador"
          />
        </div>
        <div className="campo">
          <label htmlFor="filtro-rol">Filtrar por rol</label>
          <select id="filtro-rol" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
            <option value="">Todos los roles</option>
            {roles.map((rol) => (
              <option key={rol.id_rol} value={rol.id_rol}>
                {rol.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="filtro-estado">Filtrar por estado</label>
          <select id="filtro-estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS.map((estado) => (
              <option key={estado.valor} value={estado.valor}>
                {estado.texto}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de trabajadores */}
      <section className="panel">
        <div className="panel-cabecera">
          <h2>Equipo</h2>
          <span>
            {filtrados.length} de {trabajadores.length}
          </span>
        </div>

        {error && <div className="mensaje mensaje-error">{error}</div>}
        {cargando && <p className="vacio">Cargando trabajadores…</p>}
        {!cargando && filtrados.length === 0 && <p className="vacio">No hay trabajadores que coincidan.</p>}

        <div className="grilla">
          {filtrados.map((t) => (
            <TarjetaTrabajador key={t.id_trabajador} trabajador={t} version={version} onAbrir={() => setIdAbierto(t.id_trabajador)} />
          ))}
        </div>
      </section>

      {/* Ventanas */}
      <Modal abierto={Boolean(trabajadorAbierto)} onCerrar={() => setIdAbierto(null)} titulo="Ficha del trabajador" ancho="amplio">
        {trabajadorAbierto && (
          <FichaTrabajador
            trabajador={trabajadorAbierto}
            roles={roles}
            onCambio={alCambiar}
            onCrearRol={() => setRolEditando(null)}
            onEditarRol={setRolEditando}
          />
        )}
      </Modal>

      <Modal abierto={creandoTrabajador} onCerrar={() => setCreandoTrabajador(false)} titulo="Añadir trabajador">
        <FormularioTrabajador textoBoton="Crear trabajador" onGuardar={guardarTrabajadorNuevo} onCancelar={() => setCreandoTrabajador(false)} />
      </Modal>

      <Modal abierto={rolEditando !== undefined} onCerrar={() => setRolEditando(undefined)} titulo={rolEditando ? 'Modificar rol' : 'Crear rol'}>
        <FormularioRol key={rolEditando?.id_rol ?? 'nuevo'} rol={rolEditando} onGuardar={guardarRol} onCancelar={() => setRolEditando(undefined)} />
      </Modal>
    </div>
  );
}

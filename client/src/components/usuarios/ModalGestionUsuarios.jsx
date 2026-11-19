import { useState, useEffect } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { obtenerUsuarios, crearUsuario, cambiarEstadoUsuario } from "../../services/usuarioService";

export default function ModalGestionUsuarios({ isOpen, onClose, idDueno }) {
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [mostrarFormCrearUser, setMostrarFormCrearUser] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [formUser, setFormUser] = useState({
    nombre: "",
    correo: "",
    contrasena: "",
    rol: "CONTADOR",
    id_dueno: idDueno || 1
  });

  useEffect(() => {
    if (isOpen) {
      cargarUsuariosSistema();
    }
  }, [isOpen]);

  const mostrarConfirmacionAnimada = (texto) => {
    setMensajeExito(texto);
    setTimeout(() => {
      setMensajeExito("");
    }, 1500);
  };

  const cargarUsuariosSistema = async () => {
    try {
      setCargandoUsuarios(true);
      const data = await obtenerUsuarios(idDueno || 1);
      setListaUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn("Error al cargar usuarios:", error.message);
    } finally {
      setCargandoUsuarios(false);
    }
  };

  const manejarCrearUsuario = async (e) => {
    e.preventDefault();

    const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
    if (!regexNombre.test(formUser.nombre.trim())) {
      alert("El nombre completo solo debe contener letras y espacios.");
      return;
    }

    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexCorreo.test(formUser.correo.trim())) {
      alert("El correo debe tener el formato válido: texto@texto.texto");
      return;
    }

    try {
      await crearUsuario(formUser);
      setFormUser({ nombre: "", correo: "", contrasena: "", rol: "CONTADOR", id_dueno: idDueno || 1 });
      setMostrarFormCrearUser(false);
      await cargarUsuariosSistema();
      mostrarConfirmacionAnimada("¡Usuario creado con éxito!");
    } catch (error) {
      alert(error.message || "Error al crear usuario");
    }
  };

  const manejarCambioEstado = async (id, rolUser, estadoActual) => {
    const nuevoEstado = estadoActual === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    try {
      await cambiarEstadoUsuario(id, rolUser, nuevoEstado);
      cargarUsuariosSistema();
    } catch (error) {
      alert(error.message || "No se pudo cambiar el estado del usuario");
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
      <style>{`
        @keyframes usrPopIn {
          from { opacity: 0; transform: scale(0.9) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes usrCheckBounce {
          0% { transform: scale(0.4); }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "700px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Administración de Usuarios</h2>
            <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>Crear, modificar y gestionar cuentas del sistema con rol y correo único.</p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: "18px", color: "#64748b", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {!mostrarFormCrearUser ? (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
              <button
                type="button"
                onClick={() => setMostrarFormCrearUser(true)}
                style={{ backgroundColor: "#0f172a", color: "white", padding: "8px 16px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                + Registrar nuevo usuario
              </button>
            </div>

            {cargandoUsuarios ? (
              <p style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>Cargando usuarios...</p>
            ) : listaUsuarios.length === 0 ? (
              <p style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>No hay usuarios registrados.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b" }}>
                      <th style={{ padding: "10px" }}>Nombre</th>
                      <th style={{ padding: "10px" }}>Correo</th>
                      <th style={{ padding: "10px" }}>Rol</th>
                      <th style={{ padding: "10px" }}>Estado</th>
                      <th style={{ padding: "10px", textAlign: "center" }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaUsuarios.map((u) => {
                      const idU = u.id_dueno || u.id_contador || u.id_jefe || u.id;
                      const esActivo = u.estado === "ACTIVO";
                      return (
                        <tr key={`${u.rol}-${idU}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px", fontWeight: "600", color: "#1e293b" }}>{u.nombre}</td>
                          <td style={{ padding: "10px", color: "#475569" }}>{u.correo}</td>
                          <td style={{ padding: "10px" }}>
                            <span style={{ backgroundColor: "#f1f5f9", padding: "3px 8px", borderRadius: "10px", fontWeight: "600", fontSize: "11px", color: "#334155" }}>
                              {u.rol}
                            </span>
                          </td>
                          <td style={{ padding: "10px" }}>
                            <span style={{ backgroundColor: esActivo ? "#dcfce7" : "#fee2e2", color: esActivo ? "#166534" : "#991b1b", padding: "3px 8px", borderRadius: "10px", fontWeight: "600", fontSize: "11px" }}>
                              {u.estado}
                            </span>
                          </td>
                          <td style={{ padding: "10px", textAlign: "center" }}>
                            <button
                              type="button"
                              onClick={() => manejarCambioEstado(idU, u.rol, u.estado)}
                              style={{
                                backgroundColor: esActivo ? "#fee2e2" : "#dcfce7",
                                color: esActivo ? "#991b1b" : "#166534",
                                border: "none",
                                padding: "5px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer"
                              }}
                            >
                              {esActivo ? "Desactivar" : "Activar"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={manejarCrearUsuario} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "15px", color: "#1e293b" }}>Crear Nuevo Usuario</h3>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>Nombre completo:</label>
              <input
                type="text"
                required
                value={formUser.nombre}
                onChange={(e) => setFormUser({ ...formUser, nombre: e.target.value })}
                placeholder="Ej: Juan Pérez"
                style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "13px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>Correo electrónico (Único):</label>
              <input
                type="email"
                required
                value={formUser.correo}
                onChange={(e) => setFormUser({ ...formUser, correo: e.target.value })}
                placeholder="Ej: juan@empresa.com"
                style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "13px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>Contraseña:</label>
              <input
                type="password"
                required
                value={formUser.contrasena}
                onChange={(e) => setFormUser({ ...formUser, contrasena: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "13px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>Rol en el sistema:</label>
              <select
                value={formUser.rol}
                onChange={(e) => setFormUser({ ...formUser, rol: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "13px", backgroundColor: "#fff" }}
              >
                <option value="CONTADOR">CONTADOR</option>
                <option value="JEFE_TECNICO">JEFE DE ÁREA TÉCNICA</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
              <button
                type="button"
                onClick={() => setMostrarFormCrearUser(false)}
                style={{ backgroundColor: "#e2e8f0", color: "#334155", padding: "8px 14px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Volver
              </button>
              <button
                type="submit"
                style={{ backgroundColor: "#0f172a", color: "#ffffff", padding: "8px 16px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Guardar Usuario
              </button>
            </div>
          </form>
        )}

      </div>

      {mensajeExito && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              padding: "24px 32px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              animation: "usrPopIn 0.25s ease-out"
            }}
          >
            <FaCheckCircle
              style={{
                fontSize: "44px",
                color: "#166534",
                animation: "usrCheckBounce 0.45s ease"
              }}
            />
            <p style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#166534" }}>
              {mensajeExito}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
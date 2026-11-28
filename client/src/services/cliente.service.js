import { pedir } from "./http.js";

// buscar y limite son opcionales: con ellos el back filtra por nombre o RUT
export const listarClientes = ({ buscar = "", limite } = {}) => {
  const params = new URLSearchParams();
  if (buscar) params.set("buscar", buscar);
  if (limite) params.set("limite", limite);
  return pedir(`/clientes?${params}`);
};

export const crearCliente = (cliente) =>
  pedir("/clientes", { method: "POST", body: cliente });

export const modificarCliente = (id, cliente) =>
  pedir(`/clientes/${id}`, { method: "PUT", body: cliente });

export const eliminarCliente = (id) =>
  pedir(`/clientes/${id}`, { method: "DELETE" });
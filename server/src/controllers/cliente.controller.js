import {
  listarClientes,
  crearCliente,
  modificarCliente,
  eliminarCliente,
} from "../services/cliente.service.js";
import { manejarError } from "../utils/errores.js";

export async function getClientes(req, res) {
  try {
    const buscar = req.query.buscar ?? "";
    // límite opcional entre 1 y 100 (con un negativo, Prisma tomaría los últimos registros)
    const limiteNum = Number(req.query.limite);
    const limite =
      Number.isInteger(limiteNum) && limiteNum > 0
        ? Math.min(limiteNum, 100)
        : undefined;
    res.json(await listarClientes(req.user.id_dueno, { buscar, limite }));
  } catch (error) {
    manejarError(res, error);
  }
}

export async function postCliente(req, res) {
  try {
    res.status(201).json(await crearCliente(req.user.id_dueno, req.body));
  } catch (error) {
    manejarError(res, error);
  }
}

export async function putCliente(req, res) {
  try {
    res.json(
      await modificarCliente(
        req.user.id_dueno,
        Number(req.params.id),
        req.body,
      ),
    );
  } catch (error) {
    manejarError(res, error);
  }
}

export async function deleteCliente(req, res) {
  try {
    await eliminarCliente(req.user.id_dueno, Number(req.params.id));
    res.json({ mensaje: "Cliente eliminado" });
  } catch (error) {
    manejarError(res, error);
  }
}

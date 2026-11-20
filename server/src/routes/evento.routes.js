import {
  getEventos,
  postEvento,
  deleteEvento,
  putEvento,
  getHistorialEvento,
} from "../controllers/evento.controller.js";
import {
  validarId,
  camposObligatorios,
} from "../middlewares/validate.middleware.js";
import { autenticar, permitirRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// Ver la agenda: cualquier usuario con sesión. Crear, modificar y eliminar: solo el Dueño.
router.get("/", autenticar, getEventos);
// Historial de cambios del evento: solo Dueño y Contador (trae precios y pagos)
router.get(
  "/:id/historial",
  autenticar,
  permitirRoles("DUENO", "CONTADOR"),
  validarId,
  getHistorialEvento,
);
router.post(
  "/",
  autenticar,
  permitirRoles("DUENO"),
  camposObligatorios(
    "tipo",
    "fecha",
    "hora_inicio",
    "hora_termino",
    "direccion",
    "precio_acordado",
    "id_cliente",
  ),
  postEvento,
);
router.put(
  "/:id",
  autenticar,
  permitirRoles("DUENO"),
  validarId,
  camposObligatorios(
    "tipo",
    "fecha",
    "hora_inicio",
    "hora_termino",
    "direccion",
    "precio_acordado",
    "id_cliente",
  ),
  putEvento,
);
router.delete(
  "/:id",
  autenticar,
  permitirRoles("DUENO"),
  validarId,
  camposObligatorios("motivo"),
  deleteEvento,
);

export default router;

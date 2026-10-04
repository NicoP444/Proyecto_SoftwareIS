import * as RolServicio from '../services/rol.service.js'
import { manejarError } from '../utils/errores.js';



export const ListarRol = async (req, res) =>{
    try{
        const lista = await RolServicio.ListarTrabajadores(req.query.id_dueno);
        res.json(lista);
    }catch (error) {
    manejarError(res, error);
  }
};






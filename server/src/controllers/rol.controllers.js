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


export const CrearRol = async (req, res) => {
  try {
    // Tienes que extraer específicamente el 'req.body'
    const nuevoRol = await RolServicio.CrearRol(req.body); 
    res.json(nuevoRol);
  } catch (error) {
    manejarError(res, error);
  }
};



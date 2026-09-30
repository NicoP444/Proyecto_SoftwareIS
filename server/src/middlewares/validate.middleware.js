import prisma from '../config/prisma.js';
export const validarId = (req, res, next) => {
  /*Funcion= Verificar si el ID es un numero y si es mayor a 0*/
  
  const id = Number(req.params.id); // tomamos el ID

  if(!Number.isInteger(id) || id <= 0){ // verfificamos...
    return res.status(400).json({ mensaje: 'El id no es válido', campo: 'id' });
  }
  next(); // Todo ok, siguimos...
};


export const validarBody = (req, res, next) => {
  /*Funcion= Verificaremos si el body tiene almenos algo y no esta vacio*/

  if(!req.body || Object.keys(req.body).length === 0){//Tomamos todo los parametros, del body===0
    return res.status(400).json({ mensaje: 'No se enviaron datos' });
  }

  next();
};

//Recibe los nombres de los campos y devuelve un middleware que los exige
export const camposObligatorios = (...campos) => (req, res, next) => {
  const faltante = campos.find(
    (campo) => req.body[campo] === undefined || req.body[campo] === null || req.body[campo] === '',
  );
  if(faltante){
    return res.status(400).json({ mensaje: `El campo ${faltante} es obligatorio`, campo: faltante });
  }

  next();
};

//Verificamos si el dueño existe...
export const validarDueno = async (req, res, next) => {
  try{
    const id_dueno = Number(req.body?.id_dueno ?? req.query.id_dueno);

    if(!Number.isInteger(id_dueno) || id_dueno <= 0){
      return res.status(400).json({ mensaje: 'El id del dueño no es válido', campo: 'id_dueno' });
    }

    const dueno = await prisma.dueno.findUnique({ where: { id_dueno } });

    if(!dueno){
      return res.status(404).json({ mensaje: 'El dueño no existe', campo: 'id_dueno' });
    }

    next();
  }catch (error){
    next(error);
  }
};
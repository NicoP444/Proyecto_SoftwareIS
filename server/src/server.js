import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';
import routes from './routes/index.js'; //gene
import clienteRoutes from './routes/cliente.routes.js'; //jorge
import recintoRoutes from './routes/recinto.routes.js'; //jorge
import eventoRoutes from './routes/evento.routes.js'; //jorge

const app = express();
const PORT = process.env.PORT || 3000;

//encontrar front
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '../../client/dist');


// Middlewares
app.use(cors());
app.use(express.json());

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Trabajadores y roles
app.use('/api', routes);//gene
app.use('/api', routes); // nico

//JORGE
app.use('/api/clientes', clienteRoutes);
app.use('/api/recintos', recintoRoutes);
app.use('/api/coberturas', eventoRoutes);


// Comentar, cuando esta en el server....
//app.get('/', (req, res) => {
  //res.send('¡La puerta está abierta y el servidor funciona!');
//});

//comentar cundo esten en local*/
// ruta principal, para server
app.use(express.static(distPath));

// este permite que cualqueier ruta que no sea de api, nos devuelve a index.html
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});
// ***********************/

// Nico, manejar errores...
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ mensaje: 'El JSON enviado no es válido' });
  }
  console.error(err);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
});



app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
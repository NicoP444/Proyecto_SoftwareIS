# Proyecto - Ingeniería de Software
## Sistema de Gestión de Eventos y Transmisiones en Vivo

Este repositorio contiene el código fuente y las evidencias del proyecto final para la asignatura de Ingeniería de Software.
El sistema está orientado a la administración de eventos (transmisiones en vivo), clientes, inventario de equipos, personal técnico y auspiciadores de una empresa de transmisión audiovisual, integrando funcionalidades de agendamiento, control financiero y paneles diferenciados por rol.

## Sobre el Proyecto

Aplicación web full-stack para la gestión integral de una empresa de eventos y transmisiones en vivo (licenciaturas, eventos deportivos, partidos, etc.).
Incluye módulos de agendamiento de eventos mediante calendario, gestión de clientes, control de inventario y kits de equipos, asignación de personal técnico, registro de auspiciadores, y cálculo automático de sueldos, gastos y utilidad neta.

## Características Principales

- **Gestión de Eventos:** Agendamiento, modificación y eliminación de transmisiones, con cálculo automático de estado (Confirmado / Pendiente de adelanto) según la duración del evento.
- **Gestión de Clientes:** Registro y administración de los clientes que contratan los eventos.
- **Gestión de Inventario:** Registro de equipos individuales (cámaras, trípodes, micrófonos, switches), con nombre, fecha de ingreso, estado, stock y valor monetario.
- **Kits de Inventario:** Agrupación de equipos en kits de trabajo (con mínimo una cámara, un trípode, un micrófono y un switch de video), y clasificación como "repuestos" del equipo no asignado a ningún kit.
- **Registro de Incidentes:** Registro de pérdidas, daños o robos de inventario, enlazando el valor del equipo a las pérdidas de la transmisión asociada.
- **Gestión de Personal:** Registro de trabajadores con uno o múltiples roles (camarógrafo, instalación técnica, audio, relator, operador de switch), y control de disponibilidad mensual.
- **Calendario Interactivo:** Vista general de transmisiones agendadas, con el detalle de trabajadores, auspiciadores y kits asignados a cada fecha.
- **Gestión de Auspiciadores:** Registro de acuerdos de palabra por evento (glosa, tipo de pago, plazo), con historial de auspiciadores clasificados como buenos o malos pagadores.
- **Gestión Financiera y Sueldos:** Cálculo del sueldo variable de cada trabajador según su rol y el valor cobrado por evento, registro de gastos operativos con evidencia adjunta, y reporte mensual de utilidad neta.
- **Roles y Permisos:** Accesos diferenciados para Dueño, Contador y Jefe Técnico. El back verifica el token de sesión y rechaza con "permiso insuficiente" las acciones que no corresponden al rol, y oculta el detalle financiero al Jefe Técnico.

## Tecnologías y Herramientas Utilizadas

### Backend
- **Framework:** Node.js con Express.js
- **Base de Datos:** PostgreSQL
- **ORM:** Prisma
- **Autenticación:** JSON Web Tokens (JWT)
- **Variables de Entorno:** Dotenv

### Frontend
- **Framework/Librería:** React.js
- **Bundler:** Vite
- **Estilos:** CSS (estilos en línea por componente)
- **Peticiones HTTP:** Fetch API nativa
- **Routing:** React Router DOM

## Evidencias y Artefactos

- Reporte de Git: contribuciones en el tiempo, cantidad y frecuencia.
- Reportes semanales de avance y cumplimiento de tareas.
- Instrumento para estudio del contexto (entrevista con el cliente).
- Propuestas de solución.
- Requisitos funcionales y no funcionales.
- Modelos de Casos de Uso y Modelo de Datos.
- Reporte de pruebas.
- Informe final.
- Avance de software (individual y grupal).
- Software final (individual y grupal).

## Guía de Instalación y Uso Local

### Prerrequisitos
- Node.js (v18.x o superior)
- npm (v9.x o superior)
- PostgreSQL

### Pasos

**1. Clonar el repositorio:**

Primero clonas el repositorio

```bash
git clone https://github.com/NicoP444/Proyecto_SoftwareIS.git
```

Y entras

```bash
cd Proyecto_SoftwareIS
```

**2. Configurar el Backend:**

Avanzas a la carpeta server con

```bash
cd server
```

E instalas

```bash
npm install
```

**3. Configurar el Frontend:**

Retrocedes y luego avanzas a la carpeta de client

```bash
cd ../client
```

E instalas

```bash
npm install
```

**4. Iniciar la base de datos:**

Asegúrate de tener PostgreSQL corriendo, y crea dentro del backend (carpeta `server`) un archivo `.env` con los datos de tu base de datos.

Ejemplo de un `.env`:

```
# Base de datos
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/nombre_base_de_datos"

# Clave para firmar los tokens de sesión (pon una frase larga y secreta)
JWT_SECRET="cambia-esta-frase-por-una-larga-y-secreta"

# Puerto del servidor (opcional, por defecto 3000)
PORT=3000
```

Si no defines `JWT_SECRET`, el sistema usa una clave por defecto que solo sirve para desarrollo local: en un servidor real siempre debes definirla.

Luego, dentro de `server`, aplica las migraciones y genera el cliente de Prisma:

```bash
npx prisma migrate dev
```

**Datos iniciales (opcional):**

Dentro de `server`, con las migraciones aplicadas. Todos los seeds están en `server/seeders`:

```bash
npm run seed:base       # Dueño y Contador de demostración
npm run seed:usuarios   # Contador y Jefe de área técnica de prueba
npm run seed:kits       # 3 eventos, 3 kits, 3 clientes y personal de ejemplo
npm run seed:pruebas    # clientes y eventos de prueba (se pueden borrar)
npm run seed:limpiar    # borra los clientes y eventos de seed:pruebas
npm run seed:todo       # base + usuarios + kits + pruebas, en orden
```

Cuentas para ingresar:

| Rol | Correo | Contraseña |
|---|---|---|
| Dueño | admin@demo.com | 123456 |
| Contador | contador@demo.com | 123456 |
| Contador | contador@sixseven.cl | password123 |
| Jefe de área técnica | jefe@sixseven.cl | password123 |

**5. Ejecutar el proyecto:**

Backend (dentro de `server`):

```bash
npm run dev
```

Frontend (dentro de `client`):

```bash
npm run dev
```

Con ambos corriendo, el sistema queda disponible en `http://localhost:5173` (frontend) y el servidor en `http://localhost:3000` (API).

## Miembros del equipo:

- Sebastián Bustos
- Genesis Parada
- Nicolás Parada
- Jorge Rocha

---

Repositorio: [https://github.com/NicoP444/Proyecto_SoftwareIS](https://github.com/NicoP444/Proyecto_SoftwareIS)

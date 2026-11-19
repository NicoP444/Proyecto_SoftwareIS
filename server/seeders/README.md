# Seeders de SixSeven: set de pruebas

Solo hay dos comandos (desde la carpeta `server`):

| Comando | Qué hace |
|---|---|
| `npm run seed:todo` | Limpia la base y crea el set completo de pruebas. Se puede correr las veces que se quiera: siempre deja el mismo set desde cero. |
| `npm run seed:limpiar` | Deja la base vacía de datos (solo se conservan los usuarios). |

> ⚠️ Ambos borran **todo** lo que haya en la base, también lo creado a mano. Úsalos solo en la base de pruebas.

## Usuarios (contraseña `123456`)

| Correo | Rol |
|---|---|
| admin@demo.com | Dueño |
| contador@sixseven.cl | Contador |
| jefe@sixseven.cl | Jefe técnico |
| bloqueado@sixseven.cl | Contador bloqueado (para probar el login) |
| inactivo@sixseven.cl | Contador inactivo (para probar el login) |
| intentos@sixseven.cl | Contador para equivocarse 5 veces y ver el bloqueo |

## Qué crea (fechas siempre relativas a hoy)

1. **Catálogo**: 4 roles, 10 trabajadores (todos con disponibilidad, salvo los que prueban justo eso), 10 clientes, 23 auspiciadores, 6 kits y 26 equipos.
2. **Hace 2 meses**: 3 eventos cerrados y el mes contable **ya cerrado**.
3. **El mes pasado**: 4 eventos realizados o cerrados, con remuneraciones por pagar → el Contador **puede cerrar** ese mes.
4. **Agenda**: 10 eventos en las próximas 5 semanas, con personal, kits, pagos y auspicios.
5. **Casos de prueba C01 a C14**: un escenario en cada etapa del ciclo de un evento. Su observación dice qué probar y la planilla "Plan de pruebas" tiene el paso a paso.

## Archivos

```
seeders/
├── todo.js                  ← npm run seed:todo
├── limpiar.js               ← npm run seed:limpiar
├── lib/base.js              ← fechas relativas, RUT, remuneraciones y crearEvento()
└── datos/
    ├── 01-usuarios.js
    ├── 02-catalogo.js       ← roles, personal, clientes, auspiciadores, kits y equipos
    ├── 03-meses-anteriores.js
    ├── 04-agenda.js
    └── 05-casos.js
```

Para agregar un evento, se copia uno de `04-agenda.js` y se cambian sus datos: `crearEvento()` se encarga de los pagos, el personal, los gastos, los kits, los auspicios y la rentabilidad.

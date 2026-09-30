-- CreateEnum
CREATE TYPE "EstadoCuenta" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "EstadoEvento" AS ENUM ('PENDIENTE_ADELANTO', 'CONFIRMADO', 'REALIZADO', 'CERRADO');

-- CreateEnum
CREATE TYPE "EstadoRendicion" AS ENUM ('PENDIENTE', 'RENDIDA', 'SIN_GASTOS');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('POR_PAGAR', 'PAGADA');

-- CreateEnum
CREATE TYPE "NivelKit" AS ENUM ('BASICO', 'ESTANDAR', 'ALTA_GAMA');

-- CreateEnum
CREATE TYPE "EstadoKit" AS ENUM ('DISPONIBLE', 'EN_TERRENO', 'INCOMPLETO');

-- CreateEnum
CREATE TYPE "TipoPago" AS ENUM ('ADELANTO', 'SALDO', 'PAGO_TOTAL');

-- CreateEnum
CREATE TYPE "TipoGasto" AS ENUM ('MOVILIZACION', 'PEAJE', 'PASAJE', 'ALIMENTACION', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoMes" AS ENUM ('ABIERTO', 'CERRADO');

-- CreateEnum
CREATE TYPE "Clasificacion" AS ENUM ('CONFIABLE', 'NO_CONFIABLE');

-- CreateEnum
CREATE TYPE "TipoAporte" AS ENUM ('DINERO', 'CANJE');

-- CreateEnum
CREATE TYPE "EstadoAcuerdo" AS ENUM ('PENDIENTE', 'PARCIAL', 'CUMPLIDO', 'VENCIDO', 'INCOBRABLE');

-- CreateEnum
CREATE TYPE "CategoriaEquipo" AS ENUM ('CAMARA', 'TRIPODE', 'MICROFONO', 'SWITCH_VIDEO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoEquipo" AS ENUM ('OPERATIVO', 'DANADO', 'PERDIDO', 'ROBADO', 'DADO_DE_BAJA');

-- CreateEnum
CREATE TYPE "EstadoRetorno" AS ENUM ('OPERATIVO', 'DANADO', 'PERDIDO', 'ROBADO');

-- CreateEnum
CREATE TYPE "TipoIncidente" AS ENUM ('DANO', 'PERDIDA', 'ROBO');

-- CreateTable
CREATE TABLE "dueno" (
    "id_dueno" SERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "correo" VARCHAR(120) NOT NULL,
    "contrasena" VARCHAR(255) NOT NULL,
    "estado" "EstadoCuenta" NOT NULL DEFAULT 'ACTIVO',
    "intentos_fallidos" SMALLINT NOT NULL DEFAULT 0,
    "bloqueado_hasta" TIMESTAMP(6),

    CONSTRAINT "dueno_pkey" PRIMARY KEY ("id_dueno")
);

-- CreateTable
CREATE TABLE "contador" (
    "id_contador" SERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "correo" VARCHAR(120) NOT NULL,
    "contrasena" VARCHAR(255) NOT NULL,
    "estado" "EstadoCuenta" NOT NULL DEFAULT 'ACTIVO',
    "intentos_fallidos" SMALLINT NOT NULL DEFAULT 0,
    "bloqueado_hasta" TIMESTAMP(6),

    CONSTRAINT "contador_pkey" PRIMARY KEY ("id_contador")
);

-- CreateTable
CREATE TABLE "jefe_area_tecnica" (
    "id_jefe" SERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "correo" VARCHAR(120) NOT NULL,
    "contrasena" VARCHAR(255) NOT NULL,
    "estado" "EstadoCuenta" NOT NULL DEFAULT 'ACTIVO',
    "intentos_fallidos" SMALLINT NOT NULL DEFAULT 0,
    "bloqueado_hasta" TIMESTAMP(6),

    CONSTRAINT "jefe_area_tecnica_pkey" PRIMARY KEY ("id_jefe")
);

-- CreateTable
CREATE TABLE "sesion" (
    "id_sesion" SERIAL NOT NULL,
    "fecha_hora_inicio" TIMESTAMP(6) NOT NULL,
    "ultima_actividad" TIMESTAMP(6) NOT NULL,
    "fecha_hora_cierre" TIMESTAMP(6),
    "id_dueno" INTEGER,
    "id_contador" INTEGER,
    "id_jefe" INTEGER,

    CONSTRAINT "sesion_pkey" PRIMARY KEY ("id_sesion")
);

-- CreateTable
CREATE TABLE "historial_cambio" (
    "id_cambio" SERIAL NOT NULL,
    "fecha_hora" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tabla_afectada" VARCHAR(40) NOT NULL,
    "dato" VARCHAR(60) NOT NULL,
    "valor_anterior" VARCHAR(255),
    "valor_nuevo" VARCHAR(255),
    "motivo" VARCHAR(255),
    "id_dueno" INTEGER NOT NULL,
    "id_evento" INTEGER,

    CONSTRAINT "historial_cambio_pkey" PRIMARY KEY ("id_cambio")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id_cliente" SERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "contacto" VARCHAR(80),
    "telefono" VARCHAR(20) NOT NULL,
    "correo" VARCHAR(120),
    "id_dueno" INTEGER NOT NULL,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "recinto" (
    "id_recinto" SERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "direccion" VARCHAR(120),
    "comuna" VARCHAR(60) NOT NULL,
    "id_dueno" INTEGER NOT NULL,

    CONSTRAINT "recinto_pkey" PRIMARY KEY ("id_recinto")
);

-- CreateTable
CREATE TABLE "evento" (
    "id_evento" SERIAL NOT NULL,
    "tipo" VARCHAR(40) NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_inicio" TIME(6) NOT NULL,
    "hora_termino" TIME(6) NOT NULL,
    "precio_acordado" INTEGER NOT NULL,
    "cantidad_repuestos" SMALLINT NOT NULL DEFAULT 0,
    "gastos_estimados" INTEGER NOT NULL DEFAULT 0,
    "observaciones" VARCHAR(255),
    "estado" "EstadoEvento" NOT NULL,
    "rentabilidad_final" INTEGER,
    "fecha_cierre" TIMESTAMP(6),
    "id_cliente" INTEGER NOT NULL,
    "id_recinto" INTEGER NOT NULL,
    "id_dueno" INTEGER NOT NULL,
    "fecha_registro" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_pkey" PRIMARY KEY ("id_evento")
);

-- CreateTable
CREATE TABLE "trabajador" (
    "id_trabajador" SERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "telefono_whatsapp" VARCHAR(20) NOT NULL,
    "observaciones" VARCHAR(255),
    "rol_fijo" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoCuenta" NOT NULL DEFAULT 'ACTIVO',
    "id_dueno" INTEGER NOT NULL,

    CONSTRAINT "trabajador_pkey" PRIMARY KEY ("id_trabajador")
);

-- CreateTable
CREATE TABLE "rol_trabajo" (
    "id_rol" SERIAL NOT NULL,
    "nombre" VARCHAR(40) NOT NULL,
    "porcentaje_referencial" DECIMAL(5,2),
    "estado" "EstadoCuenta" NOT NULL DEFAULT 'ACTIVO',
    "id_dueno" INTEGER NOT NULL,

    CONSTRAINT "rol_trabajo_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "desempena" (
    "id_trabajador" INTEGER NOT NULL,
    "id_rol" INTEGER NOT NULL,

    CONSTRAINT "desempena_pkey" PRIMARY KEY ("id_trabajador","id_rol")
);

-- CreateTable
CREATE TABLE "disponibilidad" (
    "id_trabajador" INTEGER NOT NULL,
    "nro_bloque" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_inicio" TIME(6) NOT NULL,
    "hora_termino" TIME(6) NOT NULL,
    "id_dueno" INTEGER NOT NULL,

    CONSTRAINT "disponibilidad_pkey" PRIMARY KEY ("id_trabajador","nro_bloque")
);

-- CreateTable
CREATE TABLE "asignacion_personal" (
    "id_asignacion" SERIAL NOT NULL,
    "porcentaje" DECIMAL(5,2),
    "remuneracion" INTEGER,
    "estado_rendicion" "EstadoRendicion",
    "estado_pago" "EstadoPago" NOT NULL DEFAULT 'POR_PAGAR',
    "id_evento" INTEGER NOT NULL,
    "id_trabajador" INTEGER NOT NULL,
    "id_rol" INTEGER NOT NULL,
    "id_dueno" INTEGER NOT NULL,
    "fecha_asignacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asignacion_personal_pkey" PRIMARY KEY ("id_asignacion")
);

-- CreateTable
CREATE TABLE "pago_cliente" (
    "id_pago" SERIAL NOT NULL,
    "tipo_pago" "TipoPago" NOT NULL,
    "monto" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "medio_pago" VARCHAR(20) NOT NULL,
    "id_evento" INTEGER NOT NULL,
    "id_contador" INTEGER NOT NULL,

    CONSTRAINT "pago_cliente_pkey" PRIMARY KEY ("id_pago")
);

-- CreateTable
CREATE TABLE "gasto_evento" (
    "id_gasto" SERIAL NOT NULL,
    "tipo_gasto" "TipoGasto" NOT NULL,
    "monto" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "descripcion" VARCHAR(255),
    "origen" VARCHAR(80),
    "destino" VARCHAR(80),
    "evidencia" VARCHAR(255) NOT NULL,
    "id_asignacion" INTEGER NOT NULL,
    "id_contador" INTEGER NOT NULL,

    CONSTRAINT "gasto_evento_pkey" PRIMARY KEY ("id_gasto")
);

-- CreateTable
CREATE TABLE "pago_remuneracion" (
    "id_pago_rem" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "monto" INTEGER NOT NULL,
    "medio_pago" VARCHAR(20) NOT NULL,
    "id_asignacion" INTEGER NOT NULL,
    "id_contador" INTEGER NOT NULL,

    CONSTRAINT "pago_remuneracion_pkey" PRIMARY KEY ("id_pago_rem")
);

-- CreateTable
CREATE TABLE "mes_contable" (
    "id_mes" SERIAL NOT NULL,
    "anio" SMALLINT NOT NULL,
    "mes" SMALLINT NOT NULL,
    "estado" "EstadoMes" NOT NULL DEFAULT 'ABIERTO',
    "fecha_cierre" TIMESTAMP(6),
    "total_ingresos" INTEGER,
    "total_aportes" INTEGER,
    "total_remuneraciones" INTEGER,
    "total_gastos_evento" INTEGER,
    "total_gastos_fijos" INTEGER,
    "total_perdidas" INTEGER,
    "utilidad_neta" INTEGER,
    "id_contador" INTEGER,

    CONSTRAINT "mes_contable_pkey" PRIMARY KEY ("id_mes")
);

-- CreateTable
CREATE TABLE "gasto_fijo" (
    "id_gasto_fijo" SERIAL NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "monto" INTEGER NOT NULL,
    "evidencia" VARCHAR(255),
    "id_mes" INTEGER NOT NULL,
    "id_contador" INTEGER NOT NULL,

    CONSTRAINT "gasto_fijo_pkey" PRIMARY KEY ("id_gasto_fijo")
);

-- CreateTable
CREATE TABLE "auspiciador" (
    "id_auspiciador" SERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "rubro" VARCHAR(60),
    "contacto" VARCHAR(80),
    "telefono" VARCHAR(20) NOT NULL,
    "clasificacion" "Clasificacion" NOT NULL DEFAULT 'CONFIABLE',
    "motivo_clasificacion" VARCHAR(255),
    "id_dueno" INTEGER NOT NULL,

    CONSTRAINT "auspiciador_pkey" PRIMARY KEY ("id_auspiciador")
);

-- CreateTable
CREATE TABLE "acuerdo_auspicio" (
    "id_acuerdo" SERIAL NOT NULL,
    "glosa" VARCHAR(255) NOT NULL,
    "tipo_aporte" "TipoAporte" NOT NULL,
    "monto_comprometido" INTEGER NOT NULL,
    "descripcion_canje" VARCHAR(255),
    "cant_menciones" SMALLINT,
    "fecha_comprometida" DATE NOT NULL,
    "estado" "EstadoAcuerdo" NOT NULL DEFAULT 'PENDIENTE',
    "motivo_incobrable" VARCHAR(255),
    "id_auspiciador" INTEGER NOT NULL,
    "id_evento" INTEGER NOT NULL,
    "id_dueno" INTEGER NOT NULL,

    CONSTRAINT "acuerdo_auspicio_pkey" PRIMARY KEY ("id_acuerdo")
);

-- CreateTable
CREATE TABLE "cumplimiento_aporte" (
    "id_acuerdo" INTEGER NOT NULL,
    "nro_cumplimiento" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "monto_recibido" INTEGER NOT NULL,
    "id_contador" INTEGER NOT NULL,

    CONSTRAINT "cumplimiento_aporte_pkey" PRIMARY KEY ("id_acuerdo","nro_cumplimiento")
);

-- CreateTable
CREATE TABLE "kit" (
    "id_kit" SERIAL NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,
    "nivel" "NivelKit" NOT NULL,
    "recargo_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "estado" "EstadoKit" NOT NULL DEFAULT 'DISPONIBLE',
    "id_jefe" INTEGER NOT NULL,

    CONSTRAINT "kit_pkey" PRIMARY KEY ("id_kit")
);

-- CreateTable
CREATE TABLE "reserva_kit" (
    "id_reserva" SERIAL NOT NULL,
    "fecha_reserva" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_evento" INTEGER NOT NULL,
    "id_kit" INTEGER NOT NULL,
    "id_dueno" INTEGER NOT NULL,

    CONSTRAINT "reserva_kit_pkey" PRIMARY KEY ("id_reserva")
);

-- CreateTable
CREATE TABLE "equipo" (
    "codigo" VARCHAR(15) NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "categoria" "CategoriaEquipo" NOT NULL,
    "marca" VARCHAR(40),
    "modelo" VARCHAR(40),
    "fecha_compra" DATE NOT NULL,
    "valor_compra" INTEGER NOT NULL,
    "estado" "EstadoEquipo" NOT NULL DEFAULT 'OPERATIVO',
    "motivo_baja" VARCHAR(255),
    "fecha_baja" DATE,
    "id_kit" INTEGER,
    "id_evento_repuesto" INTEGER,
    "id_jefe" INTEGER NOT NULL,

    CONSTRAINT "equipo_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "salida_kit" (
    "id_salida" SERIAL NOT NULL,
    "fecha_hora_salida" TIMESTAMP(6) NOT NULL,
    "fecha_hora_retorno" TIMESTAMP(6),
    "id_reserva" INTEGER NOT NULL,
    "id_asignacion" INTEGER NOT NULL,
    "id_jefe" INTEGER NOT NULL,

    CONSTRAINT "salida_kit_pkey" PRIMARY KEY ("id_salida")
);

-- CreateTable
CREATE TABLE "revisa" (
    "id_salida" INTEGER NOT NULL,
    "codigo" VARCHAR(15) NOT NULL,
    "estado_retorno" "EstadoRetorno" NOT NULL,
    "observacion" VARCHAR(255),

    CONSTRAINT "revisa_pkey" PRIMARY KEY ("id_salida","codigo")
);

-- CreateTable
CREATE TABLE "incidente" (
    "id_incidente" SERIAL NOT NULL,
    "tipo" "TipoIncidente" NOT NULL,
    "fecha" DATE NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "valor" INTEGER NOT NULL,
    "codigo" VARCHAR(15) NOT NULL,
    "id_evento" INTEGER,
    "id_trabajador" INTEGER,
    "id_jefe" INTEGER NOT NULL,

    CONSTRAINT "incidente_pkey" PRIMARY KEY ("id_incidente")
);

-- CreateIndex
CREATE UNIQUE INDEX "dueno_correo_key" ON "dueno"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "contador_correo_key" ON "contador"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "jefe_area_tecnica_correo_key" ON "jefe_area_tecnica"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "rol_trabajo_nombre_key" ON "rol_trabajo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "asignacion_personal_id_evento_id_trabajador_key" ON "asignacion_personal"("id_evento", "id_trabajador");

-- CreateIndex
CREATE UNIQUE INDEX "mes_contable_anio_mes_key" ON "mes_contable"("anio", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "kit_nombre_key" ON "kit"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "reserva_kit_id_evento_id_kit_key" ON "reserva_kit"("id_evento", "id_kit");

-- CreateIndex
CREATE UNIQUE INDEX "salida_kit_id_reserva_key" ON "salida_kit"("id_reserva");

-- AddForeignKey
ALTER TABLE "sesion" ADD CONSTRAINT "sesion_id_dueno_fkey" FOREIGN KEY ("id_dueno") REFERENCES "dueno"("id_dueno") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion" ADD CONSTRAINT "sesion_id_contador_fkey" FOREIGN KEY ("id_contador") REFERENCES "contador"("id_contador") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion" ADD CONSTRAINT "sesion_id_jefe_fkey" FOREIGN KEY ("id_jefe") REFERENCES "jefe_area_tecnica"("id_jefe") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_cambio" ADD CONSTRAINT "historial_cambio_id_dueno_fkey" FOREIGN KEY ("id_dueno") REFERENCES "dueno"("id_dueno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_cambio" ADD CONSTRAINT "historial_cambio_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "evento"("id_evento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_id_dueno_fkey" FOREIGN KEY ("id_dueno") REFERENCES "dueno"("id_dueno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recinto" ADD CONSTRAINT "recinto_id_dueno_fkey" FOREIGN KEY ("id_dueno") REFERENCES "dueno"("id_dueno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "cliente"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_id_recinto_fkey" FOREIGN KEY ("id_recinto") REFERENCES "recinto"("id_recinto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_id_dueno_fkey" FOREIGN KEY ("id_dueno") REFERENCES "dueno"("id_dueno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajador" ADD CONSTRAINT "trabajador_id_dueno_fkey" FOREIGN KEY ("id_dueno") REFERENCES "dueno"("id_dueno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_trabajo" ADD CONSTRAINT "rol_trabajo_id_dueno_fkey" FOREIGN KEY ("id_dueno") REFERENCES "dueno"("id_dueno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desempena" ADD CONSTRAINT "desempena_id_trabajador_fkey" FOREIGN KEY ("id_trabajador") REFERENCES "trabajador"("id_trabajador") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desempena" ADD CONSTRAINT "desempena_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "rol_trabajo"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disponibilidad" ADD CONSTRAINT "disponibilidad_id_trabajador_fkey" FOREIGN KEY ("id_trabajador") REFERENCES "trabajador"("id_trabajador") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disponibilidad" ADD CONSTRAINT "disponibilidad_id_dueno_fkey" FOREIGN KEY ("id_dueno") REFERENCES "dueno"("id_dueno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion_personal" ADD CONSTRAINT "asignacion_personal_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "evento"("id_evento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion_personal" ADD CONSTRAINT "asignacion_personal_id_trabajador_fkey" FOREIGN KEY ("id_trabajador") REFERENCES "trabajador"("id_trabajador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion_personal" ADD CONSTRAINT "asignacion_personal_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "rol_trabajo"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion_personal" ADD CONSTRAINT "asignacion_personal_id_dueno_fkey" FOREIGN KEY ("id_dueno") REFERENCES "dueno"("id_dueno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_cliente" ADD CONSTRAINT "pago_cliente_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "evento"("id_evento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_cliente" ADD CONSTRAINT "pago_cliente_id_contador_fkey" FOREIGN KEY ("id_contador") REFERENCES "contador"("id_contador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gasto_evento" ADD CONSTRAINT "gasto_evento_id_asignacion_fkey" FOREIGN KEY ("id_asignacion") REFERENCES "asignacion_personal"("id_asignacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gasto_evento" ADD CONSTRAINT "gasto_evento_id_contador_fkey" FOREIGN KEY ("id_contador") REFERENCES "contador"("id_contador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_remuneracion" ADD CONSTRAINT "pago_remuneracion_id_asignacion_fkey" FOREIGN KEY ("id_asignacion") REFERENCES "asignacion_personal"("id_asignacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_remuneracion" ADD CONSTRAINT "pago_remuneracion_id_contador_fkey" FOREIGN KEY ("id_contador") REFERENCES "contador"("id_contador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mes_contable" ADD CONSTRAINT "mes_contable_id_contador_fkey" FOREIGN KEY ("id_contador") REFERENCES "contador"("id_contador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gasto_fijo" ADD CONSTRAINT "gasto_fijo_id_mes_fkey" FOREIGN KEY ("id_mes") REFERENCES "mes_contable"("id_mes") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gasto_fijo" ADD CONSTRAINT "gasto_fijo_id_contador_fkey" FOREIGN KEY ("id_contador") REFERENCES "contador"("id_contador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auspiciador" ADD CONSTRAINT "auspiciador_id_dueno_fkey" FOREIGN KEY ("id_dueno") REFERENCES "dueno"("id_dueno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acuerdo_auspicio" ADD CONSTRAINT "acuerdo_auspicio_id_auspiciador_fkey" FOREIGN KEY ("id_auspiciador") REFERENCES "auspiciador"("id_auspiciador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acuerdo_auspicio" ADD CONSTRAINT "acuerdo_auspicio_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "evento"("id_evento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acuerdo_auspicio" ADD CONSTRAINT "acuerdo_auspicio_id_dueno_fkey" FOREIGN KEY ("id_dueno") REFERENCES "dueno"("id_dueno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cumplimiento_aporte" ADD CONSTRAINT "cumplimiento_aporte_id_acuerdo_fkey" FOREIGN KEY ("id_acuerdo") REFERENCES "acuerdo_auspicio"("id_acuerdo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cumplimiento_aporte" ADD CONSTRAINT "cumplimiento_aporte_id_contador_fkey" FOREIGN KEY ("id_contador") REFERENCES "contador"("id_contador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kit" ADD CONSTRAINT "kit_id_jefe_fkey" FOREIGN KEY ("id_jefe") REFERENCES "jefe_area_tecnica"("id_jefe") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_kit" ADD CONSTRAINT "reserva_kit_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "evento"("id_evento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_kit" ADD CONSTRAINT "reserva_kit_id_kit_fkey" FOREIGN KEY ("id_kit") REFERENCES "kit"("id_kit") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_kit" ADD CONSTRAINT "reserva_kit_id_dueno_fkey" FOREIGN KEY ("id_dueno") REFERENCES "dueno"("id_dueno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipo" ADD CONSTRAINT "equipo_id_kit_fkey" FOREIGN KEY ("id_kit") REFERENCES "kit"("id_kit") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipo" ADD CONSTRAINT "equipo_id_evento_repuesto_fkey" FOREIGN KEY ("id_evento_repuesto") REFERENCES "evento"("id_evento") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipo" ADD CONSTRAINT "equipo_id_jefe_fkey" FOREIGN KEY ("id_jefe") REFERENCES "jefe_area_tecnica"("id_jefe") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salida_kit" ADD CONSTRAINT "salida_kit_id_reserva_fkey" FOREIGN KEY ("id_reserva") REFERENCES "reserva_kit"("id_reserva") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salida_kit" ADD CONSTRAINT "salida_kit_id_asignacion_fkey" FOREIGN KEY ("id_asignacion") REFERENCES "asignacion_personal"("id_asignacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salida_kit" ADD CONSTRAINT "salida_kit_id_jefe_fkey" FOREIGN KEY ("id_jefe") REFERENCES "jefe_area_tecnica"("id_jefe") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisa" ADD CONSTRAINT "revisa_id_salida_fkey" FOREIGN KEY ("id_salida") REFERENCES "salida_kit"("id_salida") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisa" ADD CONSTRAINT "revisa_codigo_fkey" FOREIGN KEY ("codigo") REFERENCES "equipo"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidente" ADD CONSTRAINT "incidente_codigo_fkey" FOREIGN KEY ("codigo") REFERENCES "equipo"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidente" ADD CONSTRAINT "incidente_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "evento"("id_evento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidente" ADD CONSTRAINT "incidente_id_trabajador_fkey" FOREIGN KEY ("id_trabajador") REFERENCES "trabajador"("id_trabajador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidente" ADD CONSTRAINT "incidente_id_jefe_fkey" FOREIGN KEY ("id_jefe") REFERENCES "jefe_area_tecnica"("id_jefe") ON DELETE RESTRICT ON UPDATE CASCADE;

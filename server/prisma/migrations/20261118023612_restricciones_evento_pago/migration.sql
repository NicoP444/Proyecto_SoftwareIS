-- Restricciones que el schema documenta y que Prisma no puede expresar
-- RF-P1-04: el evento termina despues de empezar y su precio es mayor que cero
ALTER TABLE "evento" ADD CONSTRAINT "evento_horario" CHECK ("hora_termino" > "hora_inicio");
ALTER TABLE "evento" ADD CONSTRAINT "evento_precio" CHECK ("precio_acordado" > 0);
-- RF-P1-06: los gastos estimados no pueden ser negativos
ALTER TABLE "evento" ADD CONSTRAINT "evento_gastos_estimados" CHECK ("gastos_estimados" >= 0);
-- RF-P1-09: todo pago del cliente tiene monto positivo
ALTER TABLE "pago_cliente" ADD CONSTRAINT "pago_monto" CHECK ("monto" > 0);
-- RF-P3-02: margen de traslado entre 0 y 300 minutos
ALTER TABLE "dueno" ADD CONSTRAINT "dueno_margen_traslado" CHECK ("margen_traslado_min" BETWEEN 0 AND 300);
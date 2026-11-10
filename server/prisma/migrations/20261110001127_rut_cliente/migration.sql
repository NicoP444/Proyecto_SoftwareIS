-- AlterTable
ALTER TABLE "cliente" ADD COLUMN "rut" VARCHAR(10);

-- Los clientes que ya existen quedan con un RUT temporal
UPDATE "cliente" SET "rut" = 'TMP' || "id_cliente" WHERE "rut" IS NULL;

ALTER TABLE "cliente" ALTER COLUMN "rut" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "cliente_rut_key" ON "cliente"("rut");
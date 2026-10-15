/*
  Warnings:

  - You are about to drop the column `fecha` on the `disponibilidad` table. All the data in the column will be lost.
  - Added the required column `fecha_inicio` to the `disponibilidad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fecha_termino` to the `disponibilidad` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "disponibilidad" DROP COLUMN "fecha",
ADD COLUMN     "fecha_inicio" DATE NOT NULL,
ADD COLUMN     "fecha_termino" DATE NOT NULL;

ALTER TABLE "disponibilidad"
  ADD CONSTRAINT "disponibilidad_rango_fechas" CHECK ("fecha_termino" >= "fecha_inicio");

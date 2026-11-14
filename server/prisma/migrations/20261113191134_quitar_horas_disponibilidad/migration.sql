/*
  Warnings:

  - You are about to drop the column `hora_inicio` on the `disponibilidad` table. All the data in the column will be lost.
  - You are about to drop the column `hora_termino` on the `disponibilidad` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "disponibilidad" DROP COLUMN "hora_inicio",
DROP COLUMN "hora_termino";

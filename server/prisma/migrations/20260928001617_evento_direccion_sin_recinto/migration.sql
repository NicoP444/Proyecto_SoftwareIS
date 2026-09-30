/*
  Warnings:

  - You are about to drop the column `id_recinto` on the `evento` table. All the data in the column will be lost.
  - Added the required column `direccion` to the `evento` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "evento" DROP CONSTRAINT "evento_id_recinto_fkey";

-- AlterTable
ALTER TABLE "evento" DROP COLUMN "id_recinto",
ADD COLUMN     "direccion" VARCHAR(120) NOT NULL;

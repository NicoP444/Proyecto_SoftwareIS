/*
  Warnings:

  - You are about to drop the `recinto` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "recinto" DROP CONSTRAINT "recinto_id_dueno_fkey";

-- DropTable
DROP TABLE "recinto";

-- AlterTable
ALTER TABLE "historial_cambio" ADD COLUMN     "id_contador" INTEGER,
ALTER COLUMN "id_dueno" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "historial_cambio" ADD CONSTRAINT "historial_cambio_id_contador_fkey" FOREIGN KEY ("id_contador") REFERENCES "contador"("id_contador") ON DELETE RESTRICT ON UPDATE CASCADE;

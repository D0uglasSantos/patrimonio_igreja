/*
  Warnings:

  - You are about to drop the column `coordenador` on the `Pastoral` table. All the data in the column will be lost.
  - You are about to drop the column `vice_coordenador` on the `Pastoral` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "FuncaoPastoral" AS ENUM ('COORDENADOR', 'VICE_COORDENADOR');

-- AlterTable
ALTER TABLE "Pastoral" DROP COLUMN "coordenador",
DROP COLUMN "vice_coordenador";

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "funcao_pastoral" "FuncaoPastoral",
ADD COLUMN     "id_pastoral" INTEGER;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_id_pastoral_fkey" FOREIGN KEY ("id_pastoral") REFERENCES "Pastoral"("id_pastoral") ON DELETE SET NULL ON UPDATE CASCADE;

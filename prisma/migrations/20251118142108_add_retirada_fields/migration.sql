-- CreateEnum
CREATE TYPE "FinalidadeUso" AS ENUM ('MATRIZ', 'CAPELA', 'PESSOAL');

-- AlterTable
ALTER TABLE "RetiradaEmprestimo" ADD COLUMN     "data_estimada_devolucao" TIMESTAMP(3),
ADD COLUMN     "finalidade_uso" "FinalidadeUso" NOT NULL DEFAULT 'MATRIZ';

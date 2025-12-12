-- AlterEnum
ALTER TYPE "EstadoBem" ADD VALUE 'EM_MANUTENCAO';

-- AlterTable
ALTER TABLE "Bem" ADD COLUMN     "marca" TEXT,
ADD COLUMN     "modelo" TEXT;

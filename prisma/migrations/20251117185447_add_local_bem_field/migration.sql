-- CreateEnum
CREATE TYPE "LocalBem" AS ENUM ('MATRIZ', 'CAPELA');

-- AlterTable
ALTER TABLE "Bem" ADD COLUMN     "local" "LocalBem" NOT NULL DEFAULT 'MATRIZ';

-- AlterTable
ALTER TABLE "RetiradaEmprestimo" ADD COLUMN     "id_entregador" INTEGER;

-- AddForeignKey
ALTER TABLE "RetiradaEmprestimo" ADD CONSTRAINT "RetiradaEmprestimo_id_entregador_fkey" FOREIGN KEY ("id_entregador") REFERENCES "Usuario"("id_user") ON DELETE SET NULL ON UPDATE CASCADE;


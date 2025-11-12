-- CreateEnum
CREATE TYPE "TipoUser" AS ENUM ('ADM', 'COMUM');

-- CreateEnum
CREATE TYPE "EstadoBem" AS ENUM ('NOVO', 'USADO', 'QUEBRADO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id_user" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "tipo_user" "TipoUser" NOT NULL DEFAULT 'COMUM',

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "Bem" (
    "id_bem" SERIAL NOT NULL,
    "nome_bem" TEXT NOT NULL,
    "estado" "EstadoBem" NOT NULL DEFAULT 'USADO',
    "foto" TEXT,
    "valor" DECIMAL(10,2),
    "codigo" TEXT NOT NULL,

    CONSTRAINT "Bem_pkey" PRIMARY KEY ("id_bem")
);

-- CreateTable
CREATE TABLE "Pastoral" (
    "id_pastoral" SERIAL NOT NULL,
    "nome_pastoral" TEXT NOT NULL,
    "coordenador" TEXT NOT NULL,
    "vice_coordenador" TEXT,

    CONSTRAINT "Pastoral_pkey" PRIMARY KEY ("id_pastoral")
);

-- CreateTable
CREATE TABLE "RetiradaEmprestimo" (
    "id" SERIAL NOT NULL,
    "id_bem" INTEGER NOT NULL,
    "id_retirante" INTEGER NOT NULL,
    "id_recebedor" INTEGER,
    "id_pastoral" INTEGER NOT NULL,
    "data_retirada" TIMESTAMP(3) NOT NULL,
    "data_entrega" TIMESTAMP(3),
    "estado_retirada" "EstadoBem" NOT NULL,
    "estado_devolucao" "EstadoBem",
    "descricao_motivo_retirada" TEXT,
    "email_retirante" TEXT NOT NULL,

    CONSTRAINT "RetiradaEmprestimo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Bem_codigo_key" ON "Bem"("codigo");

-- AddForeignKey
ALTER TABLE "RetiradaEmprestimo" ADD CONSTRAINT "RetiradaEmprestimo_id_bem_fkey" FOREIGN KEY ("id_bem") REFERENCES "Bem"("id_bem") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetiradaEmprestimo" ADD CONSTRAINT "RetiradaEmprestimo_id_pastoral_fkey" FOREIGN KEY ("id_pastoral") REFERENCES "Pastoral"("id_pastoral") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetiradaEmprestimo" ADD CONSTRAINT "RetiradaEmprestimo_id_retirante_fkey" FOREIGN KEY ("id_retirante") REFERENCES "Usuario"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetiradaEmprestimo" ADD CONSTRAINT "RetiradaEmprestimo_id_recebedor_fkey" FOREIGN KEY ("id_recebedor") REFERENCES "Usuario"("id_user") ON DELETE SET NULL ON UPDATE CASCADE;

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { usuarioUpdateSchema } from '@/lib/validations'
import { hashPassword } from '@/lib/auth'

// GET /api/usuarios/[id] - Buscar um usuário específico
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.tipo_user !== 'ADM') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const id = parseInt(resolvedParams.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id_user: id },
      select: {
        id_user: true,
        nome: true,
        email: true,
        tipo_user: true,
        id_pastoral: true,
        funcao_pastoral: true,
        pastoral: {
          select: {
            id_pastoral: true,
            nome_pastoral: true,
          },
        },
      },
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json(usuario)
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT /api/usuarios/[id] - Atualizar um usuário
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.tipo_user !== 'ADM') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const id = parseInt(resolvedParams.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await req.json()
    const validacao = usuarioUpdateSchema.safeParse(body)

    if (!validacao.success) {
      return NextResponse.json({ error: 'Dados inválidos', detalhes: validacao.error.issues }, { status: 400 })
    }

    const { senha, ...dataToUpdate } = validacao.data

    // Se a senha foi fornecida, faz o hash
    if (senha) {
      ;(dataToUpdate as any).senha = await hashPassword(senha)
    }

    // TODO: Adicionar validação de cardinalidade da pastoral se a função ou pastoral do usuário mudar

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id_user: id },
      data: dataToUpdate,
    })

    return NextResponse.json(usuarioAtualizado)
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/usuarios/[id] - Deletar um usuário (ADM apenas)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.tipo_user !== 'ADM') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem deletar usuários.' }, { status: 403 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const id = parseInt(resolvedParams.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // Verificar se o usuário existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id_user: id },
      include: {
        retiradas: true, // Verificar todos os empréstimos (histórico completo)
      },
    })

    if (!usuarioExistente) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Não permitir que um administrador exclua a si mesmo
    if (session.user.id === id) {
      return NextResponse.json({ error: 'Não é possível excluir seu próprio usuário' }, { status: 400 })
    }

    // Verificar se há empréstimos ativos
    const emprestimosAtivos = usuarioExistente.retiradas.filter((emp: { data_entrega: Date | null }) => !emp.data_entrega)
    if (emprestimosAtivos.length > 0) {
      return NextResponse.json({ error: 'Não é possível deletar um usuário com empréstimos ativos' }, { status: 400 })
    }

    // Verificar se há empréstimos históricos como retirante (o banco bloqueia com ON DELETE RESTRICT)
    if (usuarioExistente.retiradas.length > 0) {
      return NextResponse.json({ error: 'Não é possível deletar um usuário que possui histórico de empréstimos como retirante. O histórico deve ser preservado.' }, { status: 400 })
    }

    await prisma.usuario.delete({
      where: { id_user: id },
    })

    return NextResponse.json({ message: 'Usuário deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return NextResponse.json({ error: 'Erro ao deletar usuário', detalhe: (error as any)?.message || error }, { status: 500 })
  }
}

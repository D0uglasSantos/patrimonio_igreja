import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { bemUpdateSchema } from '@/lib/validations'

// GET /api/bens/[id] - Buscar um bem específico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  const id = resolvedParams.id
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    console.log('params recebido na API GET /api/bens/[id]:', resolvedParams, 'id:', id)
    if (!id || typeof id !== 'string') {
      console.log('Erro: id ausente ou não é string: ', id)
      return NextResponse.json({ error: 'ID ausente ou inválido', paramsRec: resolvedParams }, { status: 400 })
    }
    const idInt = parseInt(id)
    console.log('Resultado do parseInt para id:', idInt)
    if (isNaN(idInt)) {
      console.log('Erro: id não é número:', id)
      return NextResponse.json({ error: 'ID inválido', paramsId: id }, { status: 400 })
    }

    const bem = await prisma.bem.findUnique({
      where: { id_bem: idInt },
      include: {
        emprestimos: {
          include: {
            retirante: {
              select: {
                id_user: true,
                nome: true,
                email: true,
              },
            },
            entregador: {
              select: {
                id_user: true,
                nome: true,
                email: true,
              },
            },
            recebedor: {
              select: {
                id_user: true,
                nome: true,
                email: true,
              },
            },
            pastoral: true,
          },
          orderBy: {
            data_retirada: 'desc',
          },
        },
      },
    })

    if (!bem) {
      return NextResponse.json({ error: 'Bem não encontrado' }, { status: 404 })
    }

    return NextResponse.json(bem)
  } catch (error) {
    console.error('Erro ao buscar bem:', error)
    return NextResponse.json({ error: 'Erro ao buscar bem', detalhe: (error as any)?.message || error }, { status: 500 })
  }
}

// PUT /api/bens/[id] - Atualizar um bem (ADM apenas)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  const id = resolvedParams.id
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (session.user.tipo_user !== 'ADM') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem atualizar bens.' }, { status: 403 })
    }

    const idInt = parseInt(id)
    if (isNaN(idInt)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await req.json()
    const validacao = bemUpdateSchema.safeParse(body)

    if (!validacao.success) {
      return NextResponse.json({ error: 'Dados inválidos', detalhes: (validacao as any).error?.errors }, { status: 400 })
    }

    // Verificar se o bem existe
    const bemExistente = await prisma.bem.findUnique({
      where: { id_bem: idInt },
    })

    if (!bemExistente) {
      return NextResponse.json({ error: 'Bem não encontrado' }, { status: 404 })
    }

    // Se estiver atualizando o código, verificar se já existe outro bem com este código
    if (validacao.data.codigo && validacao.data.codigo !== bemExistente.codigo) {
      const codigoExistente = await prisma.bem.findUnique({
        where: { codigo: validacao.data.codigo },
      })

      if (codigoExistente) {
        return NextResponse.json({ error: 'Já existe um bem com este código' }, { status: 400 })
      }
    }

    const bemAtualizado = await prisma.bem.update({
      where: { id_bem: idInt },
      data: validacao.data,
    })

    return NextResponse.json(bemAtualizado)
  } catch (error) {
    console.error('Erro ao atualizar bem:', error)
    return NextResponse.json({ error: 'Erro ao atualizar bem', detalhe: (error as any)?.message || error }, { status: 500 })
  }
}

// DELETE /api/bens/[id] - Deletar um bem (ADM apenas)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  const id = resolvedParams.id
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (session.user.tipo_user !== 'ADM') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem deletar bens.' }, { status: 403 })
    }

    const idInt = parseInt(id)
    if (isNaN(idInt)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // Verificar se o bem existe
    const bemExistente = await prisma.bem.findUnique({
      where: { id_bem: idInt },
      include: {
        emprestimos: true,
      },
    })

    if (!bemExistente) {
      return NextResponse.json({ error: 'Bem não encontrado' }, { status: 404 })
    }

    // Verificar se há empréstimos ativos
    const emprestimosAtivos = bemExistente.emprestimos.filter(emp => !emp.data_entrega)
    if (emprestimosAtivos.length > 0) {
      return NextResponse.json({ error: 'Não é possível deletar um bem com empréstimos ativos' }, { status: 400 })
    }

    await prisma.bem.delete({
      where: { id_bem: idInt },
    })

    return NextResponse.json({ message: 'Bem deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar bem:', error)
    return NextResponse.json({ error: 'Erro ao deletar bem', detalhe: (error as any)?.message || error }, { status: 500 })
  }
}


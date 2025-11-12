import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { devolucaoSchema } from '@/lib/validations'

// PUT /api/emprestimos/[id]/devolucao - Registrar devolução de bem
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await req.json()
    const validacao = devolucaoSchema.safeParse(body)

    if (!validacao.success) {
      return NextResponse.json({ error: 'Dados inválidos', detalhes: validacao.error.errors }, { status: 400 })
    }

    // Verificar se o empréstimo existe
    const emprestimo = await prisma.retiradaEmprestimo.findUnique({
      where: { id: id },
      include: {
        bem: true,
      },
    })

    if (!emprestimo) {
      return NextResponse.json({ error: 'Empréstimo não encontrado' }, { status: 404 })
    }

    // Verificar se já foi devolvido
    if (emprestimo.data_entrega) {
      return NextResponse.json({ error: 'Este bem já foi devolvido' }, { status: 400 })
    }

    // Verificar se o recebedor existe
    const recebedor = await prisma.usuario.findUnique({
      where: { id_user: validacao.data.id_recebedor },
    })

    if (!recebedor) {
      return NextResponse.json({ error: 'Recebedor não encontrado' }, { status: 404 })
    }

    // Atualizar o registro de empréstimo com os dados da devolução
    const devolucao = await prisma.retiradaEmprestimo.update({
      where: { id: id },
      data: {
        data_entrega: new Date(),
        id_recebedor: validacao.data.id_recebedor,
        estado_devolucao: validacao.data.estado_devolucao,
      },
      include: {
        bem: true,
        pastoral: true,
        retirante: {
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
      },
    })

    // Atualizar o estado do bem se necessário
    if (validacao.data.estado_devolucao !== emprestimo.bem.estado) {
      await prisma.bem.update({
        where: { id_bem: emprestimo.id_bem },
        data: {
          estado: validacao.data.estado_devolucao,
        },
      })
    }

    return NextResponse.json(devolucao)
  } catch (error) {
    console.error('Erro ao registrar devolução:', error)
    return NextResponse.json({ error: 'Erro ao registrar devolução' }, { status: 500 })
  }
}


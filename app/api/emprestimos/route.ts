import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { retiradaSchema } from '@/lib/validations'

// GET /api/emprestimos - Listar empréstimos com filtros
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const ativo = searchParams.get('ativo') // true = apenas ativos, false = apenas devolvidos
    const id_pastoral = searchParams.get('id_pastoral')
    const id_bem = searchParams.get('id_bem')

    const where: any = {}

    if (ativo === 'true') {
      where.data_entrega = null
    } else if (ativo === 'false') {
      where.data_entrega = { not: null }
    }

    if (id_pastoral) {
      where.id_pastoral = parseInt(id_pastoral)
    }

    if (id_bem) {
      where.id_bem = parseInt(id_bem)
    }

    const emprestimos = await prisma.retiradaEmprestimo.findMany({
      where,
      include: {
        bem: true,
        pastoral: true,
        retirante: {
          select: {
            id_user: true,
            nome: true,
            email: true,
            tipo_user: true,
          },
        },
        recebedor: {
          select: {
            id_user: true,
            nome: true,
            email: true,
            tipo_user: true,
          },
        },
      },
      orderBy: {
        data_retirada: 'desc',
      },
    })

    return NextResponse.json(emprestimos)
  } catch (error) {
    console.error('Erro ao buscar empréstimos:', error)
    return NextResponse.json({ error: 'Erro ao buscar empréstimos' }, { status: 500 })
  }
}

// POST /api/emprestimos - Registrar retirada de bem
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const validacao = retiradaSchema.safeParse(body)

    if (!validacao.success) {
      return NextResponse.json({ error: 'Dados inválidos', detalhes: validacao.error.errors }, { status: 400 })
    }

    // Verificar se o bem existe
    const bem = await prisma.bem.findUnique({
      where: { id_bem: validacao.data.id_bem },
      include: {
        emprestimos: {
          where: {
            data_entrega: null,
          },
        },
      },
    })

    if (!bem) {
      return NextResponse.json({ error: 'Bem não encontrado' }, { status: 404 })
    }

    // Verificar se o bem está disponível
    if (bem.emprestimos.length > 0) {
      return NextResponse.json({ error: 'Bem já está emprestado' }, { status: 400 })
    }

    // Verificar se o retirante existe
    const retirante = await prisma.usuario.findUnique({
      where: { id_user: validacao.data.id_retirante },
    })

    if (!retirante) {
      return NextResponse.json({ error: 'Retirante não encontrado' }, { status: 404 })
    }

    // Verificar se a pastoral existe
    const pastoral = await prisma.pastoral.findUnique({
      where: { id_pastoral: validacao.data.id_pastoral },
    })

    if (!pastoral) {
      return NextResponse.json({ error: 'Pastoral não encontrada' }, { status: 404 })
    }

    // Criar o registro de retirada
    const retirada = await prisma.retiradaEmprestimo.create({
      data: {
        ...validacao.data,
        data_retirada: new Date(),
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
      },
    })

    return NextResponse.json(retirada, { status: 201 })
  } catch (error) {
    console.error('Erro ao registrar retirada:', error)
    return NextResponse.json({ error: 'Erro ao registrar retirada' }, { status: 500 })
  }
}


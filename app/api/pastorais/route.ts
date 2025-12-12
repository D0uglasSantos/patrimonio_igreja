import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { pastoralSchema } from '@/lib/validations'

// GET /api/pastorais - Listar pastorais
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const pastorais = await prisma.pastoral.findMany({
      orderBy: {
        nome_pastoral: 'asc',
      },
      include: {
        membros: true,
      },
    })

    return NextResponse.json(pastorais)
  } catch (error) {
    console.error('Erro ao buscar pastorais:', error)
    return NextResponse.json({ error: 'Erro ao buscar pastorais' }, { status: 500 })
  }
}

// POST /api/pastorais - Criar nova pastoral (ADM apenas)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (session.user.tipo_user !== 'ADM') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem cadastrar pastorais.' }, { status: 403 })
    }

    const body = await req.json()
    const validacao = pastoralSchema.safeParse(body)

    if (!validacao.success) {
      return NextResponse.json({ error: 'Dados inválidos', detalhes: validacao.error.issues }, { status: 400 })
    }

    // Criar a pastoral
    const novaPastoral = await prisma.pastoral.create({
      data: {
        nome_pastoral: validacao.data.nome_pastoral,
      },
    })

    return NextResponse.json(novaPastoral, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar pastoral:', error)
    return NextResponse.json({ error: 'Erro ao criar pastoral' }, { status: 500 })
  }
}


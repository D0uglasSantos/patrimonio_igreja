import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { bemSchema } from '@/lib/validations'
import { EstadoBem } from '@prisma/client'

// GET /api/bens - Listar bens com filtros opcionais
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const estado = searchParams.get('estado') as EstadoBem | null
    const disponivel = searchParams.get('disponivel')
    const search = searchParams.get('search')

    const where: any = {}

    if (estado) {
      where.estado = estado
    }

    if (search) {
      where.OR = [
        { nome_bem: { contains: search, mode: 'insensitive' } },
        { codigo: { contains: search, mode: 'insensitive' } },
      ]
    }

    const bens = await prisma.bem.findMany({
      where,
      include: {
        emprestimos: {
          where: {
            // Sempre retornar apenas empréstimos ativos (não devolvidos)
            data_entrega: null,
          },
          orderBy: {
            data_retirada: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        nome_bem: 'asc',
      },
    })

    // Se o filtro disponivel for true, filtrar apenas bens sem empréstimo ativo
    let bensResultado = bens
    if (disponivel === 'true') {
      bensResultado = bens.filter(bem => bem.emprestimos.length === 0)
    } else if (disponivel === 'false') {
      bensResultado = bens.filter(bem => bem.emprestimos.length > 0)
    }

    return NextResponse.json(bensResultado)
  } catch (error) {
    console.error('Erro ao buscar bens:', error)
    return NextResponse.json({ error: 'Erro ao buscar bens' }, { status: 500 })
  }
}

// POST /api/bens - Criar novo bem (ADM apenas)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (session.user.tipo_user !== 'ADM') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem cadastrar bens.' }, { status: 403 })
    }

    const body = await req.json()
    const validacao = bemSchema.safeParse(body)

    if (!validacao.success) {
      return NextResponse.json({ error: 'Dados inválidos', detalhes: validacao.error.issues }, { status: 400 })
    }

    // Verificar se o código já existe
    const bemExistente = await prisma.bem.findUnique({
      where: { codigo: validacao.data.codigo },
    })

    if (bemExistente) {
      return NextResponse.json({ error: 'Já existe um bem com este código' }, { status: 400 })
    }

    const novoBem = await prisma.bem.create({
      data: validacao.data,
    })

    return NextResponse.json(novoBem, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar bem:', error)
    return NextResponse.json({ error: 'Erro ao criar bem' }, { status: 500 })
  }
}


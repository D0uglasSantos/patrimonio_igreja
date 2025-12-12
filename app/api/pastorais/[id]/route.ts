import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { pastoralUpdateSchema } from '@/lib/validations'

// GET /api/pastorais/[id] - Buscar uma pastoral específica
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const id = parseInt(resolvedParams.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const pastoral = await prisma.pastoral.findUnique({
      where: { id_pastoral: id },
    })

    if (!pastoral) {
      return NextResponse.json({ error: 'Pastoral não encontrada' }, { status: 404 })
    }

    return NextResponse.json(pastoral)
  } catch (error) {
    console.error('Erro ao buscar pastoral:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT /api/pastorais/[id] - Atualizar uma pastoral
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
    const validacao = pastoralUpdateSchema.safeParse(body)

    if (!validacao.success) {
      return NextResponse.json({ error: 'Dados inválidos', detalhes: validacao.error.issues }, { status: 400 })
    }

    const pastoralAtualizada = await prisma.pastoral.update({
      where: { id_pastoral: id },
      data: validacao.data,
    })

    return NextResponse.json(pastoralAtualizada)
  } catch (error) {
    console.error('Erro ao atualizar pastoral:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

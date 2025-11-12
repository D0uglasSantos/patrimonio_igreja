import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { usuarioSchema } from '@/lib/validations'
import { hashPassword } from '@/lib/auth'

// GET /api/usuarios - Listar usuários (ADM apenas)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (session.user.tipo_user !== 'ADM') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem listar usuários.' }, { status: 403 })
    }

    const usuarios = await prisma.usuario.findMany({
      select: {
        id_user: true,
        nome: true,
        email: true,
        tipo_user: true,
        // Não retornar a senha
      },
      orderBy: {
        nome: 'asc',
      },
    })

    return NextResponse.json(usuarios)
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
  }
}

// POST /api/usuarios - Criar novo usuário (ADM apenas)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (session.user.tipo_user !== 'ADM') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem cadastrar usuários.' }, { status: 403 })
    }

    const body = await req.json()
    const validacao = usuarioSchema.safeParse(body)

    if (!validacao.success) {
      return NextResponse.json({ error: 'Dados inválidos', detalhes: validacao.error.errors }, { status: 400 })
    }

    // Verificar se o email já existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: validacao.data.email },
    })

    if (usuarioExistente) {
      return NextResponse.json({ error: 'Já existe um usuário com este email' }, { status: 400 })
    }

    // Hash da senha
    const senhaHash = await hashPassword(validacao.data.senha)

    // Criar o usuário
    const novoUsuario = await prisma.usuario.create({
      data: {
        nome: validacao.data.nome,
        email: validacao.data.email,
        senha: senhaHash,
        tipo_user: validacao.data.tipo_user,
      },
      select: {
        id_user: true,
        nome: true,
        email: true,
        tipo_user: true,
      },
    })

    return NextResponse.json(novoUsuario, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
  }
}


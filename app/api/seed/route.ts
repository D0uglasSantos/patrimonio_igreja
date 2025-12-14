import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { TipoUser, EstadoBem } from '@prisma/client'

/**
 * API Route para executar o seed do banco de dados manualmente
 * ⚠️ ATENÇÃO: Esta rota deve ser protegida em produção!
 * 
 * Para usar, faça uma requisição POST para /api/seed
 * Você pode adicionar autenticação ou um token secreto aqui
 */
export async function POST(request: Request) {
  try {
    // ⚠️ Em produção, adicione autenticação aqui!
    // Por exemplo, verificar um token secreto:
    // const authHeader = request.headers.get('authorization')
    // if (authHeader !== `Bearer ${process.env.SEED_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    console.log('🌱 Iniciando seed via API...')

    // Verificar se já existe usuário admin
    const adminExistente = await prisma.usuario.findUnique({
      where: { email: 'admin@paroquia.com' },
    })

    if (adminExistente) {
      return NextResponse.json({
        message: 'Usuário admin já existe. Seed não executado.',
        adminExists: true,
      })
    }

    // Criar usuário administrador
    const senhaHashAdmin = await bcrypt.hash('admin123', 10)
    const admin = await prisma.usuario.create({
      data: {
        nome: 'Administrador',
        email: 'admin@paroquia.com',
        senha: senhaHashAdmin,
        tipo_user: TipoUser.ADM,
      },
    })

    // Criar usuário comum
    const senhaHashComum = await bcrypt.hash('usuario123', 10)
    const usuarioComum = await prisma.usuario.create({
      data: {
        nome: 'João Silva',
        email: 'joao@paroquia.com',
        senha: senhaHashComum,
        tipo_user: TipoUser.COMUM,
      },
    })

    // Criar pastorais
    const pastoralJuventude = await prisma.pastoral.create({
      data: {
        nome_pastoral: 'Pastoral da Juventude',
      },
    })

    const pastoralCaridade = await prisma.pastoral.create({
      data: {
        nome_pastoral: 'Pastoral da Caridade',
      },
    })

    const pastoralLiturgia = await prisma.pastoral.create({
      data: {
        nome_pastoral: 'Pastoral da Liturgia',
      },
    })

    // Criar bens
    const bem1 = await prisma.bem.create({
      data: {
        nome_bem: 'Projetor Multimídia',
        estado: EstadoBem.NOVO,
        valor: 2500.00,
        codigo: 'PROJ-001',
        foto: '/images/projetor.jpg',
      },
    })

    const bem2 = await prisma.bem.create({
      data: {
        nome_bem: 'Caixa de Som Portátil',
        estado: EstadoBem.USADO,
        valor: 800.00,
        codigo: 'AUDIO-001',
        foto: '/images/caixa-som.jpg',
      },
    })

    const bem3 = await prisma.bem.create({
      data: {
        nome_bem: 'Mesa Dobrável',
        estado: EstadoBem.USADO,
        valor: 150.00,
        codigo: 'MOB-001',
      },
    })

    const bem4 = await prisma.bem.create({
      data: {
        nome_bem: 'Cadeira Plástica (Kit 10 unidades)',
        estado: EstadoBem.NOVO,
        valor: 300.00,
        codigo: 'MOB-002',
      },
    })

    const bem5 = await prisma.bem.create({
      data: {
        nome_bem: 'Microfone sem Fio',
        estado: EstadoBem.QUEBRADO,
        valor: 450.00,
        codigo: 'AUDIO-002',
      },
    })

    // Criar empréstimos de exemplo
    await prisma.retiradaEmprestimo.create({
      data: {
        id_bem: bem1.id_bem,
        id_retirante: usuarioComum.id_user,
        id_pastoral: pastoralJuventude.id_pastoral,
        data_retirada: new Date('2024-11-01T10:00:00'),
        data_entrega: new Date('2024-11-05T16:30:00'),
        estado_retirada: EstadoBem.NOVO,
        estado_devolucao: EstadoBem.NOVO,
        descricao_motivo_retirada: 'Apresentação para o grupo de jovens',
        email_retirante: usuarioComum.email,
        id_recebedor: admin.id_user,
      },
    })

    await prisma.retiradaEmprestimo.create({
      data: {
        id_bem: bem2.id_bem,
        id_retirante: usuarioComum.id_user,
        id_pastoral: pastoralCaridade.id_pastoral,
        data_retirada: new Date('2024-11-10T14:00:00'),
        estado_retirada: EstadoBem.USADO,
        descricao_motivo_retirada: 'Evento beneficente no salão',
        email_retirante: usuarioComum.email,
      },
    })

    return NextResponse.json({
      message: 'Seed executado com sucesso!',
      created: {
        usuarios: 2,
        pastorais: 3,
        bens: 5,
        emprestimos: 2,
      },
      credentials: {
        admin: 'admin@paroquia.com / admin123',
        usuario: 'joao@paroquia.com / usuario123',
      },
    })
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error)
    return NextResponse.json(
      {
        error: 'Erro ao executar seed',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET /api/dashboard/stats - Estatísticas gerais para o dashboard
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Estatísticas de Bens
    const totalBens = await prisma.bem.count()
    
    const bensPorEstado = await prisma.bem.groupBy({
      by: ['estado'],
      _count: true,
    })

    // Empréstimos ativos (sem data_entrega)
    const emprestimosAtivos = await prisma.retiradaEmprestimo.count({
      where: {
        data_entrega: null,
      },
    })

    // Total de empréstimos
    const totalEmprestimos = await prisma.retiradaEmprestimo.count()

    // Empréstimos dos últimos 30 dias
    const trintaDiasAtras = new Date()
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)
    
    const emprestimosUltimos30Dias = await prisma.retiradaEmprestimo.count({
      where: {
        data_retirada: {
          gte: trintaDiasAtras,
        },
      },
    })

    // Empréstimos por mês (últimos 6 meses)
    const seisMesesAtras = new Date()
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6)
    
    const emprestimosPorMes = await prisma.retiradaEmprestimo.findMany({
      where: {
        data_retirada: {
          gte: seisMesesAtras,
        },
      },
      select: {
        data_retirada: true,
      },
    })

    // Agrupar por mês
    const emprestimosPorMesAgrupados = emprestimosPorMes.reduce((acc: any, emp) => {
      const mes = new Date(emp.data_retirada).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
      acc[mes] = (acc[mes] || 0) + 1
      return acc
    }, {})

    // Estatísticas de Pastorais
    const totalPastorais = await prisma.pastoral.count()

    // Pastorais com mais empréstimos
    const pastoraisComEmprestimos = await prisma.pastoral.findMany({
      include: {
        emprestimos: {
          where: {
            data_entrega: null,
          },
        },
      },
      orderBy: {
        emprestimos: {
          _count: 'desc',
        },
      },
      take: 5,
    })

    // Estatísticas de Usuários
    const totalUsuarios = await prisma.usuario.count()

    // Valor total do patrimônio
    const valorTotal = await prisma.bem.aggregate({
      _sum: {
        valor: true,
      },
    })

    return NextResponse.json({
      bens: {
        total: totalBens,
        porEstado: bensPorEstado.reduce((acc: any, item) => {
          acc[item.estado] = item._count
          return acc
        }, {}),
        disponiveis: totalBens - emprestimosAtivos,
        emprestados: emprestimosAtivos,
      },
      emprestimos: {
        total: totalEmprestimos,
        ativos: emprestimosAtivos,
        ultimos30Dias: emprestimosUltimos30Dias,
        porMes: emprestimosPorMesAgrupados,
      },
      pastorais: {
        total: totalPastorais,
        topPastorais: pastoraisComEmprestimos.map(p => ({
          id: p.id_pastoral,
          nome: p.nome_pastoral,
          emprestimosAtivos: p.emprestimos.length,
        })),
      },
      usuarios: {
        total: totalUsuarios,
      },
      patrimonio: {
        valorTotal: valorTotal._sum.valor || 0,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}

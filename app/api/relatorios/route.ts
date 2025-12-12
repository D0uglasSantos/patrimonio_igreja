import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { EstadoBem } from '@prisma/client'
import ExcelJS from 'exceljs'

// GET /api/relatorios - Gerar relatório com filtros
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tipo = searchParams.get('tipo') // 'bens', 'emprestimos', 'pastorais'
    const formato = searchParams.get('formato') // 'json', 'excel'
    const estado = searchParams.get('estado') as EstadoBem | null
    const id_pastoral = searchParams.get('id_pastoral')
    const disponivel = searchParams.get('disponivel')
    const data_inicio = searchParams.get('data_inicio')
    const data_fim = searchParams.get('data_fim')

    if (!tipo) {
      return NextResponse.json({ error: 'Tipo de relatório não especificado' }, { status: 400 })
    }

    let dados: any[] = []

    // Relatório de Bens
    if (tipo === 'bens') {
      const where: any = {}

      if (estado) {
        where.estado = estado
      }

      const bens = await prisma.bem.findMany({
        where,
        include: {
          emprestimos: {
            where: {
              data_entrega: null,
            },
            take: 1,
          },
        },
        orderBy: {
          nome_bem: 'asc',
        },
      })

      // Filtrar por disponibilidade se especificado
      let bensResultado = bens
      if (disponivel === 'true') {
        bensResultado = bens.filter(bem => bem.emprestimos.length === 0)
      } else if (disponivel === 'false') {
        bensResultado = bens.filter(bem => bem.emprestimos.length > 0)
      }

      dados = bensResultado.map(bem => ({
        id_bem: bem.id_bem,
        nome_bem: bem.nome_bem,
        codigo: bem.codigo,
        estado: bem.estado,
        valor: bem.valor?.toString() || 'N/A',
        disponivel: bem.emprestimos.length === 0 ? 'Sim' : 'Não',
      }))
    }

    // Relatório de Empréstimos
    else if (tipo === 'emprestimos') {
      const where: any = {}

      if (id_pastoral) {
        where.id_pastoral = parseInt(id_pastoral)
      }

      if (data_inicio || data_fim) {
        where.data_retirada = {}
        if (data_inicio) {
          where.data_retirada.gte = new Date(data_inicio)
        }
        if (data_fim) {
          where.data_retirada.lte = new Date(data_fim)
        }
      }

      const emprestimos = await prisma.retiradaEmprestimo.findMany({
        where,
        include: {
          bem: true,
          pastoral: true,
          retirante: {
            select: {
              nome: true,
              email: true,
            },
          },
          recebedor: {
            select: {
              nome: true,
            },
          },
        },
        orderBy: {
          data_retirada: 'desc',
        },
      })

      dados = emprestimos.map(emp => ({
        id: emp.id,
        bem: emp.bem.nome_bem,
        codigo_bem: emp.bem.codigo,
        retirante: emp.retirante.nome,
        email_retirante: emp.email_retirante,
        pastoral: emp.pastoral.nome_pastoral,
        data_retirada: emp.data_retirada.toISOString(),
        data_entrega: emp.data_entrega?.toISOString() || 'Ainda emprestado',
        estado_retirada: emp.estado_retirada,
        estado_devolucao: emp.estado_devolucao || 'N/A',
        recebedor: emp.recebedor?.nome || 'N/A',
        motivo: emp.descricao_motivo_retirada || 'N/A',
      }))
    }

    // Relatório de Pastorais
    else if (tipo === 'pastorais') {
      const pastorais = await prisma.pastoral.findMany({
        include: {
          emprestimos: {
            include: {
              bem: true,
            },
          },
          membros: true,
        },
        orderBy: {
          nome_pastoral: 'asc',
        },
      })

      dados = pastorais.map(pastoral => {
        const coordenador = pastoral.membros.find(m => m.funcao_pastoral === 'COORDENADOR')
        const viceCoordenador = pastoral.membros.find(m => m.funcao_pastoral === 'VICE_COORDENADOR')
        
        return {
          id_pastoral: pastoral.id_pastoral,
          nome_pastoral: pastoral.nome_pastoral,
          coordenador: coordenador?.nome || 'N/A',
          vice_coordenador: viceCoordenador?.nome || 'N/A',
          total_emprestimos: pastoral.emprestimos.length,
          emprestimos_ativos: pastoral.emprestimos.filter(e => !e.data_entrega).length,
        }
      })
    } else {
      return NextResponse.json({ error: 'Tipo de relatório inválido' }, { status: 400 })
    }

    // Retornar JSON
    if (!formato || formato === 'json') {
      return NextResponse.json({
        tipo,
        data_geracao: new Date().toISOString(),
        total_registros: dados.length,
        dados,
      })
    }

    // Exportar para Excel
    if (formato === 'excel') {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Relatório')

      // Adicionar cabeçalhos
      if (dados.length > 0) {
        const headers = Object.keys(dados[0])
        worksheet.addRow(headers)

        // Estilizar cabeçalhos
        worksheet.getRow(1).font = { bold: true }
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9D9D9' },
        }

        // Adicionar dados
        dados.forEach(item => {
          worksheet.addRow(Object.values(item))
        })

        // Auto-ajustar largura das colunas
        worksheet.columns.forEach(column => {
          let maxLength = 0
          column.eachCell!({ includeEmpty: true }, cell => {
            const columnLength = cell.value ? cell.value.toString().length : 10
            if (columnLength > maxLength) {
              maxLength = columnLength
            }
          })
          column.width = maxLength < 10 ? 10 : maxLength + 2
        })
      }

      // Gerar buffer
      const buffer = await workbook.xlsx.writeBuffer()

      // Retornar arquivo Excel
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="relatorio_${tipo}_${new Date().getTime()}.xlsx"`,
        },
      })
    }

    return NextResponse.json({ error: 'Formato não suportado' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 })
  }
}


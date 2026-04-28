import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import ExcelJS from 'exceljs'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (session.user.tipo_user !== 'ADM') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem exportar pastorais.' },
        { status: 403 }
      )
    }

    const pastorais = await prisma.pastoral.findMany({
      include: {
        membros: true,
        emprestimos: {
          where: {
            data_entrega: null,
          },
        },
      },
      orderBy: {
        nome_pastoral: 'asc',
      },
    })

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Pastorais')

    worksheet.columns = [
      { header: 'id_pastoral', key: 'id_pastoral', width: 14 },
      { header: 'nome_pastoral', key: 'nome_pastoral', width: 36 },
      { header: 'total_membros', key: 'total_membros', width: 16 },
      { header: 'coordenadores', key: 'coordenadores', width: 16 },
      { header: 'vice_coordenadores', key: 'vice_coordenadores', width: 20 },
      { header: 'emprestimos_ativos', key: 'emprestimos_ativos', width: 18 },
    ]

    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' },
    }

    pastorais.forEach((pastoral) => {
      const coordenadores = pastoral.membros.filter(
        (membro) => membro.funcao_pastoral === 'COORDENADOR'
      ).length
      const viceCoordenadores = pastoral.membros.filter(
        (membro) => membro.funcao_pastoral === 'VICE_COORDENADOR'
      ).length

      worksheet.addRow({
        id_pastoral: pastoral.id_pastoral,
        nome_pastoral: pastoral.nome_pastoral,
        total_membros: pastoral.membros.length,
        coordenadores,
        vice_coordenadores: viceCoordenadores,
        emprestimos_ativos: pastoral.emprestimos.length,
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="pastorais_${Date.now()}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Erro ao exportar pastorais:', error)
    return NextResponse.json({ error: 'Erro ao exportar pastorais' }, { status: 500 })
  }
}

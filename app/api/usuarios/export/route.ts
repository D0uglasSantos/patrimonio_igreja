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
        { error: 'Acesso negado. Apenas administradores podem exportar usuários.' },
        { status: 403 }
      )
    }

    const usuarios = await prisma.usuario.findMany({
      select: {
        id_user: true,
        nome: true,
        email: true,
        tipo_user: true,
        funcao_pastoral: true,
        pastoral: {
          select: {
            nome_pastoral: true,
          },
        },
      },
      orderBy: {
        nome: 'asc',
      },
    })

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Usuarios')

    worksheet.columns = [
      { header: 'id_user', key: 'id_user', width: 12 },
      { header: 'nome', key: 'nome', width: 30 },
      { header: 'email', key: 'email', width: 36 },
      { header: 'tipo_user', key: 'tipo_user', width: 16 },
      { header: 'pastoral', key: 'pastoral', width: 28 },
      { header: 'funcao_pastoral', key: 'funcao_pastoral', width: 24 },
    ]

    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' },
    }

    usuarios.forEach((usuario) => {
      worksheet.addRow({
        id_user: usuario.id_user,
        nome: usuario.nome,
        email: usuario.email,
        tipo_user: usuario.tipo_user,
        pastoral: usuario.pastoral?.nome_pastoral || 'N/A',
        funcao_pastoral: usuario.funcao_pastoral || 'N/A',
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="usuarios_${Date.now()}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Erro ao exportar usuários:', error)
    return NextResponse.json({ error: 'Erro ao exportar usuários' }, { status: 500 })
  }
}

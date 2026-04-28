import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import ExcelJS from 'exceljs'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (session.user.tipo_user !== 'ADM') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem baixar o template.' },
        { status: 403 }
      )
    }

    const workbook = new ExcelJS.Workbook()

    const worksheet = workbook.addWorksheet('Importacao de Pastorais')
    worksheet.columns = [{ header: 'nome_pastoral', key: 'nome_pastoral', width: 42 }]

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF002045' },
    }

    worksheet.addRow({
      nome_pastoral: 'Pastoral da Juventude',
    })

    const instrucoes = workbook.addWorksheet('Instrucoes')
    instrucoes.columns = [
      { header: 'Campo', key: 'campo', width: 24 },
      { header: 'Regra', key: 'regra', width: 80 },
    ]
    instrucoes.getRow(1).font = { bold: true }
    instrucoes.addRows([
      { campo: 'nome_pastoral', regra: 'Obrigatório. Mínimo de 3 caracteres.' },
      { campo: 'limite', regra: 'Máximo de 3000 linhas por importação.' },
    ])

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `template_importacao_pastorais_${Date.now()}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar template de importação de pastorais:', error)
    return NextResponse.json({ error: 'Erro ao gerar template de importação' }, { status: 500 })
  }
}

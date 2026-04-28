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

    const worksheet = workbook.addWorksheet('Importacao de Bens')
    worksheet.columns = [
      { header: 'nome_bem', key: 'nome_bem', width: 40 },
      { header: 'codigo', key: 'codigo', width: 24 },
      { header: 'estado', key: 'estado', width: 20 },
      { header: 'local', key: 'local', width: 16 },
      { header: 'valor', key: 'valor', width: 14 },
      { header: 'marca', key: 'marca', width: 22 },
      { header: 'modelo', key: 'modelo', width: 22 },
      { header: 'foto', key: 'foto', width: 40 },
    ]

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF002045' },
    }

    worksheet.addRow({
      nome_bem: 'Projetor Multimídia',
      codigo: 'PROJ-001',
      estado: 'USADO',
      local: 'MATRIZ',
      valor: 2500.5,
      marca: 'Epson',
      modelo: 'PowerLite S41+',
      foto: 'https://exemplo.com/imagem.jpg',
    })

    const instrucoes = workbook.addWorksheet('Instrucoes')
    instrucoes.columns = [
      { header: 'Campo', key: 'campo', width: 24 },
      { header: 'Regra', key: 'regra', width: 80 },
    ]
    instrucoes.getRow(1).font = { bold: true }
    instrucoes.addRows([
      { campo: 'nome_bem', regra: 'Obrigatório. Mínimo de 3 caracteres.' },
      { campo: 'codigo', regra: 'Obrigatório e único no sistema.' },
      { campo: 'estado', regra: 'Opcional. Use: NOVO, USADO, QUEBRADO, EM_MANUTENCAO. Padrão: USADO.' },
      { campo: 'local', regra: 'Opcional. Use: MATRIZ ou CAPELA. Padrão: MATRIZ.' },
      { campo: 'valor', regra: 'Opcional. Número positivo. Ex.: 2500,50 ou 2500.50.' },
      { campo: 'marca', regra: 'Opcional.' },
      { campo: 'modelo', regra: 'Opcional.' },
      { campo: 'foto', regra: 'Opcional. URL completa iniciando com http:// ou https://.' },
      { campo: 'limite', regra: 'Máximo de 3000 linhas de bens por importação.' },
    ])

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `template_importacao_bens_${new Date().getTime()}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar template de importação de bens:', error)
    return NextResponse.json({ error: 'Erro ao gerar template de importação' }, { status: 500 })
  }
}

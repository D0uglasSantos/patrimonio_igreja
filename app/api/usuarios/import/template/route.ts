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

    const worksheet = workbook.addWorksheet('Importacao de Usuarios')
    worksheet.columns = [
      { header: 'nome', key: 'nome', width: 32 },
      { header: 'email', key: 'email', width: 34 },
      { header: 'senha', key: 'senha', width: 20 },
      { header: 'tipo_user', key: 'tipo_user', width: 16 },
      { header: 'pastoral', key: 'pastoral', width: 28 },
      { header: 'funcao_pastoral', key: 'funcao_pastoral', width: 24 },
    ]

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF002045' },
    }

    worksheet.addRow({
      nome: 'João da Silva',
      email: 'joao.silva@paroquia.com',
      senha: 'senha123',
      tipo_user: 'COMUM',
      pastoral: 'Pastoral da Juventude',
      funcao_pastoral: 'VICE_COORDENADOR',
    })

    const instrucoes = workbook.addWorksheet('Instrucoes')
    instrucoes.columns = [
      { header: 'Campo', key: 'campo', width: 24 },
      { header: 'Regra', key: 'regra', width: 90 },
    ]
    instrucoes.getRow(1).font = { bold: true }
    instrucoes.addRows([
      { campo: 'nome', regra: 'Obrigatório. Mínimo de 3 caracteres.' },
      { campo: 'email', regra: 'Obrigatório. Deve ser único no sistema.' },
      { campo: 'senha', regra: 'Obrigatório. Mínimo de 6 caracteres.' },
      { campo: 'tipo_user', regra: 'Opcional. ADM ou COMUM. Padrão: COMUM.' },
      {
        campo: 'pastoral',
        regra: 'Obrigatório. Deve corresponder exatamente ao nome de uma pastoral cadastrada.',
      },
      {
        campo: 'funcao_pastoral',
        regra: 'Opcional. COORDENADOR ou VICE_COORDENADOR. Padrão: VICE_COORDENADOR.',
      },
      {
        campo: 'limites',
        regra: 'Cada pastoral permite no máximo 4 coordenadores e 2 vice-coordenadores.',
      },
      { campo: 'limite', regra: 'Máximo de 3000 linhas por importação.' },
    ])

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `template_importacao_usuarios_${Date.now()}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar template de importação de usuários:', error)
    return NextResponse.json({ error: 'Erro ao gerar template de importação' }, { status: 500 })
  }
}

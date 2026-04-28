import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import * as XLSX from 'xlsx'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { pastoralSchema } from '@/lib/validations'

const MAX_IMPORT_ROWS = 3000
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

type RowError = {
  linha: number
  campo: string
  mensagem: string
}

const headerAliases = ['nome_pastoral', 'nome pastoral', 'nome']

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (session.user.tipo_user !== 'ADM') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem importar pastorais.' },
        { status: 403 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'O arquivo está vazio' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Limite máximo: 10MB' },
        { status: 400 }
      )
    }

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      return NextResponse.json(
        { error: 'Formato inválido. Envie um arquivo .xlsx' },
        { status: 400 }
      )
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', raw: false, cellDates: true })
    const firstSheetName = workbook.SheetNames[0]

    if (!firstSheetName) {
      return NextResponse.json({ error: 'Planilha não encontrada no arquivo' }, { status: 400 })
    }

    const worksheet = workbook.Sheets[firstSheetName]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      defval: '',
      raw: false,
      blankrows: false,
    })

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Planilha vazia' }, { status: 400 })
    }

    const headers = rows[0].map(normalizeHeader)
    const nomeIndex = headers.findIndex((header) => headerAliases.includes(header))

    if (nomeIndex === -1) {
      return NextResponse.json(
        { error: 'Cabeçalho inválido. O template deve conter a coluna "nome_pastoral".' },
        { status: 400 }
      )
    }

    const errors: RowError[] = []
    const pastoraisToCreate: { nome_pastoral: string }[] = []
    const seenNames = new Set<string>()

    for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex]
      const rowNumber = rowIndex + 1
      const nome_pastoral = normalizeCell(row[nomeIndex])

      if (!nome_pastoral) continue

      const parsed = pastoralSchema.safeParse({ nome_pastoral })
      if (!parsed.success) {
        parsed.error.issues.forEach((issue) => {
          errors.push({
            linha: rowNumber,
            campo: String(issue.path[0] ?? 'campo'),
            mensagem: issue.message,
          })
        })
        continue
      }

      const key = nome_pastoral.toLowerCase()
      if (seenNames.has(key)) {
        errors.push({
          linha: rowNumber,
          campo: 'nome_pastoral',
          mensagem: 'Nome de pastoral duplicado no arquivo',
        })
        continue
      }
      seenNames.add(key)
      pastoraisToCreate.push({ nome_pastoral })
    }

    if (pastoraisToCreate.length === 0 && errors.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma linha válida encontrada para importação' },
        { status: 400 }
      )
    }

    if (pastoraisToCreate.length > MAX_IMPORT_ROWS) {
      return NextResponse.json(
        { error: `A planilha excede o limite de ${MAX_IMPORT_ROWS} linhas de pastorais` },
        { status: 400 }
      )
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'A planilha contém dados inválidos',
          erros: errors.slice(0, 200),
          totalErros: errors.length,
        },
        { status: 400 }
      )
    }

    const pastoraisExistentes = await prisma.pastoral.findMany({
      where: {
        nome_pastoral: {
          in: pastoraisToCreate.map((pastoral) => pastoral.nome_pastoral),
        },
      },
      select: {
        nome_pastoral: true,
      },
    })

    if (pastoraisExistentes.length > 0) {
      return NextResponse.json(
        {
          error: 'Existem pastorais já cadastradas no sistema',
          pastorais: pastoraisExistentes.map((pastoral) => pastoral.nome_pastoral),
        },
        { status: 400 }
      )
    }

    const result = await prisma.pastoral.createMany({
      data: pastoraisToCreate,
    })

    return NextResponse.json({
      message: 'Importação de pastorais concluída com sucesso',
      totalImportados: result.count,
      totalProcessados: pastoraisToCreate.length,
    })
  } catch (error) {
    console.error('Erro ao importar pastorais em massa:', error)
    const detalhes = error instanceof Error ? error.message : 'Erro inesperado'
    return NextResponse.json(
      { error: 'Erro ao importar pastorais em massa', detalhes },
      { status: 500 }
    )
  }
}

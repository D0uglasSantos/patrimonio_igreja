import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import * as XLSX from 'xlsx'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { bemSchema } from '@/lib/validations'

const MAX_IMPORT_ROWS = 3000
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

type RowError = {
  linha: number
  campo: string
  mensagem: string
}

type RawRowData = {
  nome_bem: string
  codigo: string
  estado: 'NOVO' | 'USADO' | 'QUEBRADO' | 'EM_MANUTENCAO'
  local: 'MATRIZ' | 'CAPELA'
  valor: number | null
  marca: string | null
  modelo: string | null
  foto: string | null
}

const headerAliases: Record<keyof RawRowData, string[]> = {
  nome_bem: ['nome_bem', 'nome do bem', 'nome'],
  codigo: ['codigo', 'código'],
  estado: ['estado'],
  local: ['local', 'localizacao', 'localização'],
  valor: ['valor', 'valor rs', 'valor r$', 'preco', 'preço'],
  marca: ['marca'],
  modelo: ['modelo'],
  foto: ['foto', 'url foto', 'foto url', 'url da foto'],
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function normalizeCellToString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object' && value !== null && 'text' in value) {
    return String((value as { text?: unknown }).text ?? '').trim()
  }
  return String(value).trim()
}

function normalizeEstado(value: string): RawRowData['estado'] {
  const raw = value.trim().toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  if (!raw) return 'USADO'
  if (raw === 'NOVO') return 'NOVO'
  if (raw === 'USADO') return 'USADO'
  if (raw === 'QUEBRADO') return 'QUEBRADO'
  if (raw === 'EM_MANUTENCAO' || raw === 'EM MANUTENCAO' || raw === 'MANUTENCAO') {
    return 'EM_MANUTENCAO'
  }
  return 'USADO'
}

function normalizeLocal(value: string): RawRowData['local'] {
  const raw = value.trim().toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  if (raw === 'CAPELA') return 'CAPELA'
  return 'MATRIZ'
}

function normalizeValor(value: string): number | null {
  if (!value) return null
  const hasDot = value.includes('.')
  const hasComma = value.includes(',')

  let normalized = value
  if (hasDot && hasComma) {
    normalized = value.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    normalized = value.replace(',', '.')
  }

  normalized = normalized.replace(/[^\d.-]/g, '')
  const parsed = Number(normalized)
  return Number.isNaN(parsed) ? Number.NaN : parsed
}

function buildHeaderMap(headerRowValues: unknown[]): Partial<Record<keyof RawRowData, number>> {
  const normalizedHeaders = headerRowValues.map(normalizeHeader)
  const map: Partial<Record<keyof RawRowData, number>> = {}

  for (const key of Object.keys(headerAliases) as Array<keyof RawRowData>) {
    const aliases = headerAliases[key]
    const index = normalizedHeaders.findIndex((header) => aliases.includes(header))
    if (index !== -1) {
      map[key] = index
    }
  }

  return map
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (session.user.tipo_user !== 'ADM') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem importar bens.' },
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

    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.xlsx')) {
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

    const headerValues = rows[0]
    const headerMap = buildHeaderMap(headerValues)

    if (headerMap.nome_bem === undefined || headerMap.codigo === undefined) {
      return NextResponse.json(
        { error: 'Cabeçalho inválido. O template deve conter as colunas "nome_bem" e "codigo".' },
        { status: 400 }
      )
    }

    const errors: RowError[] = []
    const rowsToCreate: RawRowData[] = []
    const seenCodes = new Set<string>()

    for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex]
      const rowNumber = rowIndex + 1

      const nome_bem = normalizeCellToString(row[headerMap.nome_bem])
      const codigo = normalizeCellToString(row[headerMap.codigo])
      const estado = normalizeEstado(
        headerMap.estado !== undefined ? normalizeCellToString(row[headerMap.estado]) : ''
      )
      const local = normalizeLocal(
        headerMap.local !== undefined ? normalizeCellToString(row[headerMap.local]) : ''
      )
      const rawValor =
        headerMap.valor !== undefined ? normalizeCellToString(row[headerMap.valor]) : ''
      const marca =
        headerMap.marca !== undefined ? normalizeCellToString(row[headerMap.marca]) : ''
      const modelo =
        headerMap.modelo !== undefined ? normalizeCellToString(row[headerMap.modelo]) : ''
      const foto = headerMap.foto !== undefined ? normalizeCellToString(row[headerMap.foto]) : ''

      const isEmptyRow =
        !nome_bem && !codigo && !rawValor && !marca && !modelo && !foto &&
        (headerMap.estado === undefined || !normalizeCellToString(row[headerMap.estado])) &&
        (headerMap.local === undefined || !normalizeCellToString(row[headerMap.local]))

      if (isEmptyRow) continue

      const valor = normalizeValor(rawValor)
      if (Number.isNaN(valor)) {
        errors.push({
          linha: rowNumber,
          campo: 'valor',
          mensagem: 'Valor inválido. Use apenas números (ex: 2500,50).',
        })
        continue
      }

      const rowData: RawRowData = {
        nome_bem,
        codigo,
        estado,
        local,
        valor,
        marca: marca || null,
        modelo: modelo || null,
        foto: foto || null,
      }

      const parsed = bemSchema.safeParse(rowData)
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

      const codeKey = rowData.codigo.toLowerCase()
      if (seenCodes.has(codeKey)) {
        errors.push({
          linha: rowNumber,
          campo: 'codigo',
          mensagem: 'Código duplicado no arquivo',
        })
        continue
      }
      seenCodes.add(codeKey)
      rowsToCreate.push(rowData)
    }

    if (rowsToCreate.length === 0 && errors.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma linha válida encontrada para importação' },
        { status: 400 }
      )
    }

    if (rowsToCreate.length > MAX_IMPORT_ROWS) {
      return NextResponse.json(
        { error: `A planilha excede o limite de ${MAX_IMPORT_ROWS} linhas de bens` },
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

    const existingCodes = await prisma.bem.findMany({
      where: {
        codigo: {
          in: rowsToCreate.map((row) => row.codigo),
        },
      },
      select: {
        codigo: true,
      },
    })

    if (existingCodes.length > 0) {
      return NextResponse.json(
        {
          error: 'Existem códigos já cadastrados no banco',
          codigos: existingCodes.map((item) => item.codigo),
        },
        { status: 400 }
      )
    }

    const result = await prisma.bem.createMany({
      data: rowsToCreate,
    })

    return NextResponse.json({
      message: 'Importação concluída com sucesso',
      totalImportados: result.count,
      totalProcessados: rowsToCreate.length,
    })
  } catch (error) {
    console.error('Erro ao importar bens em massa:', error)
    const detalhes = error instanceof Error ? error.message : 'Erro inesperado'
    return NextResponse.json(
      { error: 'Erro ao importar bens em massa', detalhes },
      { status: 500 }
    )
  }
}

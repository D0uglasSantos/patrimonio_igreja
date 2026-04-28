import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import * as XLSX from 'xlsx'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { usuarioSchema } from '@/lib/validations'

const MAX_IMPORT_ROWS = 3000
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

type RowError = {
  linha: number
  campo: string
  mensagem: string
}

type RawUsuarioRow = {
  nome: string
  email: string
  senha: string
  tipo_user: 'ADM' | 'COMUM'
  pastoral: string
  funcao_pastoral: 'COORDENADOR' | 'VICE_COORDENADOR'
}

type UsuarioToCreate = {
  nome: string
  email: string
  senha: string
  tipo_user: 'ADM' | 'COMUM'
  id_pastoral: number
  funcao_pastoral: 'COORDENADOR' | 'VICE_COORDENADOR'
}

const headerAliases: Record<keyof RawUsuarioRow, string[]> = {
  nome: ['nome'],
  email: ['email'],
  senha: ['senha', 'password'],
  tipo_user: ['tipo_user', 'tipo usuario', 'tipo'],
  pastoral: ['pastoral', 'nome_pastoral'],
  funcao_pastoral: ['funcao_pastoral', 'funcao pastoral', 'funcao'],
}

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

function normalizeTipoUser(value: string): RawUsuarioRow['tipo_user'] {
  const raw = value.trim().toUpperCase()
  return raw === 'ADM' ? 'ADM' : 'COMUM'
}

function normalizeFuncao(value: string): RawUsuarioRow['funcao_pastoral'] {
  const raw = value.trim().toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  if (raw === 'COORDENADOR') return 'COORDENADOR'
  return 'VICE_COORDENADOR'
}

function buildHeaderMap(headerRowValues: unknown[]): Partial<Record<keyof RawUsuarioRow, number>> {
  const normalizedHeaders = headerRowValues.map(normalizeHeader)
  const map: Partial<Record<keyof RawUsuarioRow, number>> = {}

  for (const key of Object.keys(headerAliases) as Array<keyof RawUsuarioRow>) {
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
        { error: 'Acesso negado. Apenas administradores podem importar usuários.' },
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

    const headerMap = buildHeaderMap(rows[0])
    if (
      headerMap.nome === undefined ||
      headerMap.email === undefined ||
      headerMap.senha === undefined ||
      headerMap.pastoral === undefined
    ) {
      return NextResponse.json(
        {
          error:
            'Cabeçalho inválido. Colunas obrigatórias: nome, email, senha, pastoral.',
        },
        { status: 400 }
      )
    }

    const pastorais = await prisma.pastoral.findMany({
      select: {
        id_pastoral: true,
        nome_pastoral: true,
        membros: {
          select: {
            funcao_pastoral: true,
          },
        },
      },
    })

    const pastoralByName = new Map(
      pastorais.map((pastoral) => [pastoral.nome_pastoral.trim().toLowerCase(), pastoral])
    )

    const plannedCounts = new Map<number, { coordenadores: number; vices: number }>()
    for (const pastoral of pastorais) {
      plannedCounts.set(pastoral.id_pastoral, {
        coordenadores: pastoral.membros.filter((m) => m.funcao_pastoral === 'COORDENADOR').length,
        vices: pastoral.membros.filter((m) => m.funcao_pastoral === 'VICE_COORDENADOR').length,
      })
    }

    const errors: RowError[] = []
    const usuariosToCreate: UsuarioToCreate[] = []
    const seenEmails = new Set<string>()

    for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex]
      const rowNumber = rowIndex + 1

      const nome = normalizeCell(row[headerMap.nome])
      const email = normalizeCell(row[headerMap.email]).toLowerCase()
      const senha = normalizeCell(row[headerMap.senha])
      const tipo_user = normalizeTipoUser(
        headerMap.tipo_user !== undefined ? normalizeCell(row[headerMap.tipo_user]) : ''
      )
      const pastoralNome = normalizeCell(row[headerMap.pastoral])
      const funcao_pastoral = normalizeFuncao(
        headerMap.funcao_pastoral !== undefined ? normalizeCell(row[headerMap.funcao_pastoral]) : ''
      )

      const isEmptyRow = !nome && !email && !senha && !pastoralNome
      if (isEmptyRow) continue

      const pastoral = pastoralByName.get(pastoralNome.toLowerCase())
      if (!pastoral) {
        errors.push({
          linha: rowNumber,
          campo: 'pastoral',
          mensagem: `Pastoral "${pastoralNome}" não encontrada`,
        })
        continue
      }

      const parsed = usuarioSchema.safeParse({
        nome,
        email,
        senha,
        tipo_user,
        id_pastoral: pastoral.id_pastoral,
        funcao_pastoral,
      })

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

      if (seenEmails.has(email)) {
        errors.push({
          linha: rowNumber,
          campo: 'email',
          mensagem: 'Email duplicado no arquivo',
        })
        continue
      }
      seenEmails.add(email)

      const counts = plannedCounts.get(pastoral.id_pastoral)
      if (!counts) continue

      if (funcao_pastoral === 'COORDENADOR') {
        counts.coordenadores += 1
        if (counts.coordenadores > 4) {
          errors.push({
            linha: rowNumber,
            campo: 'funcao_pastoral',
            mensagem: `Limite de 4 coordenadores excedido para ${pastoral.nome_pastoral}`,
          })
          counts.coordenadores -= 1
          continue
        }
      } else {
        counts.vices += 1
        if (counts.vices > 2) {
          errors.push({
            linha: rowNumber,
            campo: 'funcao_pastoral',
            mensagem: `Limite de 2 vice-coordenadores excedido para ${pastoral.nome_pastoral}`,
          })
          counts.vices -= 1
          continue
        }
      }

      usuariosToCreate.push({
        ...parsed.data,
      })
    }

    if (usuariosToCreate.length === 0 && errors.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma linha válida encontrada para importação' },
        { status: 400 }
      )
    }

    if (usuariosToCreate.length > MAX_IMPORT_ROWS) {
      return NextResponse.json(
        { error: `A planilha excede o limite de ${MAX_IMPORT_ROWS} linhas de usuários` },
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

    const existingUsers = await prisma.usuario.findMany({
      where: {
        email: {
          in: usuariosToCreate.map((user) => user.email),
        },
      },
      select: {
        email: true,
      },
    })

    if (existingUsers.length > 0) {
      return NextResponse.json(
        {
          error: 'Existem emails já cadastrados no sistema',
          emails: existingUsers.map((user) => user.email),
        },
        { status: 400 }
      )
    }

    const usuariosComSenhaHash = await Promise.all(
      usuariosToCreate.map(async (user) => ({
        ...user,
        senha: await hashPassword(user.senha),
      }))
    )

    const result = await prisma.usuario.createMany({
      data: usuariosComSenhaHash,
    })

    return NextResponse.json({
      message: 'Importação de usuários concluída com sucesso',
      totalImportados: result.count,
      totalProcessados: usuariosToCreate.length,
    })
  } catch (error) {
    console.error('Erro ao importar usuários em massa:', error)
    const detalhes = error instanceof Error ? error.message : 'Erro inesperado'
    return NextResponse.json(
      { error: 'Erro ao importar usuários em massa', detalhes },
      { status: 500 }
    )
  }
}

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Church, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { PastoraisImportModal } from '@/components/PastoraisImportModal'
import { PastoraisExportModal } from '@/components/PastoraisExportModal'
import { cn } from '@/lib/utils'

const ITEMS_PER_PAGE = 15

type FiltroOcupacao = 'todos' | 'com' | 'sem' | 'lotado'

interface PastoralMembro {
  funcao_pastoral?: 'COORDENADOR' | 'VICE_COORDENADOR' | null
}

interface PastoralItem {
  id_pastoral: number
  nome_pastoral: string
  membros?: PastoralMembro[]
  coordenadores: number
  vices: number
}

const FILTROS_LIMPOS = {
  searchTerm: '',
  coordenadorFiltro: 'todos' as FiltroOcupacao,
  viceFiltro: 'todos' as FiltroOcupacao,
}

export default function PastoraisPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [pastorais, setPastorais] = useState<PastoralItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState(FILTROS_LIMPOS.searchTerm)
  const [coordenadorFiltro, setCoordenadorFiltro] = useState<FiltroOcupacao>(FILTROS_LIMPOS.coordenadorFiltro)
  const [viceFiltro, setViceFiltro] = useState<FiltroOcupacao>(FILTROS_LIMPOS.viceFiltro)
  const [formData, setFormData] = useState({ nome_pastoral: '' })

  const isAdmin = session?.user?.tipo_user === 'ADM'

  const hasFiltroAtivo =
    searchTerm !== FILTROS_LIMPOS.searchTerm ||
    coordenadorFiltro !== FILTROS_LIMPOS.coordenadorFiltro ||
    viceFiltro !== FILTROS_LIMPOS.viceFiltro

  const limparFiltros = () => {
    setSearchTerm(FILTROS_LIMPOS.searchTerm)
    setCoordenadorFiltro(FILTROS_LIMPOS.coordenadorFiltro)
    setViceFiltro(FILTROS_LIMPOS.viceFiltro)
    setPage(1)
  }

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [session, status, router])

  const fetchPastorais = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/pastorais')
      if (!response.ok) throw new Error('Erro ao carregar pastorais')

      const data = (await response.json()) as Array<{
        id_pastoral: number
        nome_pastoral: string
        membros?: PastoralMembro[]
      }>

      const pastoraisComMembros = data.map((p) => ({
        ...p,
        coordenadores: p.membros?.filter((m) => m.funcao_pastoral === 'COORDENADOR').length || 0,
        vices: p.membros?.filter((m) => m.funcao_pastoral === 'VICE_COORDENADOR').length || 0,
      }))
      setPastorais(pastoraisComMembros)
      setPage(1)
    } catch {
      toast.error('Erro ao carregar pastorais')
    } finally {
      setIsLoading(false)
    }
  }

  const pastoraisFiltradas = pastorais.filter((pastoral) => {
    const termo = searchTerm.trim().toLowerCase()
    const searchMatch = !termo || pastoral.nome_pastoral.toLowerCase().includes(termo)

    const coordMatch =
      coordenadorFiltro === 'todos' ||
      (coordenadorFiltro === 'com' && pastoral.coordenadores > 0) ||
      (coordenadorFiltro === 'sem' && pastoral.coordenadores === 0) ||
      (coordenadorFiltro === 'lotado' && pastoral.coordenadores >= 4)

    const viceMatch =
      viceFiltro === 'todos' ||
      (viceFiltro === 'com' && pastoral.vices > 0) ||
      (viceFiltro === 'sem' && pastoral.vices === 0) ||
      (viceFiltro === 'lotado' && pastoral.vices >= 2)

    return searchMatch && coordMatch && viceMatch
  })

  const totalPages = Math.max(1, Math.ceil(pastoraisFiltradas.length / ITEMS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const startIdx = (safePage - 1) * ITEMS_PER_PAGE
  const paginatedPastorais = pastoraisFiltradas.slice(startIdx, startIdx + ITEMS_PER_PAGE)
  const startItem = pastoraisFiltradas.length === 0 ? 0 : startIdx + 1
  const endItem = Math.min(startIdx + ITEMS_PER_PAGE, pastoraisFiltradas.length)

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (safePage > 3) pages.push('...')
    for (let p = Math.max(2, safePage - 1); p <= Math.min(totalPages - 1, safePage + 1); p++) {
      pages.push(p)
    }
    if (safePage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  useEffect(() => {
    fetchPastorais()
  }, [])

  const labelCoordenadorFiltro: Record<FiltroOcupacao, string> = {
    todos: '',
    com: 'Com coordenador',
    sem: 'Sem coordenador',
    lotado: 'Coordenadores lotados',
  }

  const labelViceFiltro: Record<FiltroOcupacao, string> = {
    todos: '',
    com: 'Com vice-coordenador',
    sem: 'Sem vice-coordenador',
    lotado: 'Vices lotados',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch('/api/pastorais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao cadastrar pastoral')
      }

      toast.success('Pastoral cadastrada com sucesso!')
      setIsDialogOpen(false)
      setFormData({ nome_pastoral: '' })
      fetchPastorais()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao cadastrar pastoral'
      toast.error('Erro ao cadastrar pastoral', { description: message })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="p-4 md:p-8 max-w-[1280px] mx-auto w-full">
      {/* ── Cabeçalho ── */}
      <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#002045] mb-1">Gerenciar Pastorais</h1>
          <p className="text-sm text-[#74777f]">Cadastre e visualize as pastorais da paróquia</p>
        </div>

        {isAdmin && (
          <div className="flex w-full md:w-auto flex-col sm:flex-row gap-2">
            <PastoraisExportModal />
            <PastoraisImportModal onImportSuccess={fetchPastorais} />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#002045] hover:bg-[#1a365d] text-white shrink-0 w-full sm:w-auto">
                  <Church className="h-4 w-4 mr-2" />
                  Nova Pastoral
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar Nova Pastoral</DialogTitle>
                  <DialogDescription>Preencha o nome da nova pastoral</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_pastoral">Nome da Pastoral *</Label>
                    <Input
                      id="nome_pastoral"
                      placeholder="Ex: Pastoral da Juventude"
                      value={formData.nome_pastoral}
                      onChange={(e) => setFormData({ ...formData, nome_pastoral: e.target.value })}
                      required
                      disabled={isSaving}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'Cadastrando...' : 'Cadastrar'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pastorais Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {/* ── Filtros ── */}
          <div className="bg-[#f8f9fb] rounded-xl border border-[#c4c6cf] p-4 mb-4 space-y-3">
            {/* Pesquisa */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#74777f]" />
              <Input
                placeholder="Buscar por nome da pastoral…"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                className="pl-10 border-[#c4c6cf] focus-visible:ring-[#455f88] bg-white"
              />
            </div>

            {/* Selects + botão limpar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={coordenadorFiltro} onValueChange={(v: FiltroOcupacao) => { setCoordenadorFiltro(v); setPage(1) }}>
                <SelectTrigger className="flex-1 border-[#c4c6cf] bg-white text-sm">
                  <SelectValue placeholder="Coordenadores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos (coordenadores)</SelectItem>
                  <SelectItem value="com">Com coordenador</SelectItem>
                  <SelectItem value="sem">Sem coordenador</SelectItem>
                  <SelectItem value="lotado">Coordenadores lotados (4)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={viceFiltro} onValueChange={(v: FiltroOcupacao) => { setViceFiltro(v); setPage(1) }}>
                <SelectTrigger className="flex-1 border-[#c4c6cf] bg-white text-sm">
                  <SelectValue placeholder="Vice-coordenadores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos (vice-coordenadores)</SelectItem>
                  <SelectItem value="com">Com vice-coordenador</SelectItem>
                  <SelectItem value="sem">Sem vice-coordenador</SelectItem>
                  <SelectItem value="lotado">Vice-coordenadores lotados (2)</SelectItem>
                </SelectContent>
              </Select>

              {hasFiltroAtivo && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={limparFiltros}
                  className="shrink-0 text-[#74777f] hover:text-[#002045] hover:bg-[#d5e0f7]/40 gap-1.5 text-sm"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Limpar filtros</span>
                  <span className="sm:hidden">Limpar</span>
                </Button>
              )}
            </div>

            {/* Indicadores de filtros ativos */}
            {hasFiltroAtivo && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 text-xs bg-[#d5e0f7] text-[#002045] px-2.5 py-1 rounded-full">
                    "{searchTerm}"
                    <button onClick={() => { setSearchTerm(''); setPage(1) }} className="hover:text-[#ba1a1a]">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {coordenadorFiltro !== 'todos' && (
                  <span className="inline-flex items-center gap-1 text-xs bg-[#d5e0f7] text-[#002045] px-2.5 py-1 rounded-full">
                    {labelCoordenadorFiltro[coordenadorFiltro]}
                    <button onClick={() => { setCoordenadorFiltro('todos'); setPage(1) }} className="hover:text-[#ba1a1a]">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {viceFiltro !== 'todos' && (
                  <span className="inline-flex items-center gap-1 text-xs bg-[#d5e0f7] text-[#002045] px-2.5 py-1 rounded-full">
                    {labelViceFiltro[viceFiltro]}
                    <button onClick={() => { setViceFiltro('todos'); setPage(1) }} className="hover:text-[#ba1a1a]">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── Tabela ── */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#002045] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pastoraisFiltradas.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[#74777f] text-sm mb-2">
                {pastorais.length === 0 ? 'Nenhuma pastoral cadastrada' : 'Nenhuma pastoral encontrada com os filtros aplicados'}
              </p>
              {hasFiltroAtivo && (
                <Button variant="ghost" size="sm" onClick={limparFiltros} className="text-[#002045] text-sm">
                  <X className="h-3.5 w-3.5 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Nome</TableHead>
                    <TableHead className="whitespace-nowrap hidden sm:table-cell">Coordenadores</TableHead>
                    <TableHead className="whitespace-nowrap hidden sm:table-cell">Vice-Coordenadores</TableHead>
                    {isAdmin && <TableHead className="text-right whitespace-nowrap">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPastorais.map((pastoral) => (
                    <TableRow key={pastoral.id_pastoral}>
                      <TableCell className="font-medium">{pastoral.nome_pastoral}</TableCell>
                      <TableCell className="hidden sm:table-cell">{pastoral.coordenadores} / 4</TableCell>
                      <TableCell className="hidden sm:table-cell">{pastoral.vices} / 2</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/pastorais/${pastoral.id_pastoral}/editar`)}>
                            Editar
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* ── Paginação ── */}
          {!isLoading && pastoraisFiltradas.length > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-[#74777f]">
                Exibindo{' '}
                <span className="font-semibold text-[#1a1c1e]">{startItem}–{endItem}</span>{' '}
                de <span className="font-semibold text-[#1a1c1e]">{pastoraisFiltradas.length}</span> pastorais
                {hasFiltroAtivo && <span className="text-[#455f88]"> (filtradas de {pastorais.length})</span>}
              </p>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="h-8 px-2.5 border-[#c4c6cf] text-[#002045] disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Anterior</span>
                  </Button>

                  {getPageNumbers().map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-[#74777f] text-sm select-none">…</span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={cn(
                          'h-8 min-w-8 px-2.5 rounded-lg text-sm font-medium transition-colors',
                          safePage === p
                            ? 'bg-[#002045] text-white shadow-sm'
                            : 'border border-[#c4c6cf] text-[#1a1c1e] hover:bg-[#f0f2f5]',
                        )}
                      >
                        {p}
                      </button>
                    ),
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="h-8 px-2.5 border-[#c4c6cf] text-[#002045] disabled:opacity-40"
                  >
                    <span className="hidden sm:inline mr-1">Próximo</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { BemCard } from '@/components/BemCard'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, Plus, Package, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { BensImportModal } from '@/components/BensImportModal'
import { BensExportModal } from '@/components/BensExportModal'

const ITEMS_PER_PAGE = 24

interface Bem {
  id_bem: number
  nome_bem: string
  codigo: string
  estado: 'NOVO' | 'USADO' | 'QUEBRADO' | 'EM_MANUTENCAO'
  valor: number | null
  foto: string | null
  local?: string
  emprestimos: { data_entrega?: string | null; id?: number }[]
}

type ViewMode = 'grid' | 'list'

export default function BensPage() {
  const { data: session } = useSession()
  const [bens, setBens] = useState<Bem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos')
  const [disponivelFiltro, setDisponivelFiltro] = useState<string>('todos')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Mantém o valor atual do search sem causar re-fetch na digitação
  const searchRef = useRef(search)
  searchRef.current = search

  const isAdmin = session?.user?.tipo_user === 'ADM'

  const fetchBens = async (searchTerm?: string) => {
    try {
      setIsLoading(true)
      setPage(1)
      const params = new URLSearchParams()
      if (estadoFiltro !== 'todos') params.append('estado', estadoFiltro)
      if (disponivelFiltro !== 'todos') params.append('disponivel', disponivelFiltro)
      const term = searchTerm !== undefined ? searchTerm : searchRef.current
      if (term) params.append('search', term)

      const response = await fetch(`/api/bens?${params.toString()}`)
      if (!response.ok) throw new Error('Erro ao buscar bens')
      setBens(await response.json())
    } catch {
      toast.error('Erro ao carregar bens')
    } finally {
      setIsLoading(false)
    }
  }

  // Re-fetch somente quando filtros de select mudam
  useEffect(() => {
    fetchBens()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoFiltro, disponivelFiltro])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchBens(search)
  }

  /* ── Estatísticas ── */
  const totalBens = bens.length
  const disponiveis = bens.filter((b) => b.emprestimos.length === 0).length
  const emprestados = bens.filter((b) => b.emprestimos.length > 0).length
  const quebrados = bens.filter((b) => b.estado === 'QUEBRADO').length

  /* ── Paginação ── */
  const totalPages = Math.max(1, Math.ceil(bens.length / ITEMS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const startIdx = (safePage - 1) * ITEMS_PER_PAGE
  const paginatedBens = bens.slice(startIdx, startIdx + ITEMS_PER_PAGE)
  const startItem = bens.length === 0 ? 0 : startIdx + 1
  const endItem = Math.min(startIdx + ITEMS_PER_PAGE, bens.length)

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

  return (
    <main className="p-4 md:p-8 max-w-[1280px] mx-auto w-full">
      {/* ── Cabeçalho ── */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#002045] mb-1">Catálogo de Bens</h1>
          <p className="text-[#74777f] text-sm">
            Gerencie e acompanhe o inventário do patrimônio
          </p>
        </div>
        {isAdmin && (
          <div className="flex w-full md:w-auto flex-col sm:flex-row gap-2">
            <BensExportModal />
            <BensImportModal onImportSuccess={() => fetchBens()} />
            <Link href="/dashboard/bens/novo" className="w-full md:w-auto">
              <Button className="bg-[#002045] hover:bg-[#1a365d] text-white w-full md:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Novo Bem
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* ── Estatísticas rápidas ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {[
          { label: 'Total', value: totalBens, color: 'text-[#002045]' },
          { label: 'Disponíveis', value: disponiveis, color: 'text-emerald-600' },
          { label: 'Emprestados', value: emprestados, color: 'text-amber-600' },
          { label: 'Quebrados', value: quebrados, color: 'text-[#ba1a1a]' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white p-4 md:p-5 rounded-xl border border-[#c4c6cf] shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[#74777f] mb-2">
              {label}
            </p>
            <p className={cn('text-2xl md:text-3xl font-bold', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Filtros + toggle de visualização ── */}
      <div className="bg-white p-4 rounded-xl border border-[#c4c6cf] shadow-[0_4px_12px_rgba(0,0,0,0.03)] mb-4">
        <div className="flex flex-col gap-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#74777f]" />
              <Input
                placeholder="Buscar por nome ou código…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-[#c4c6cf] focus-visible:ring-[#455f88]"
              />
            </div>
            <Button type="submit" className="bg-[#002045] hover:bg-[#1a365d] text-white shrink-0">
              Buscar
            </Button>
          </form>

          <div className="flex gap-2 items-center">
            <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
              <SelectTrigger className="flex-1 min-w-0 border-[#c4c6cf]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Estados</SelectItem>
                <SelectItem value="NOVO">Novo</SelectItem>
                <SelectItem value="USADO">Usado</SelectItem>
                <SelectItem value="QUEBRADO">Quebrado</SelectItem>
                <SelectItem value="EM_MANUTENCAO">Em Manutenção</SelectItem>
              </SelectContent>
            </Select>

            <Select value={disponivelFiltro} onValueChange={setDisponivelFiltro}>
              <SelectTrigger className="flex-1 min-w-0 border-[#c4c6cf]">
                <SelectValue placeholder="Disponibilidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="true">Disponíveis</SelectItem>
                <SelectItem value="false">Emprestados</SelectItem>
              </SelectContent>
            </Select>

            {/* Toggle de visualização */}
            <div className="flex items-center border border-[#c4c6cf] rounded-lg overflow-hidden shrink-0">
              <button
                type="button"
                title="Visualização em grade"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'px-2.5 py-2 transition-colors',
                  viewMode === 'grid'
                    ? 'bg-[#002045] text-white'
                    : 'text-[#74777f] hover:bg-[#f0f2f5]',
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Visualização em lista"
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-2.5 py-2 transition-colors',
                  viewMode === 'list'
                    ? 'bg-[#002045] text-white'
                    : 'text-[#74777f] hover:bg-[#f0f2f5]',
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Barra de contagem ── */}
      {!isLoading && bens.length > 0 && (
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-xs text-[#74777f]">
            Exibindo{' '}
            <span className="font-semibold text-[#1a1c1e]">
              {startItem}–{endItem}
            </span>{' '}
            de{' '}
            <span className="font-semibold text-[#1a1c1e]">{totalBens}</span> bens
          </p>
          {totalPages > 1 && (
            <p className="text-xs text-[#74777f]">
              Página <span className="font-semibold text-[#1a1c1e]">{safePage}</span> de{' '}
              <span className="font-semibold text-[#1a1c1e]">{totalPages}</span>
            </p>
          )}
        </div>
      )}

      {/* ── Lista / Grid de Bens ── */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-[#c4c6cf] py-16 flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#002045] border-t-transparent animate-spin" />
          <p className="text-sm text-[#74777f]">Carregando bens…</p>
        </div>
      ) : bens.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#c4c6cf]">
          <Package className="h-12 w-12 text-[#c4c6cf] mx-auto mb-3" />
          <p className="text-[#74777f] mb-4">Nenhum bem encontrado</p>
          {isAdmin && (
            <Link href="/dashboard/bens/novo">
              <Button variant="outline" className="border-[#c4c6cf] text-[#002045]">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Bem
              </Button>
            </Link>
          )}
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-xl border border-[#c4c6cf] shadow-[0_4px_12px_rgba(0,0,0,0.03)] overflow-hidden divide-y divide-[#f0f1f4]">
          {paginatedBens.map((bem) => (
            <BemCard key={bem.id_bem} bem={bem} isAdmin={isAdmin} viewMode="list" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {paginatedBens.map((bem) => (
            <BemCard key={bem.id_bem} bem={bem} isAdmin={isAdmin} viewMode="grid" />
          ))}
        </div>
      )}

      {/* ── Paginação ── */}
      {!isLoading && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1.5 flex-wrap">
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
              <span key={`ellipsis-${i}`} className="px-1 text-[#74777f] text-sm select-none">
                …
              </span>
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
    </main>
  )
}

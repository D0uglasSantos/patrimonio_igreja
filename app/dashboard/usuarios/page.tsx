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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { UserPlus, Trash2, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { UsuariosImportModal } from '@/components/UsuariosImportModal'
import { UsuariosExportModal } from '@/components/UsuariosExportModal'
import { cn } from '@/lib/utils'

const ITEMS_PER_PAGE = 15

type FuncaoPastoral = 'COORDENADOR' | 'VICE_COORDENADOR'
type TipoUser = 'ADM' | 'COMUM'

interface PastoralOption {
  id_pastoral: number
  nome_pastoral: string
}

interface UsuarioItem {
  id_user: number
  nome: string
  email: string
  tipo_user: TipoUser
  funcao_pastoral?: FuncaoPastoral | null
  pastoral?: PastoralOption | null
}

const FILTROS_LIMPOS = {
  searchTerm: '',
  tipoFiltro: 'todos' as 'todos' | TipoUser,
  pastoralFiltro: 'todos',
  funcaoFiltro: 'todos' as 'todos' | FuncaoPastoral,
}

export default function UsuariosPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([])
  const [pastorais, setPastorais] = useState<PastoralOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [usuarioToDelete, setUsuarioToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState(FILTROS_LIMPOS.searchTerm)
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | TipoUser>(FILTROS_LIMPOS.tipoFiltro)
  const [pastoralFiltro, setPastoralFiltro] = useState<string>(FILTROS_LIMPOS.pastoralFiltro)
  const [funcaoFiltro, setFuncaoFiltro] = useState<'todos' | FuncaoPastoral>(FILTROS_LIMPOS.funcaoFiltro)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    tipo_user: 'COMUM' as 'ADM' | 'COMUM',
    id_pastoral: '',
    funcao_pastoral: 'VICE_COORDENADOR' as FuncaoPastoral,
  })

  const isAdmin = session?.user?.tipo_user === 'ADM'

  const hasFiltroAtivo =
    searchTerm !== FILTROS_LIMPOS.searchTerm ||
    tipoFiltro !== FILTROS_LIMPOS.tipoFiltro ||
    pastoralFiltro !== FILTROS_LIMPOS.pastoralFiltro ||
    funcaoFiltro !== FILTROS_LIMPOS.funcaoFiltro

  const limparFiltros = () => {
    setSearchTerm(FILTROS_LIMPOS.searchTerm)
    setTipoFiltro(FILTROS_LIMPOS.tipoFiltro)
    setPastoralFiltro(FILTROS_LIMPOS.pastoralFiltro)
    setFuncaoFiltro(FILTROS_LIMPOS.funcaoFiltro)
    setPage(1)
  }

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.replace('/login')
    } else if (!isAdmin) {
      toast.error('Acesso negado', { description: 'Você não tem permissão para acessar esta página.' })
      router.replace('/dashboard')
    }
  }, [session, status, router, isAdmin])

  const fetchInitialData = async () => {
    try {
      setIsLoading(true)
      const [usersResponse, pastoraisResponse] = await Promise.all([
        fetch('/api/usuarios'),
        fetch('/api/pastorais'),
      ])

      if (!usersResponse.ok) throw new Error('Erro ao carregar usuários')
      if (!pastoraisResponse.ok) throw new Error('Erro ao carregar pastorais')

      const usersData = await usersResponse.json()
      const pastoraisData = await pastoraisResponse.json()

      setUsuarios(usersData)
      setPastorais(pastoraisData)
      setPage(1)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar dados'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const termo = searchTerm.trim().toLowerCase()
    const nomePastoral = usuario.pastoral?.nome_pastoral?.toLowerCase() || ''
    const searchMatch =
      !termo ||
      usuario.nome.toLowerCase().includes(termo) ||
      usuario.email.toLowerCase().includes(termo) ||
      nomePastoral.includes(termo)

    const tipoMatch = tipoFiltro === 'todos' || usuario.tipo_user === tipoFiltro
    const pastoralMatch =
      pastoralFiltro === 'todos' ||
      (usuario.pastoral?.id_pastoral?.toString() || 'sem-pastoral') === pastoralFiltro
    const funcaoMatch =
      funcaoFiltro === 'todos' || (usuario.funcao_pastoral || 'SEM_FUNCAO') === funcaoFiltro

    return searchMatch && tipoMatch && pastoralMatch && funcaoMatch
  })

  const totalPages = Math.max(1, Math.ceil(usuariosFiltrados.length / ITEMS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const startIdx = (safePage - 1) * ITEMS_PER_PAGE
  const paginatedUsuarios = usuariosFiltrados.slice(startIdx, startIdx + ITEMS_PER_PAGE)
  const startItem = usuariosFiltrados.length === 0 ? 0 : startIdx + 1
  const endItem = Math.min(startIdx + ITEMS_PER_PAGE, usuariosFiltrados.length)

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
    if (isAdmin) {
      fetchInitialData()
    }
  }, [isAdmin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const payload = {
        ...formData,
        id_pastoral: parseInt(formData.id_pastoral),
      }
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao cadastrar usuário')
      }

      toast.success('Usuário cadastrado com sucesso!')
      setIsDialogOpen(false)
      setFormData({ nome: '', email: '', senha: '', tipo_user: 'COMUM', id_pastoral: '', funcao_pastoral: 'VICE_COORDENADOR' })
      fetchInitialData()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao cadastrar usuário'
      toast.error('Erro ao cadastrar usuário', { description: message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = (usuarioId: number) => {
    setUsuarioToDelete(usuarioId)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!usuarioToDelete) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/usuarios/${usuarioToDelete}`, { method: 'DELETE' })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao deletar usuário')
      }
      toast.success('Usuário deletado com sucesso!')
      setIsDeleteDialogOpen(false)
      setUsuarioToDelete(null)
      fetchInitialData()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar usuário'
      toast.error('Erro ao deletar usuário', { description: message })
    } finally {
      setIsDeleting(false)
    }
  }

  if (status === 'loading' || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#002045] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#74777f]">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <main className="p-4 md:p-8 max-w-[1280px] mx-auto w-full">
        {/* ── Cabeçalho ── */}
        <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#002045] mb-1">Gerenciar Usuários</h1>
            <p className="text-sm text-[#74777f]">Cadastre e visualize usuários do sistema</p>
          </div>

          {isAdmin && (
            <div className="flex w-full md:w-auto flex-col sm:flex-row gap-2">
              <UsuariosExportModal />
              <UsuariosImportModal onImportSuccess={fetchInitialData} />
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#002045] hover:bg-[#1a365d] text-white shrink-0 w-full sm:w-auto">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
                    <DialogDescription>Preencha os dados do novo usuário</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome *</Label>
                      <Input id="nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required disabled={isSaving} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={isSaving} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="senha">Senha *</Label>
                      <Input id="senha" type="password" value={formData.senha} onChange={(e) => setFormData({ ...formData, senha: e.target.value })} required disabled={isSaving} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="id_pastoral">Pastoral *</Label>
                        <Select value={formData.id_pastoral} onValueChange={(value) => setFormData({ ...formData, id_pastoral: value })} required disabled={isSaving}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {pastorais.map(p => <SelectItem key={p.id_pastoral} value={p.id_pastoral.toString()}>{p.nome_pastoral}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="funcao_pastoral">Função *</Label>
                        <Select value={formData.funcao_pastoral} onValueChange={(value: FuncaoPastoral) => setFormData({ ...formData, funcao_pastoral: value })} required disabled={isSaving}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COORDENADOR">Coordenador</SelectItem>
                            <SelectItem value="VICE_COORDENADOR">Vice-Coordenador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tipo_user">Tipo de Usuário *</Label>
                      <Select value={formData.tipo_user} onValueChange={(value: 'ADM' | 'COMUM') => setFormData({ ...formData, tipo_user: value })} disabled={isSaving}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COMUM">Comum</SelectItem>
                          <SelectItem value="ADM">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
                      <Button type="submit" disabled={isSaving}>{isSaving ? 'Cadastrando...' : 'Cadastrar'}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuários Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {/* ── Filtros ── */}
            <div className="bg-[#f8f9fb] rounded-xl border border-[#c4c6cf] p-4 mb-4 space-y-3">
              {/* Pesquisa */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#74777f]" />
                <Input
                  placeholder="Buscar por nome, email ou pastoral…"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                  className="pl-10 border-[#c4c6cf] focus-visible:ring-[#455f88] bg-white"
                />
              </div>

              {/* Selects + botão limpar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={tipoFiltro} onValueChange={(v: 'todos' | TipoUser) => { setTipoFiltro(v); setPage(1) }}>
                  <SelectTrigger className="flex-1 border-[#c4c6cf] bg-white text-sm">
                    <SelectValue placeholder="Tipo de usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    <SelectItem value="ADM">Administradores</SelectItem>
                    <SelectItem value="COMUM">Comuns</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={pastoralFiltro} onValueChange={(v) => { setPastoralFiltro(v); setPage(1) }}>
                  <SelectTrigger className="flex-1 border-[#c4c6cf] bg-white text-sm">
                    <SelectValue placeholder="Pastoral" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as pastorais</SelectItem>
                    <SelectItem value="sem-pastoral">Sem pastoral</SelectItem>
                    {pastorais.map((p) => (
                      <SelectItem key={p.id_pastoral} value={p.id_pastoral.toString()}>
                        {p.nome_pastoral}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={funcaoFiltro} onValueChange={(v: 'todos' | FuncaoPastoral) => { setFuncaoFiltro(v); setPage(1) }}>
                  <SelectTrigger className="flex-1 border-[#c4c6cf] bg-white text-sm">
                    <SelectValue placeholder="Função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as funções</SelectItem>
                    <SelectItem value="COORDENADOR">Coordenador</SelectItem>
                    <SelectItem value="VICE_COORDENADOR">Vice-Coordenador</SelectItem>
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
                  {tipoFiltro !== 'todos' && (
                    <span className="inline-flex items-center gap-1 text-xs bg-[#d5e0f7] text-[#002045] px-2.5 py-1 rounded-full">
                      {tipoFiltro === 'ADM' ? 'Administradores' : 'Comuns'}
                      <button onClick={() => { setTipoFiltro('todos'); setPage(1) }} className="hover:text-[#ba1a1a]">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {pastoralFiltro !== 'todos' && (
                    <span className="inline-flex items-center gap-1 text-xs bg-[#d5e0f7] text-[#002045] px-2.5 py-1 rounded-full">
                      {pastoralFiltro === 'sem-pastoral' ? 'Sem pastoral' : (pastorais.find(p => p.id_pastoral.toString() === pastoralFiltro)?.nome_pastoral ?? pastoralFiltro)}
                      <button onClick={() => { setPastoralFiltro('todos'); setPage(1) }} className="hover:text-[#ba1a1a]">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {funcaoFiltro !== 'todos' && (
                    <span className="inline-flex items-center gap-1 text-xs bg-[#d5e0f7] text-[#002045] px-2.5 py-1 rounded-full">
                      {funcaoFiltro === 'COORDENADOR' ? 'Coordenador' : 'Vice-Coordenador'}
                      <button onClick={() => { setFuncaoFiltro('todos'); setPage(1) }} className="hover:text-[#ba1a1a]">
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
            ) : usuariosFiltrados.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-[#74777f] text-sm mb-2">
                  {usuarios.length === 0 ? 'Nenhum usuário cadastrado' : 'Nenhum usuário encontrado com os filtros aplicados'}
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
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Email</TableHead>
                      <TableHead className="whitespace-nowrap hidden md:table-cell">Pastoral</TableHead>
                      <TableHead className="whitespace-nowrap hidden lg:table-cell">Função</TableHead>
                      <TableHead className="whitespace-nowrap">Tipo</TableHead>
                      {isAdmin && <TableHead className="text-right whitespace-nowrap">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsuarios.map((usuario) => (
                      <TableRow key={usuario.id_user}>
                        <TableCell className="font-medium max-w-[120px] truncate">{usuario.nome}</TableCell>
                        <TableCell className="hidden sm:table-cell max-w-[160px] truncate">{usuario.email}</TableCell>
                        <TableCell className="hidden md:table-cell">{usuario.pastoral?.nome_pastoral || 'N/A'}</TableCell>
                        <TableCell className="hidden lg:table-cell">{usuario.funcao_pastoral?.replace('_', ' ') || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={usuario.tipo_user === 'ADM' ? 'default' : 'secondary'}>
                            {usuario.tipo_user === 'ADM' ? 'Admin' : 'Comum'}
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/usuarios/${usuario.id_user}/editar`)}>
                                Editar
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(usuario.id_user)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* ── Paginação ── */}
            {!isLoading && usuariosFiltrados.length > 0 && (
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs text-[#74777f]">
                  Exibindo{' '}
                  <span className="font-semibold text-[#1a1c1e]">{startItem}–{endItem}</span>{' '}
                  de <span className="font-semibold text-[#1a1c1e]">{usuariosFiltrados.length}</span> usuários
                  {hasFiltroAtivo && <span className="text-[#455f88]"> (filtrados de {usuarios.length})</span>}
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

      {/* ── Dialog exclusão ── */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              {usuarioToDelete && (
                <>
                  Tem certeza que deseja excluir o usuário{' '}
                  <strong>{usuarios.find(u => u.id_user === usuarioToDelete)?.nome}</strong>?
                  <br /><br />
                  Esta ação não pode ser desfeita. O usuário só poderá ser excluído se não houver empréstimos (ativos ou históricos como retirante).
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setUsuarioToDelete(null) }} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

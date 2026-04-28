'use client'

import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { FileDown, FileSpreadsheet, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ListFilter } from 'lucide-react'

const ITENS_POR_PAGINA_OPCOES = [10, 25, 50, 100]

export default function RelatoriosPage() {
  const [tipo, setTipo] = useState<string>('bens')
  const [estado, setEstado] = useState<string>('todos')
  const [disponivel, setDisponivel] = useState<string>('todos')
  const [idPastoral, setIdPastoral] = useState<string>('')
  const [dataInicio, setDataInicio] = useState<string>('')
  const [dataFim, setDataFim] = useState<string>('')
  const [pastorais, setPastorais] = useState<any[]>([])
  const [dados, setDados] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [itensPorPagina, setItensPorPagina] = useState(25)

  useEffect(() => {
    const fetchPastorais = async () => {
      try {
        const response = await fetch('/api/pastorais')
        if (response.ok) {
          const data = await response.json()
          setPastorais(data)
        }
      } catch (error) {
        console.error('Erro ao carregar pastorais')
      }
    }

    fetchPastorais()
  }, [])

  const dadosPaginados = useMemo(() => {
    if (!dados?.dados) return []
    const inicio = (paginaAtual - 1) * itensPorPagina
    return dados.dados.slice(inicio, inicio + itensPorPagina)
  }, [dados, paginaAtual, itensPorPagina])

  const totalPaginas = useMemo(() => {
    if (!dados?.dados) return 0
    return Math.ceil(dados.dados.length / itensPorPagina)
  }, [dados, itensPorPagina])

  const colunas = useMemo(() => {
    if (!dados?.dados?.length) return []
    return Object.keys(dados.dados[0])
  }, [dados])

  const handleGerarRelatorio = async () => {
    setIsLoading(true)
    setPaginaAtual(1)
    try {
      const params = new URLSearchParams({ tipo, formato: 'json' })
      
      if (tipo === 'bens') {
        if (estado !== 'todos') params.append('estado', estado)
        if (disponivel !== 'todos') params.append('disponivel', disponivel)
      } else if (tipo === 'emprestimos') {
        if (idPastoral) params.append('id_pastoral', idPastoral)
        if (dataInicio) params.append('data_inicio', dataInicio)
        if (dataFim) params.append('data_fim', dataFim)
      }

      const response = await fetch(`/api/relatorios?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Erro ao gerar relatório')
      }

      const data = await response.json()
      setDados(data)
      toast.success('Relatório gerado com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao gerar relatório', {
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportarExcel = async () => {
    try {
      const params = new URLSearchParams({ tipo, formato: 'excel' })
      
      if (tipo === 'bens') {
        if (estado !== 'todos') params.append('estado', estado)
        if (disponivel !== 'todos') params.append('disponivel', disponivel)
      } else if (tipo === 'emprestimos') {
        if (idPastoral) params.append('id_pastoral', idPastoral)
        if (dataInicio) params.append('data_inicio', dataInicio)
        if (dataFim) params.append('data_fim', dataFim)
      }

      const response = await fetch(`/api/relatorios?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Erro ao exportar relatório')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio_${tipo}_${new Date().getTime()}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Relatório exportado com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao exportar relatório', {
        description: error.message,
      })
    }
  }

  return (
    <main className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Relatórios</h1>
        <p className="text-gray-500 text-sm">Gere relatórios personalizados e exporte para Excel</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Painel de Filtros — fixo lateralmente em telas grandes */}
        <div className="w-full lg:w-72 shrink-0">
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListFilter className="h-4 w-4 text-gray-500" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Tipo de Relatório</Label>
                <Select value={tipo} onValueChange={(v) => { setTipo(v); setDados(null) }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bens">Bens</SelectItem>
                    <SelectItem value="emprestimos">Empréstimos</SelectItem>
                    <SelectItem value="pastorais">Pastorais</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {tipo === 'bens' && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Estado</Label>
                    <Select value={estado} onValueChange={setEstado}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="NOVO">Novo</SelectItem>
                        <SelectItem value="USADO">Usado</SelectItem>
                        <SelectItem value="QUEBRADO">Quebrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Disponibilidade</Label>
                    <Select value={disponivel} onValueChange={setDisponivel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="true">Disponíveis</SelectItem>
                        <SelectItem value="false">Emprestados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {tipo === 'emprestimos' && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Pastoral</Label>
                    <Select
                      value={idPastoral || 'todas'}
                      onValueChange={(v) => setIdPastoral(v === 'todas' ? '' : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        {pastorais.map((p) => (
                          <SelectItem key={p.id_pastoral} value={p.id_pastoral.toString()}>
                            {p.nome_pastoral}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Data Início</Label>
                    <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Data Fim</Label>
                    <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
                  </div>
                </>
              )}

              <div className="space-y-2 pt-2 border-t">
                <Button onClick={handleGerarRelatorio} disabled={isLoading} className="w-full">
                  {isLoading ? 'Gerando...' : 'Gerar Relatório'}
                </Button>
                {dados && (
                  <Button onClick={handleExportarExcel} variant="outline" className="w-full">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar Excel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Área de Resultados */}
        <div className="flex-1 min-w-0">
          <Card className="h-full">
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-base">Resultados</CardTitle>
                {dados && (
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <Badge variant="secondary" className="font-normal">
                      {dados.total_registros} registro{dados.total_registros !== 1 ? 's' : ''}
                    </Badge>
                    <span className="text-xs">
                      Gerado em {new Date(dados.data_geracao).toLocaleString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {!dados ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <FileDown className="h-14 w-14 mb-4 text-gray-200" />
                  <p className="text-sm font-medium">Nenhum relatório gerado</p>
                  <p className="text-xs mt-1">Selecione os filtros e clique em "Gerar Relatório"</p>
                </div>
              ) : dados.dados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <p className="text-sm font-medium">Nenhum registro encontrado</p>
                  <p className="text-xs mt-1">Tente ajustar os filtros selecionados</p>
                </div>
              ) : (
                <>
                  {/* Tabela com scroll interno */}
                  <div className="overflow-auto max-h-[520px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                          {colunas.map((key) => (
                            <TableHead
                              key={key}
                              className="sticky top-0 bg-gray-50/95 backdrop-blur-sm text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap border-b z-10"
                            >
                              {key.replace(/_/g, ' ')}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dadosPaginados.map((item: any, index: number) => (
                          <TableRow key={index} className="hover:bg-blue-50/40 transition-colors">
                            {Object.values(item).map((value: any, i: number) => (
                              <TableCell key={i} className="text-sm whitespace-nowrap py-2.5">
                                {value?.toString() || <span className="text-gray-300">—</span>}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Barra de paginação */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-gray-50/50">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Exibindo</span>
                      <Select
                        value={itensPorPagina.toString()}
                        onValueChange={(v) => { setItensPorPagina(Number(v)); setPaginaAtual(1) }}
                      >
                        <SelectTrigger className="h-7 w-16 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ITENS_POR_PAGINA_OPCOES.map((n) => (
                            <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span>por página</span>
                      <span className="text-gray-400">·</span>
                      <span>
                        {(paginaAtual - 1) * itensPorPagina + 1}–{Math.min(paginaAtual * itensPorPagina, dados.dados.length)} de {dados.dados.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setPaginaAtual(1)}
                        disabled={paginaAtual === 1}
                        title="Primeira página"
                      >
                        <ChevronsLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                        disabled={paginaAtual === 1}
                        title="Página anterior"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>

                      <span className="px-3 text-sm text-gray-600 font-medium min-w-[80px] text-center">
                        {paginaAtual} / {totalPaginas}
                      </span>

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                        disabled={paginaAtual === totalPaginas}
                        title="Próxima página"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setPaginaAtual(totalPaginas)}
                        disabled={paginaAtual === totalPaginas}
                        title="Última página"
                      >
                        <ChevronsRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}


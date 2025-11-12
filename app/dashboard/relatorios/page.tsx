'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { FileDown, FileSpreadsheet } from 'lucide-react'

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

  const handleGerarRelatorio = async () => {
    setIsLoading(true)
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Relatórios</h1>
          <p className="text-gray-600">
            Gere relatórios personalizados e exporte para Excel
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Filtros */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Relatório</Label>
                <Select value={tipo} onValueChange={setTipo}>
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
                  <div className="space-y-2">
                    <Label>Estado</Label>
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

                  <div className="space-y-2">
                    <Label>Disponibilidade</Label>
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
                  <div className="space-y-2">
                    <Label>Pastoral</Label>
                    <Select value={idPastoral} onValueChange={setIdPastoral}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas</SelectItem>
                        {pastorais.map((p) => (
                          <SelectItem key={p.id_pastoral} value={p.id_pastoral.toString()}>
                            {p.nome_pastoral}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Data Início</Label>
                    <Input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data Fim</Label>
                    <Input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2 pt-4">
                <Button onClick={handleGerarRelatorio} disabled={isLoading} className="w-full">
                  {isLoading ? 'Gerando...' : 'Gerar Relatório'}
                </Button>
                {dados && (
                  <Button
                    onClick={handleExportarExcel}
                    variant="outline"
                    className="w-full"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar Excel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Resultados</CardTitle>
            </CardHeader>
            <CardContent>
              {!dados ? (
                <div className="text-center py-12 text-gray-500">
                  <FileDown className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Selecione os filtros e clique em "Gerar Relatório"</p>
                </div>
              ) : (
                <div>
                  <div className="mb-4 text-sm text-gray-600">
                    <p>Total de registros: <strong>{dados.total_registros}</strong></p>
                    <p>Gerado em: {new Date(dados.data_geracao).toLocaleString('pt-BR')}</p>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {dados.dados.length > 0 && Object.keys(dados.dados[0]).map((key) => (
                            <TableHead key={key}>{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dados.dados.map((item: any, index: number) => (
                          <TableRow key={index}>
                            {Object.values(item).map((value: any, i: number) => (
                              <TableCell key={i}>{value?.toString() || '-'}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}


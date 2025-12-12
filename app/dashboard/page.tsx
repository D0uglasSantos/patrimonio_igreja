'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, TrendingUp, Users, Church, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface DashboardStats {
  bens: {
    total: number
    porEstado: Record<string, number>
    disponiveis: number
    emprestados: number
  }
  emprestimos: {
    total: number
    ativos: number
    ultimos30Dias: number
    porMes: Record<string, number>
  }
  pastorais: {
    total: number
    topPastorais: Array<{
      id: number
      nome: string
      emprestimosAtivos: number
    }>
  }
  usuarios: {
    total: number
  }
  patrimonio: {
    valorTotal: number
  }
}

// Cores de fallback caso algum estado não tenha cor definida
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAdmin = session?.user?.tipo_user === 'ADM'

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas')
      }

      const data = await response.json()
      setStats(data)
    } catch (error) {
      toast.error('Erro ao carregar estatísticas')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-500">Carregando dashboard...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-500">Erro ao carregar dados</p>
          </div>
        </main>
      </div>
    )
  }

  // Preparar dados para gráficos
  const estadoLabels: Record<string, string> = {
    NOVO: 'Novo',
    USADO: 'Usado',
    QUEBRADO: 'Quebrado',
    EM_MANUTENCAO: 'Em Manutenção',
  }

  const estadoCores: Record<string, string> = {
    NOVO: '#10b981', // verde
    USADO: '#3b82f6', // azul
    QUEBRADO: '#ef4444', // vermelho
    EM_MANUTENCAO: '#f59e0b', // laranja/amarelo
  }

  const dadosEstadoBens = Object.entries(stats.bens.porEstado)
    .map(([estado, count]) => ({
      estado: estadoLabels[estado] || estado,
      estadoKey: estado,
      quantidade: count as number,
    }))
    .filter(item => item.quantidade > 0) // Filtrar estados sem bens
    .sort((a, b) => b.quantidade - a.quantidade) // Ordenar por quantidade

  const dadosEmprestimosPorMes = Object.entries(stats.emprestimos.porMes).map(([mes, count]) => ({
    mes,
    quantidade: count,
  }))

  const dadosTopPastorais = stats.pastorais.topPastorais.map(p => ({
    nome: p.nome,
    emprestimos: p.emprestimosAtivos,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Visão geral do patrimônio da paróquia
          </p>
        </div>

        {/* Cards de Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Bens</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bens.total}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <span className="text-green-600 mr-1">
                  {stats.bens.disponiveis} disponíveis
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empréstimos Ativos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.emprestimos.ativos}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1 text-orange-600" />
                <span>{stats.emprestimos.ultimos30Dias} nos últimos 30 dias</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pastorais</CardTitle>
              <Church className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pastorais.total}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Link href="/dashboard/pastorais" className="text-blue-600 hover:underline">
                  Ver todas
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor do Patrimônio</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats.patrimonio.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Valor total estimado</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Bens por Estado */}
          <Card>
            <CardHeader>
              <CardTitle>Bens por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              {dadosEstadoBens.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dadosEstadoBens}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={(props: any) => {
                          const { estado, quantidade, percent } = props
                          return `${estado}\n${quantidade} (${(percent * 100).toFixed(1)}%)`
                        }}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="quantidade"
                        nameKey="estado"
                      >
                        {dadosEstadoBens.map((entry) => (
                          <Cell 
                            key={`cell-${entry.estadoKey}`} 
                            fill={estadoCores[entry.estadoKey] || COLORS[0]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          `${value} bens`,
                          props.payload.estado
                        ]}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                        labelStyle={{
                          fontWeight: 'bold',
                          marginBottom: '4px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Legenda detalhada */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {dadosEstadoBens.map((item) => (
                      <div 
                        key={item.estadoKey}
                        className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg"
                      >
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: estadoCores[item.estadoKey] }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.estado}</p>
                          <p className="text-xs text-gray-500">{item.quantidade} bens</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <p>Nenhum bem cadastrado</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Empréstimos por Mês */}
          <Card>
            <CardHeader>
              <CardTitle>Empréstimos nos Últimos 6 Meses</CardTitle>
            </CardHeader>
            <CardContent>
              {dadosEmprestimosPorMes.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosEmprestimosPorMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantidade" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <p>Nenhum empréstimo registrado nos últimos 6 meses</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Pastorais e Ações Rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pastorais com Mais Empréstimos */}
          <Card>
            <CardHeader>
              <CardTitle>Pastorais com Mais Empréstimos Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              {dadosTopPastorais.length > 0 ? (
                <div className="space-y-4">
                  {dadosTopPastorais.map((pastoral, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{pastoral.nome}</p>
                        <p className="text-sm text-gray-500">{pastoral.emprestimos} empréstimo(s) ativo(s)</p>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{pastoral.emprestimos}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Nenhum empréstimo ativo no momento</p>
              )}
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/dashboard/bens" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="h-4 w-4 mr-2" />
                    Administrar Bens
                  </Button>
                </Link>
                {isAdmin && (
                  <Link href="/dashboard/bens/novo" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Package className="h-4 w-4 mr-2" />
                      Cadastrar Novo Bem
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard/relatorios" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Ver Relatórios
                  </Button>
                </Link>
                {isAdmin && (
                  <>
                    <Link href="/dashboard/usuarios" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="h-4 w-4 mr-2" />
                        Gerenciar Usuários
                      </Button>
                    </Link>
                    <Link href="/dashboard/pastorais" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <Church className="h-4 w-4 mr-2" />
                        Gerenciar Pastorais
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

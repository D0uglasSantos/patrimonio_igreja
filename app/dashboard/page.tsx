'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Package, TrendingUp, Church, DollarSign, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'

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

const COLORS = ['#002045', '#455f88', '#ba1a1a', '#f2bc82', '#86a0cd']

const estadoLabels: Record<string, string> = {
  NOVO: 'Novo',
  USADO: 'Usado',
  QUEBRADO: 'Quebrado',
  EM_MANUTENCAO: 'Em Manutenção',
}

const estadoCores: Record<string, string> = {
  NOVO: '#002045',
  USADO: '#455f88',
  QUEBRADO: '#ba1a1a',
  EM_MANUTENCAO: '#f2bc82',
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAdmin = session?.user?.tipo_user === 'ADM'
  const valorPatrimonioFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(stats?.patrimonio.valorTotal ?? 0)

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) throw new Error('Erro ao buscar estatísticas')
      setStats(await response.json())
    } catch {
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#002045] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#74777f]">Carregando dashboard…</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-[#74777f]">Erro ao carregar dados</p>
      </div>
    )
  }

  const dadosEstadoBens = Object.entries(stats.bens.porEstado)
    .map(([estado, count]) => ({
      estado: estadoLabels[estado] || estado,
      estadoKey: estado,
      quantidade: count as number,
    }))
    .filter((item) => item.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade)

  const dadosEmprestimosPorMes = Object.entries(stats.emprestimos.porMes).map(
    ([mes, count]) => ({ mes, quantidade: count })
  )

  const dadosTopPastorais = stats.pastorais.topPastorais.map((p) => ({
    nome: p.nome,
    emprestimos: p.emprestimosAtivos,
  }))

  return (
    <main className="p-4 md:p-8 max-w-[1280px] mx-auto w-full">
      {/* Cabeçalho */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#002045] mb-1">Dashboard</h1>
          <p className="text-[#74777f] text-sm">
            Resumo atualizado do acervo e movimentações
          </p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className={`grid grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3 md:gap-6 mb-8`}>
        {/* Total de Bens */}
        <div className="bg-white p-4 md:p-6 rounded-xl border border-[#c4c6cf] shadow-[0_4px_12px_rgba(0,0,0,0.03)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
            <Package className="h-16 w-16 md:h-20 md:w-20" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-[#74777f] mb-1 md:mb-2">
              Total de Bens
            </p>
            <p className="text-2xl md:text-3xl font-bold text-[#002045] mb-1">{stats.bens.total}</p>
            <p className="text-[10px] md:text-xs text-emerald-600 font-medium">
              {stats.bens.disponiveis} disponíveis
            </p>
          </div>
        </div>

        {/* Empréstimos Ativos */}
        <div className="bg-white p-4 md:p-6 rounded-xl border border-[#c4c6cf] shadow-[0_4px_12px_rgba(0,0,0,0.03)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp className="h-16 w-16 md:h-20 md:w-20" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-[#74777f] mb-1 md:mb-2">
              Empréstimos Ativos
            </p>
            <p className="text-2xl md:text-3xl font-bold text-[#002045] mb-1">{stats.emprestimos.ativos}</p>
            <div className="flex items-center gap-1 text-[10px] md:text-xs text-amber-600 font-medium">
              <ArrowUpRight className="h-3 w-3 shrink-0" />
              <span className="truncate">{stats.emprestimos.ultimos30Dias} nos últ. 30d</span>
            </div>
          </div>
        </div>

        {/* Pastorais */}
        <div className="bg-white p-4 md:p-6 rounded-xl border border-[#c4c6cf] shadow-[0_4px_12px_rgba(0,0,0,0.03)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
            <Church className="h-16 w-16 md:h-20 md:w-20" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-[#74777f] mb-1 md:mb-2">
              Pastorais
            </p>
            <p className="text-2xl md:text-3xl font-bold text-[#002045] mb-1">{stats.pastorais.total}</p>
            <Link href="/dashboard/pastorais" className="text-[10px] md:text-xs text-[#455f88] hover:underline font-medium">
              Ver todas
            </Link>
          </div>
        </div>

        {/* Valor do Patrimônio (ADM apenas) */}
        {isAdmin && (
          <div className="bg-linear-to-br from-[#002045] to-[#1a365d] p-4 md:p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
              <DollarSign className="h-16 w-16 md:h-20 md:w-20 text-white" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-[#adc7f7] mb-1 md:mb-2">
                Valor do Patrimônio
              </p>
              <p className="text-lg md:text-2xl font-bold text-white mb-1 leading-tight">
                {valorPatrimonioFormatado}
              </p>
              <p className="text-[10px] md:text-xs text-[#86a0cd]">Valor total estimado</p>
            </div>
          </div>
        )}
      </div>

      {/* Gráficos */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-2' : ''} gap-6 mb-8`}>
        {/* Bens por Estado */}
        <div className="bg-white rounded-xl border border-[#c4c6cf] shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-6">
          <h2 className="text-base font-semibold text-[#002045] mb-4">Bens por Estado</h2>
          {dadosEstadoBens.length > 0 ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={dadosEstadoBens}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
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
                    formatter={(value: number) => `${value} bens`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #c4c6cf',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      boxShadow: '0 4px_12px_rgba(0,0,0,0.06)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Legenda */}
              <div className="grid grid-cols-2 gap-2">
                {dadosEstadoBens.map((item) => (
                  <div
                    key={item.estadoKey}
                    className="flex items-center gap-2 p-2 bg-[#faf9fd] rounded-lg border border-[#e3e2e6]"
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: estadoCores[item.estadoKey] }}
                    />
                    <div>
                      <p className="text-xs font-semibold text-[#1a1c1e]">{item.estado}</p>
                      <p className="text-[10px] text-[#74777f]">{item.quantidade} bens</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-[#74777f] text-sm">
              Nenhum bem cadastrado
            </div>
          )}
        </div>

        {/* Empréstimos por Mês (ADM apenas) */}
        {isAdmin && (
          <div className="bg-white rounded-xl border border-[#c4c6cf] shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-6">
            <h2 className="text-base font-semibold text-[#002045] mb-4">
              Empréstimos nos Últimos 6 Meses
            </h2>
            {dadosEmprestimosPorMes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosEmprestimosPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e2e6" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#74777f' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#74777f' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #c4c6cf',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="quantidade" fill="#455f88" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-[#74777f] text-sm">
                Nenhum empréstimo nos últimos 6 meses
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top Pastorais + Ações Rápidas */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-2' : ''} gap-6`}>
        {/* Top Pastorais (ADM apenas) */}
        {isAdmin && (
          <div className="bg-white rounded-xl border border-[#c4c6cf] shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-6">
            <h2 className="text-base font-semibold text-[#002045] mb-4">
              Pastorais com Mais Empréstimos
            </h2>
            {dadosTopPastorais.length > 0 ? (
              <div className="space-y-3">
                {dadosTopPastorais.map((pastoral, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-[#faf9fd] rounded-lg border border-[#e3e2e6]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#1a1c1e]">{pastoral.nome}</p>
                      <p className="text-xs text-[#74777f]">
                        {pastoral.emprestimos} empréstimo(s) ativo(s)
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-[#002045]">
                      {pastoral.emprestimos}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#74777f] text-sm text-center py-8">
                Nenhum empréstimo ativo no momento
              </p>
            )}
          </div>
        )}

        {/* Ações Rápidas */}
        <div className="bg-white rounded-xl border border-[#c4c6cf] shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-6">
          <h2 className="text-base font-semibold text-[#002045] mb-4">Ações Rápidas</h2>
          <div className="space-y-2">
            <Link href="/dashboard/bens" className="block">
              <Button
                variant="outline"
                className="w-full justify-start border-[#c4c6cf] text-[#1a1c1e] hover:bg-[#d5e0f7]/30 hover:border-[#002045]"
              >
                <Package className="h-4 w-4 mr-2 text-[#455f88]" />
                Administrar Bens
              </Button>
            </Link>
            {isAdmin && (
              <Link href="/dashboard/bens/novo" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start border-[#c4c6cf] text-[#1a1c1e] hover:bg-[#d5e0f7]/30 hover:border-[#002045]"
                >
                  <Package className="h-4 w-4 mr-2 text-[#455f88]" />
                  Cadastrar Novo Bem
                </Button>
              </Link>
            )}
            <Link href="/dashboard/relatorios" className="block">
              <Button
                variant="outline"
                className="w-full justify-start border-[#c4c6cf] text-[#1a1c1e] hover:bg-[#d5e0f7]/30 hover:border-[#002045]"
              >
                <TrendingUp className="h-4 w-4 mr-2 text-[#455f88]" />
                Ver Relatórios
              </Button>
            </Link>
            {isAdmin && (
              <>
                <Link href="/dashboard/usuarios" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-[#c4c6cf] text-[#1a1c1e] hover:bg-[#d5e0f7]/30 hover:border-[#002045]"
                  >
                    <Users className="h-4 w-4 mr-2 text-[#455f88]" />
                    Gerenciar Usuários
                  </Button>
                </Link>
                <Link href="/dashboard/pastorais" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-[#c4c6cf] text-[#1a1c1e] hover:bg-[#d5e0f7]/30 hover:border-[#002045]"
                  >
                    <Church className="h-4 w-4 mr-2 text-[#455f88]" />
                    Gerenciar Pastorais
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

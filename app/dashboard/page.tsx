'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/Navbar'
import { BemCard } from '@/components/BemCard'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, Filter } from 'lucide-react'
import { toast } from 'sonner'

interface Bem {
  id_bem: number
  nome_bem: string
  codigo: string
  estado: 'NOVO' | 'USADO' | 'QUEBRADO'
  valor: number | null
  foto: string | null
  emprestimos: any[]
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [bens, setBens] = useState<Bem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos')
  const [disponivelFiltro, setDisponivelFiltro] = useState<string>('todos')

  const isAdmin = session?.user?.tipo_user === 'ADM'

  const fetchBens = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      
      if (estadoFiltro !== 'todos') {
        params.append('estado', estadoFiltro)
      }
      
      if (disponivelFiltro !== 'todos') {
        params.append('disponivel', disponivelFiltro)
      }
      
      if (search) {
        params.append('search', search)
      }

      const response = await fetch(`/api/bens?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Erro ao buscar bens')
      }

      const data = await response.json()
      setBens(data)
    } catch (error) {
      toast.error('Erro ao carregar bens')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBens()
  }, [estadoFiltro, disponivelFiltro])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchBens()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard de Bens</h1>
          <p className="text-gray-600">
            Gerencie e acompanhe os bens do patrimônio da paróquia
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Buscar</Button>
            </form>
            
            <div className="flex gap-2">
              <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="NOVO">Novo</SelectItem>
                  <SelectItem value="USADO">Usado</SelectItem>
                  <SelectItem value="QUEBRADO">Quebrado</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={disponivelFiltro} onValueChange={setDisponivelFiltro}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Disponibilidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="true">Disponíveis</SelectItem>
                  <SelectItem value="false">Emprestados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total de Bens</p>
            <p className="text-2xl font-bold">{bens.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Disponíveis</p>
            <p className="text-2xl font-bold text-green-600">
              {bens.filter(b => b.emprestimos.length === 0).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Emprestados</p>
            <p className="text-2xl font-bold text-orange-600">
              {bens.filter(b => b.emprestimos.length > 0).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Quebrados</p>
            <p className="text-2xl font-bold text-red-600">
              {bens.filter(b => b.estado === 'QUEBRADO').length}
            </p>
          </div>
        </div>

        {/* Lista de Bens */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Carregando bens...</p>
          </div>
        ) : bens.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">Nenhum bem encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bens.map((bem) => (
              <BemCard key={bem.id_bem} bem={bem} isAdmin={isAdmin} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}


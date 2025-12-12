'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, DollarSign } from 'lucide-react'
import Link from 'next/link'

interface Bem {
  id_bem: number
  nome_bem: string
  codigo: string
  estado: 'NOVO' | 'USADO' | 'QUEBRADO' | 'EM_MANUTENCAO'
  valor: number | null
  foto: string | null
  emprestimos?: any[]
}

interface BemCardProps {
  bem: Bem
  isAdmin: boolean
}

const estadoCores = {
  NOVO: 'bg-green-100 text-green-800',
  USADO: 'bg-blue-100 text-blue-800',
  QUEBRADO: 'bg-red-100 text-red-800',
  EM_MANUTENCAO: 'bg-yellow-100 text-yellow-800',
}

const estadoLabels = {
  NOVO: 'Novo',
  USADO: 'Usado',
  QUEBRADO: 'Quebrado',
  EM_MANUTENCAO: 'Em Manutenção',
}

export function BemCard({ bem, isAdmin }: BemCardProps) {
  // Um bem está disponível se não tiver empréstimos ativos (sem data_entrega)
  const emprestimosAtivos = bem.emprestimos?.filter((emp: any) => !emp.data_entrega) || []
  const disponivel = emprestimosAtivos.length === 0

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-gray-500" />
            <CardTitle className="text-lg">{bem.nome_bem}</CardTitle>
          </div>
          <Badge className={estadoCores[bem.estado]}>
            {estadoLabels[bem.estado]}
          </Badge>
        </div>
        <p className="text-sm text-gray-500">Código: {bem.codigo}</p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          {bem.valor && (
            <div className="flex items-center space-x-2 text-sm">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span>R$ {parseFloat(bem.valor.toString()).toFixed(2)}</span>
            </div>
          )}
          
          <div>
            <Badge variant={disponivel ? 'default' : 'secondary'}>
              {disponivel ? 'Disponível' : 'Emprestado'}
            </Badge>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        {isAdmin && disponivel && (
          <Link href={`/dashboard/emprestimos/retirada/${bem.id_bem}`} className="flex-1">
            <Button variant="default" size="sm" className="w-full">
              Retirar
            </Button>
          </Link>
        )}
        {isAdmin && !disponivel && emprestimosAtivos.length > 0 && (
          <Link href={`/dashboard/emprestimos/devolucao/${emprestimosAtivos[0]?.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              Devolver
            </Button>
          </Link>
        )}
        <Link href={`/dashboard/bens/${bem.id_bem}`} className="flex-1">
          <Button variant="ghost" size="sm" className="w-full">
            Detalhes
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}


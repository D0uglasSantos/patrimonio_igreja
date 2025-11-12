'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Package, DollarSign, Calendar } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function BemDetalhesPage() {
  const params = useParams()
  const [bem, setBem] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBem = async () => {
      try {
        const response = await fetch(`/api/bens/${params.id}`)
        if (!response.ok) {
          throw new Error('Bem não encontrado')
        }
        const data = await response.json()
        setBem(data)
      } catch (error: any) {
        toast.error('Erro ao carregar bem', {
          description: error.message,
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchBem()
    }
  }, [params.id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <p>Carregando...</p>
        </main>
      </div>
    )
  }

  if (!bem) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <p>Bem não encontrado</p>
        </main>
      </div>
    )
  }

  const estadoCores = {
    NOVO: 'bg-green-100 text-green-800',
    USADO: 'bg-blue-100 text-blue-800',
    QUEBRADO: 'bg-red-100 text-red-800',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{bem.nome_bem}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Código: {bem.codigo}</p>
                </div>
                <Badge className={estadoCores[bem.estado as keyof typeof estadoCores]}>
                  {bem.estado}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações do Bem */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <p className="font-medium">{bem.estado}</p>
                </div>
                {bem.valor && (
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <p className="font-medium">R$ {parseFloat(bem.valor).toFixed(2)}</p>
                  </div>
                )}
              </div>

              {/* Histórico de Empréstimos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Histórico de Empréstimos</h3>
                {bem.emprestimos && bem.emprestimos.length > 0 ? (
                  <div className="space-y-3">
                    {bem.emprestimos.map((emp: any) => (
                      <Card key={emp.id}>
                        <CardContent className="pt-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label>Retirante</Label>
                              <p className="font-medium">{emp.retirante.nome}</p>
                              <p className="text-sm text-gray-500">{emp.email_retirante}</p>
                            </div>
                            <div>
                              <Label>Pastoral</Label>
                              <p className="font-medium">{emp.pastoral.nome_pastoral}</p>
                            </div>
                            <div>
                              <Label>Data Retirada</Label>
                              <p>{new Date(emp.data_retirada).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div>
                              <Label>Data Devolução</Label>
                              <p>
                                {emp.data_entrega 
                                  ? new Date(emp.data_entrega).toLocaleDateString('pt-BR')
                                  : <Badge variant="secondary">Ainda emprestado</Badge>
                                }
                              </p>
                            </div>
                            {emp.descricao_motivo_retirada && (
                              <div className="md:col-span-2">
                                <Label>Motivo</Label>
                                <p>{emp.descricao_motivo_retirada}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhum empréstimo registrado</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-gray-500">{children}</p>
}


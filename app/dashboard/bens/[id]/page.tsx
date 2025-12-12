'use client'

import { useEffect, useState, Fragment } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

export default function BemDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
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
    EM_MANUTENCAO: 'bg-yellow-100 text-yellow-800',
  }

  const localizacaoTexto = {
    MATRIZ: 'Matriz',
    CAPELA: 'Capela',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para a Lista de Bens
            </Button>
          </Link>
          {session?.user.tipo_user === 'ADM' && (
            <Button size="sm" onClick={() => router.push(`/dashboard/bens/${bem.id_bem}/editar`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
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
                  {bem.estado.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações do Bem */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <Label>Localização</Label>
                  <p className="font-medium">{localizacaoTexto[bem.local as keyof typeof localizacaoTexto]}</p>
                </div>
                <div className="space-y-1">
                  <Label>Marca</Label>
                  <p className="font-medium">{bem.marca || 'Não informado'}</p>
                </div>
                <div className="space-y-1">
                  <Label>Modelo</Label>
                  <p className="font-medium">{bem.modelo || 'Não informado'}</p>
                </div>
                {bem.valor && (
                  <div className="space-y-1">
                    <Label>Valor</Label>
                    <p className="font-medium">R$ {parseFloat(bem.valor).toFixed(2)}</p>
                  </div>
                )}
              </div>

              {/* Histórico de Empréstimos */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Histórico de Empréstimos</h3>
                {bem.emprestimos && bem.emprestimos.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Retirante
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pastoral
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data Retirada
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status Retirada
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Entregue por
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data Devolução
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status Devolução
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Recebido por
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bem.emprestimos.map((emp: any) => (
                          <Fragment key={emp.id}>
                            <tr className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{emp.retirante.nome}</p>
                                  <p className="text-xs text-gray-500">{emp.email_retirante}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {emp.pastoral.nome_pastoral}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {new Date(emp.data_retirada).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </td>
                              <td className="px-4 py-3">
                                <Badge 
                                  variant="outline" 
                                  className={
                                    emp.estado_retirada === 'NOVO' ? 'bg-green-50 text-green-700 border-green-200' :
                                    emp.estado_retirada === 'USADO' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    emp.estado_retirada === 'QUEBRADO' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  }
                                >
                                  {emp.estado_retirada}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {emp.nome_responsavel_devolucao ? (
                                  <div>
                                    <p className="font-medium">{emp.nome_responsavel_devolucao}</p>
                                    {emp.email_responsavel_devolucao && (
                                      <p className="text-xs text-gray-500">{emp.email_responsavel_devolucao}</p>
                                    )}
                                  </div>
                                ) : emp.entregador ? (
                                  emp.entregador.nome
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {emp.data_entrega ? (
                                  <span className="text-gray-900">
                                    {new Date(emp.data_entrega).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })}
                                  </span>
                                ) : (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    Em uso
                                  </Badge>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {emp.estado_devolucao ? (
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      emp.estado_devolucao === 'NOVO' ? 'bg-green-50 text-green-700 border-green-200' :
                                      emp.estado_devolucao === 'USADO' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      emp.estado_devolucao === 'QUEBRADO' ? 'bg-red-50 text-red-700 border-red-200' :
                                      'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    }
                                  >
                                    {emp.estado_devolucao}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {emp.recebedor ? emp.recebedor.nome : '-'}
                              </td>
                            </tr>
                            
                            {/* Linha expandida com detalhes adicionais */}
                            {(emp.descricao_motivo_retirada || (emp.estado_devolucao === 'QUEBRADO' && emp.justificativa_avaria)) && (
                              <tr className="bg-gray-50">
                                <td colSpan={8} className="px-4 py-3">
                                  <div className="space-y-2 text-sm">
                                    {emp.descricao_motivo_retirada && (
                                      <div>
                                        <span className="font-medium text-gray-700">Motivo da Retirada:</span>
                                        <span className="ml-2 text-gray-600">{emp.descricao_motivo_retirada}</span>
                                      </div>
                                    )}
                                    {emp.estado_devolucao === 'QUEBRADO' && emp.justificativa_avaria && (
                                      <div className="bg-red-50 border border-red-200 rounded p-2">
                                        <span className="font-medium text-red-700">Justificativa da Avaria:</span>
                                        <p className="ml-2 mt-1 text-red-600">{emp.justificativa_avaria}</p>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Nenhum empréstimo registrado</p>
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


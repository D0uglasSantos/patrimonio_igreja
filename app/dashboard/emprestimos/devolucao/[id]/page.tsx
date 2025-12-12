'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function DevolucaoBemPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [emprestimo, setEmprestimo] = useState<any>(null)
  const [usuarios, setUsuarios] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    estado_devolucao: 'USADO' as 'NOVO' | 'USADO' | 'QUEBRADO' | 'EM_MANUTENCAO',
    justificativa_avaria: '',
    nome_responsavel_devolucao: '',
    email_responsavel_devolucao: '',
    id_recebedor: 0,
  })

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.replace('/login')
    } else if (session?.user?.tipo_user !== 'ADM') {
      toast.error('Acesso negado', { description: 'Você não tem permissão para registrar devoluções.' })
      router.replace('/dashboard')
    }
  }, [session, status, router])

  useEffect(() => {
    const fetchEmprestimo = async () => {
      try {
        // Buscar empréstimos ativos e encontrar o específico
        const response = await fetch(`/api/emprestimos?ativo=true`)
        if (response.ok) {
          const emprestimos = await response.json()
          const emp = emprestimos.find((e: any) => e.id === parseInt(params.id as string))
          
          if (emp) {
            setEmprestimo(emp)
            setFormData(prev => ({ 
              ...prev,
              estado_devolucao: emp.estado_retirada 
            }))
          } else {
            toast.error('Empréstimo não encontrado', {
              description: 'Este empréstimo pode já ter sido devolvido ou não existe.',
            })
            // Redirecionar após um pequeno delay para mostrar a mensagem
            setTimeout(() => {
              router.replace('/dashboard')
            }, 2000)
          }
        } else {
          toast.error('Erro ao buscar empréstimo')
          setTimeout(() => {
            router.replace('/dashboard')
          }, 2000)
        }
      } catch (error) {
        toast.error('Erro ao carregar dados do empréstimo')
        setTimeout(() => {
          router.replace('/dashboard')
        }, 2000)
      }
    }

    if (params.id && status === 'authenticated') {
      fetchEmprestimo()
    }
  }, [params.id, router, status])

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await fetch('/api/usuarios')
        if (response.ok) {
          const data = await response.json()
          // Filtrar apenas usuários ADM
          const admUsers = data.filter((u: any) => u.tipo_user === 'ADM')
          setUsuarios(admUsers)
          
          // Definir o usuário logado como padrão se ele for ADM
          if (session?.user?.id && session?.user?.tipo_user === 'ADM') {
            setFormData(prev => ({ ...prev, id_recebedor: session.user.id as number }))
          } else if (admUsers.length > 0) {
            // Se o usuário logado não for ADM, usar o primeiro ADM da lista
            setFormData(prev => ({ ...prev, id_recebedor: admUsers[0].id_user }))
          }
        }
      } catch (error) {
        toast.error('Erro ao carregar lista de usuários')
      }
    }

    if (status === 'authenticated') {
      fetchUsuarios()
    }
  }, [status, session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar se o recebedor foi selecionado
    if (!formData.id_recebedor) {
      toast.error('Erro ao registrar devolução', {
        description: 'Por favor, selecione o responsável pelo recebimento.',
      })
      return
    }

    // Validar justificativa se o bem estiver quebrado
    if (formData.estado_devolucao === 'QUEBRADO' && !formData.justificativa_avaria.trim()) {
      toast.error('Erro ao registrar devolução', {
        description: 'Justificativa da avaria é obrigatória quando o bem está quebrado.',
      })
      return
    }

    setIsLoading(true)

    try {
      const payload = {
        id_recebedor: formData.id_recebedor,
        estado_devolucao: formData.estado_devolucao,
        justificativa_avaria: formData.estado_devolucao === 'QUEBRADO' ? formData.justificativa_avaria : null,
        nome_responsavel_devolucao: formData.nome_responsavel_devolucao?.trim() || null,
        email_responsavel_devolucao: formData.email_responsavel_devolucao?.trim() || null,
      }

      const response = await fetch(`/api/emprestimos/${params.id}/devolucao`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao registrar devolução')
      }

      toast.success('Devolução registrada com sucesso!')
      // Forçar recarregamento completo da página para atualizar os dados do dashboard
      window.location.href = '/dashboard'
    } catch (error: any) {
      toast.error('Erro ao registrar devolução', {
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!emprestimo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <p>Carregando...</p>
        </main>
      </div>
    )
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

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Registrar Devolução de Bem</CardTitle>
            <CardDescription>
              Bem: <strong>{emprestimo.bem.nome_bem}</strong> - Código: {emprestimo.bem.codigo}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Informações do Empréstimo */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-2">
              <div>
                <Label>Retirante</Label>
                <p className="font-medium">{emprestimo.retirante.nome}</p>
                <p className="text-sm text-gray-500">{emprestimo.email_retirante}</p>
              </div>
              <div>
                <Label>Pastoral</Label>
                <p className="font-medium">{emprestimo.pastoral.nome_pastoral}</p>
              </div>
              <div>
                <Label>Data de Retirada</Label>
                <p className="font-medium">
                  {new Date(emprestimo.data_retirada).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <Label>Estado na Retirada</Label>
                <p className="font-medium">{emprestimo.estado_retirada}</p>
              </div>
              {emprestimo.descricao_motivo_retirada && (
                <div>
                  <Label>Motivo da Retirada</Label>
                  <p className="font-medium">{emprestimo.descricao_motivo_retirada}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="estado_devolucao">Estado do Bem na Devolução *</Label>
                <Select
                  value={formData.estado_devolucao}
                  onValueChange={(value: 'NOVO' | 'USADO' | 'QUEBRADO') => 
                    setFormData({ ...formData, estado_devolucao: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOVO">Novo</SelectItem>
                    <SelectItem value="USADO">Usado</SelectItem>
                    <SelectItem value="QUEBRADO">Quebrado</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Informe o estado atual do bem ao ser devolvido
                </p>
              </div>

              {formData.estado_devolucao === 'QUEBRADO' && (
                <div className="space-y-2">
                  <Label htmlFor="justificativa_avaria">Justificativa da Avaria *</Label>
                  <Textarea
                    id="justificativa_avaria"
                    value={formData.justificativa_avaria}
                    onChange={(e) => setFormData({ ...formData, justificativa_avaria: e.target.value })}
                    placeholder="Descreva o que aconteceu com o bem..."
                    disabled={isLoading}
                    className="min-h-24"
                  />
                  <p className="text-sm text-gray-500">
                    Explique como o bem foi danificado
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="nome_responsavel_devolucao">Nome do Responsável pela Devolução</Label>
                <Input
                  id="nome_responsavel_devolucao"
                  type="text"
                  value={formData.nome_responsavel_devolucao}
                  onChange={(e) => setFormData({ ...formData, nome_responsavel_devolucao: e.target.value })}
                  placeholder="Digite o nome do responsável pela devolução"
                  disabled={isLoading}
                />
                <p className="text-sm text-gray-500">
                  Informe o nome da pessoa responsável por devolver o bem
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_responsavel_devolucao">E-mail do Responsável pela Devolução</Label>
                <Input
                  id="email_responsavel_devolucao"
                  type="email"
                  value={formData.email_responsavel_devolucao}
                  onChange={(e) => setFormData({ ...formData, email_responsavel_devolucao: e.target.value })}
                  placeholder="Digite o e-mail do responsável pela devolução"
                  disabled={isLoading}
                />
                <p className="text-sm text-gray-500">
                  Informe o e-mail da pessoa responsável por devolver o bem
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_recebedor">Responsável pelo Recebimento *</Label>
                <Select
                  value={formData.id_recebedor.toString()}
                  onValueChange={(value) => 
                    setFormData({ ...formData, id_recebedor: parseInt(value) })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios.map((usuario) => (
                      <SelectItem key={usuario.id_user} value={usuario.id_user.toString()}>
                        {usuario.nome} ({usuario.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Selecione quem está recebendo o bem de volta
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Registrando...' : 'Confirmar Devolução'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


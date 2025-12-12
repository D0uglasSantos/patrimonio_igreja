'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'

type EstadoBem = 'NOVO' | 'USADO' | 'QUEBRADO' | 'EM_MANUTENCAO'
type FinalidadeUso = 'MATRIZ' | 'CAPELA' | 'PESSOAL'

export default function RetiradaBemPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [bem, setBem] = useState<any>(null)
  const [pastorais, setPastorais] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    id_pastoral: '',
    id_entregador: 0,
    estado_retirada: 'USADO' as EstadoBem,
    descricao_motivo_retirada: '',
    nome_retirante: '',
    email_retirante: '',
    finalidade_uso: 'MATRIZ' as FinalidadeUso,
    data_estimada_devolucao: '',
  })

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.replace('/login')
    } else if (session?.user?.tipo_user !== 'ADM') {
      toast.error('Acesso negado', { description: 'Você não tem permissão para registrar retiradas.' })
      router.replace('/dashboard')
    }
  }, [session, status, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar bem
        const bemResponse = await fetch(`/api/bens/${params.id}`)
        if (bemResponse.ok) {
          const bemData = await bemResponse.json()
          setBem(bemData)
          setFormData(prev => ({ ...prev, estado_retirada: bemData.estado }))
        }

        // Buscar pastorais
        const pastoraisResponse = await fetch('/api/pastorais')
        if (pastoraisResponse.ok) {
          const pastoraisData = await pastoraisResponse.json()
          setPastorais(pastoraisData)
        }

        // Buscar usuários ADM
        const usuariosResponse = await fetch('/api/usuarios')
        if (usuariosResponse.ok) {
          const usuariosData = await usuariosResponse.json()
          // Filtrar apenas usuários ADM
          const admUsers = usuariosData.filter((u: any) => u.tipo_user === 'ADM')
          setUsuarios(admUsers)
          
          // Definir o usuário logado como padrão se ele for ADM
          if (session?.user?.id && session?.user?.tipo_user === 'ADM') {
            setFormData(prev => ({ ...prev, id_entregador: session.user.id as number }))
          } else if (admUsers.length > 0) {
            // Se não for ADM, usar o primeiro da lista
            setFormData(prev => ({ ...prev, id_entregador: admUsers[0].id_user }))
          }
        }
      } catch (error) {
        toast.error('Erro ao carregar dados')
      }
    }

    if (params.id && session) {
      fetchData()
    }
  }, [params.id, session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload = {
        id_bem: parseInt(params.id as string),
        id_retirante: session?.user?.id,
        id_entregador: formData.id_entregador,
        id_pastoral: parseInt(formData.id_pastoral),
        estado_retirada: formData.estado_retirada,
        descricao_motivo_retirada: formData.descricao_motivo_retirada || null,
        nome_retirante: formData.nome_retirante?.trim() || null,
        email_retirante: formData.email_retirante,
        finalidade_uso: formData.finalidade_uso,
        data_estimada_devolucao: formData.data_estimada_devolucao 
          ? new Date(formData.data_estimada_devolucao) 
          : null,
      }

      const response = await fetch('/api/emprestimos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao registrar retirada')
      }

      toast.success('Retirada registrada com sucesso!')
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      toast.error('Erro ao registrar retirada', {
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!bem) {
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
            <CardTitle>Registrar Retirada de Bem</CardTitle>
            <CardDescription>
              Bem: <strong>{bem.nome_bem}</strong> - Código: {bem.codigo}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="id_pastoral">Pastoral *</Label>
                  <Select
                    value={formData.id_pastoral}
                    onValueChange={(value) => setFormData({ ...formData, id_pastoral: value })}
                    disabled={isLoading}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a pastoral" />
                    </SelectTrigger>
                    <SelectContent>
                      {pastorais.map((pastoral) => (
                        <SelectItem key={pastoral.id_pastoral} value={pastoral.id_pastoral.toString()}>
                          {pastoral.nome_pastoral}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="finalidade_uso">Finalidade do Uso *</Label>
                  <Select
                    value={formData.finalidade_uso}
                    onValueChange={(value: FinalidadeUso) => 
                      setFormData({ ...formData, finalidade_uso: value })
                    }
                    disabled={isLoading}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MATRIZ">Uso na Matriz</SelectItem>
                      <SelectItem value="CAPELA">Uso na Capela</SelectItem>
                      <SelectItem value="PESSOAL">Uso Pessoal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="estado_retirada">Estado do Bem na Retirada *</Label>
                  <Select
                    value={formData.estado_retirada}
                    onValueChange={(value: EstadoBem) => 
                      setFormData({ ...formData, estado_retirada: value })
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
                      <SelectItem value="EM_MANUTENCAO">Em Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_estimada_devolucao">Data Estimada de Devolução</Label>
                  <Input
                    id="data_estimada_devolucao"
                    type="date"
                    value={formData.data_estimada_devolucao}
                    onChange={(e) => setFormData({ ...formData, data_estimada_devolucao: e.target.value })}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nome_retirante">Nome do Retirante</Label>
                  <Input
                    id="nome_retirante"
                    type="text"
                    value={formData.nome_retirante}
                    onChange={(e) => setFormData({ ...formData, nome_retirante: e.target.value })}
                    placeholder="Digite o nome do retirante"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_retirante">Email do Retirante *</Label>
                  <Input
                    id="email_retirante"
                    type="email"
                    value={formData.email_retirante}
                    onChange={(e) => setFormData({ ...formData, email_retirante: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_entregador">Responsável pela Entrega *</Label>
                <Select
                  value={formData.id_entregador.toString()}
                  onValueChange={(value) => 
                    setFormData({ ...formData, id_entregador: parseInt(value) })
                  }
                  disabled={isLoading}
                  required
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
                  Administrador responsável por liberar/entregar o bem
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao_motivo_retirada">Motivo da Retirada</Label>
                <Textarea
                  id="descricao_motivo_retirada"
                  placeholder="Descreva o motivo ou evento para o qual o bem será utilizado"
                  value={formData.descricao_motivo_retirada}
                  onChange={(e) => setFormData({ ...formData, descricao_motivo_retirada: e.target.value })}
                  disabled={isLoading}
                  rows={3}
                />
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
                  {isLoading ? 'Registrando...' : 'Confirmar Retirada'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


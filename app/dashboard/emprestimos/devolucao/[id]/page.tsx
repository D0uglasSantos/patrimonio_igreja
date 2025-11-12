'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function DevolucaoBemPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [emprestimo, setEmprestimo] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    estado_devolucao: 'USADO' as 'NOVO' | 'USADO' | 'QUEBRADO',
  })

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
            setFormData({ estado_devolucao: emp.estado_retirada })
          } else {
            toast.error('Empréstimo não encontrado')
            router.push('/dashboard')
          }
        }
      } catch (error) {
        toast.error('Erro ao carregar dados do empréstimo')
      }
    }

    if (params.id) {
      fetchEmprestimo()
    }
  }, [params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload = {
        id_recebedor: session?.user?.id,
        estado_devolucao: formData.estado_devolucao,
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
      router.push('/dashboard')
      router.refresh()
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

              <div className="space-y-2">
                <Label>Recebido por</Label>
                <p className="font-medium">{session?.user?.nome}</p>
                <p className="text-sm text-gray-500">{session?.user?.email}</p>
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


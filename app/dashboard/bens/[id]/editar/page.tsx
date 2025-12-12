'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

type EstadoBem = 'NOVO' | 'USADO' | 'QUEBRADO' | 'EM_MANUTENCAO'
type LocalBem = 'MATRIZ' | 'CAPELA'

export default function EditarBemPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome_bem: '',
    codigo: '',
    estado: 'USADO' as EstadoBem,
    valor: '',
    foto: '',
    marca: '',
    modelo: '',
    local: 'MATRIZ' as LocalBem,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (status === 'authenticated' && session.user.tipo_user !== 'ADM') {
      toast.error('Acesso negado')
      router.push('/dashboard')
    }
  }, [session, status, router])

  useEffect(() => {
    const fetchBem = async () => {
      try {
        const response = await fetch(`/api/bens/${params.id}`)
        if (!response.ok) {
          throw new Error('Bem não encontrado')
        }
        const data = await response.json()
        setFormData({
          nome_bem: data.nome_bem,
          codigo: data.codigo,
          estado: data.estado,
          valor: data.valor ? String(data.valor) : '',
          foto: data.foto || '',
          marca: data.marca || '',
          modelo: data.modelo || '',
          local: data.local,
        })
      } catch (error: any) {
        toast.error('Erro ao carregar dados do bem', {
          description: error.message,
        })
      }
    }

    if (params.id) {
      fetchBem()
    }
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload = {
        ...formData,
        valor: formData.valor ? parseFloat(formData.valor) : null,
        foto: formData.foto || null,
        marca: formData.marca || null,
        modelo: formData.modelo || null,
      }

      const response = await fetch(`/api/bens/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar bem')
      }

      toast.success('Bem atualizado com sucesso!')
      router.push(`/dashboard/bens/${params.id}`)
      router.refresh()
    } catch (error: any) {
      toast.error('Erro ao atualizar bem', {
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || !session) {
    return <p>Carregando...</p>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/dashboard/bens/${params.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancelar Edição
            </Button>
          </Link>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Editar Bem</CardTitle>
            <CardDescription>
              Atualize os dados do bem.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nome_bem">Nome do Bem *</Label>
                  <Input
                    id="nome_bem"
                    value={formData.nome_bem}
                    onChange={(e) => setFormData({ ...formData, nome_bem: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigo">Código *</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="marca">Marca</Label>
                  <Input
                    id="marca"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input
                    id="modelo"
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado do Bem *</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value: EstadoBem) => 
                      setFormData({ ...formData, estado: value })
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
                  <Label htmlFor="local">Localização *</Label>
                  <Select
                    value={formData.local}
                    onValueChange={(value: LocalBem) => 
                      setFormData({ ...formData, local: value })
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MATRIZ">Matriz</SelectItem>
                      <SelectItem value="CAPELA">Capela</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="foto">URL da Foto</Label>
                <Input
                  id="foto"
                  type="url"
                  value={formData.foto}
                  onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
                  disabled={isLoading}
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
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

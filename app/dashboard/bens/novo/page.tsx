'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NovoBemPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome_bem: '',
    codigo: '',
    estado: 'USADO' as 'NOVO' | 'USADO' | 'QUEBRADO' | 'EM_MANUTENCAO',
    valor: '',
    foto: '',
    marca: '',
    modelo: '',
    local: 'MATRIZ' as 'MATRIZ' | 'CAPELA',
  })

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.replace('/login')
    } else if (session?.user?.tipo_user !== 'ADM') {
      toast.error('Acesso negado', { description: 'Você não tem permissão para acessar esta página.' })
      router.replace('/dashboard')
    }
  }, [session, status, router])

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

      const response = await fetch('/api/bens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao cadastrar bem')
      }

      toast.success('Bem cadastrado com sucesso!')
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      toast.error('Erro ao cadastrar bem', {
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="p-4 md:p-8 max-w-[1280px] mx-auto w-full">
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
            <CardTitle>Cadastrar Novo Bem</CardTitle>
            <CardDescription>
              Preencha os dados do bem a ser cadastrado no patrimônio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nome_bem">Nome do Bem *</Label>
                  <Input
                    id="nome_bem"
                    placeholder="Ex: Projetor Multimídia"
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
                    placeholder="Ex: PROJ-001"
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
                    placeholder="Ex: Epson"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input
                    id="modelo"
                    placeholder="Ex: PowerLite S41+"
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
                    onValueChange={(value: 'NOVO' | 'USADO' | 'QUEBRADO' | 'EM_MANUTENCAO') => 
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
                    onValueChange={(value: 'MATRIZ' | 'CAPELA') => 
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
                  placeholder="Ex: 2500.00"
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
                  placeholder="https://exemplo.com/foto.jpg"
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
                  {isLoading ? 'Cadastrando...' : 'Cadastrar Bem'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
    </main>
  )
}


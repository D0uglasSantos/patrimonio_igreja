'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
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
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome_bem: '',
    codigo: '',
    estado: 'USADO' as 'NOVO' | 'USADO' | 'QUEBRADO',
    valor: '',
    foto: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload = {
        nome_bem: formData.nome_bem,
        codigo: formData.codigo,
        estado: formData.estado,
        valor: formData.valor ? parseFloat(formData.valor) : null,
        foto: formData.foto || null,
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
            <CardTitle>Cadastrar Novo Bem</CardTitle>
            <CardDescription>
              Preencha os dados do bem a ser cadastrado no patrimônio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <p className="text-sm text-gray-500">
                  Código único de identificação do bem
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado do Bem *</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value: 'NOVO' | 'USADO' | 'QUEBRADO') => 
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
                  </SelectContent>
                </Select>
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
                <p className="text-sm text-gray-500">
                  Valor estimado ou de compra do bem (opcional)
                </p>
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
                <p className="text-sm text-gray-500">
                  Link para uma imagem do bem (opcional)
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
                  {isLoading ? 'Cadastrando...' : 'Cadastrar Bem'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


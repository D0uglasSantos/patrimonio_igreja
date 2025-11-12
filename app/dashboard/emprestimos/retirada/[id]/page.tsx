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

export default function RetiradaBemPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [bem, setBem] = useState<any>(null)
  const [pastorais, setPastorais] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    id_retirante: '',
    id_pastoral: '',
    estado_retirada: 'USADO' as 'NOVO' | 'USADO' | 'QUEBRADO',
    descricao_motivo_retirada: '',
    email_retirante: session?.user?.email || '',
  })

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
      } catch (error) {
        toast.error('Erro ao carregar dados')
      }
    }

    if (params.id && session) {
      setFormData(prev => ({ ...prev, email_retirante: session.user.email }))
      fetchData()
    }
  }, [params.id, session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload = {
        id_bem: parseInt(params.id as string),
        id_retirante: session?.user?.id || parseInt(formData.id_retirante),
        id_pastoral: parseInt(formData.id_pastoral),
        estado_retirada: formData.estado_retirada,
        descricao_motivo_retirada: formData.descricao_motivo_retirada || null,
        email_retirante: formData.email_retirante,
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
                <Label htmlFor="estado_retirada">Estado do Bem na Retirada *</Label>
                <Select
                  value={formData.estado_retirada}
                  onValueChange={(value: 'NOVO' | 'USADO' | 'QUEBRADO') => 
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
                  </SelectContent>
                </Select>
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

              <div className="space-y-2">
                <Label htmlFor="descricao_motivo_retirada">Motivo da Retirada</Label>
                <Textarea
                  id="descricao_motivo_retirada"
                  placeholder="Descreva o motivo ou evento para o qual o bem será utilizado"
                  value={formData.descricao_motivo_retirada}
                  onChange={(e) => setFormData({ ...formData, descricao_motivo_retirada: e.target.value })}
                  disabled={isLoading}
                  rows={4}
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


'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditarPastoralPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome_pastoral: '',
  })

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated' || session?.user?.tipo_user !== 'ADM') {
      toast.error('Acesso negado')
      router.replace('/dashboard/pastorais')
    }
  }, [session, status, router])

  useEffect(() => {
    const fetchPastoral = async () => {
      try {
        const response = await fetch(`/api/pastorais/${params.id}`)
        if (!response.ok) {
          throw new Error('Pastoral não encontrada')
        }
        const data = await response.json()
        setFormData({ nome_pastoral: data.nome_pastoral })
      } catch (error: any) {
        toast.error('Erro ao carregar dados', { description: error.message })
      }
    }

    if (params.id) {
      fetchPastoral()
    }
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/pastorais/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar pastoral')
      }

      toast.success('Pastoral atualizada com sucesso!')
      router.push('/dashboard/pastorais')
      router.refresh()
    } catch (error: any) {
      toast.error('Erro ao atualizar', { description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard/pastorais">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Pastorais
            </Button>
          </Link>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Editar Pastoral</CardTitle>
            <CardDescription>Atualize o nome da pastoral.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nome_pastoral">Nome da Pastoral *</Label>
                <Input
                  id="nome_pastoral"
                  value={formData.nome_pastoral}
                  onChange={(e) => setFormData({ ...formData, nome_pastoral: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading} className="flex-1">
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

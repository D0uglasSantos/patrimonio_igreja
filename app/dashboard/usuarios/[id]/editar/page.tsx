'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type FuncaoPastoral = 'COORDENADOR' | 'VICE_COORDENADOR'
type TipoUser = 'ADM' | 'COMUM'

export default function EditarUsuarioPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [pastorais, setPastorais] = useState<any[]>([])
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    tipo_user: 'COMUM' as TipoUser,
    id_pastoral: '',
    funcao_pastoral: 'VICE_COORDENADOR' as FuncaoPastoral,
  })

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated' || session?.user?.tipo_user !== 'ADM') {
      toast.error('Acesso negado')
      router.replace('/dashboard/usuarios')
    }
  }, [session, status, router])

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [userResponse, pastoraisResponse] = await Promise.all([
          fetch(`/api/usuarios/${params.id}`),
          fetch('/api/pastorais'),
        ])

        if (!userResponse.ok) throw new Error('Usuário não encontrado')
        if (!pastoraisResponse.ok) throw new Error('Erro ao carregar pastorais')

        const userData = await userResponse.json()
        const pastoraisData = await pastoraisResponse.json()

        setPastorais(pastoraisData)
        setFormData({
          ...userData,
          id_pastoral: userData.id_pastoral?.toString() || '',
          senha: '', // Senha sempre em branco por segurança
        })
      } catch (error: any) {
        toast.error('Erro ao carregar dados', { description: error.message })
      }
    }

    if (params.id) {
      fetchInitialData()
    }
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!formData.id_pastoral) {
      toast.error('O campo Pastoral é obrigatório.')
      setIsLoading(false)
      return
    }

    try {
      const payload: any = {
        ...formData,
        id_pastoral: parseInt(formData.id_pastoral),
      }
      // Só incluir a senha no payload se ela for preenchida
      if (!payload.senha) {
        delete payload.senha
      }

      const response = await fetch(`/api/usuarios/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar usuário')
      }

      toast.success('Usuário atualizado com sucesso!')
      router.push('/dashboard/usuarios')
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
          <Link href="/dashboard/usuarios">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Usuários
            </Button>
          </Link>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Editar Usuário</CardTitle>
            <CardDescription>Atualize os dados do usuário.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required disabled={isLoading} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={isLoading} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Nova Senha</Label>
                <Input id="senha" type="password" value={formData.senha} onChange={(e) => setFormData({ ...formData, senha: e.target.value })} disabled={isLoading} placeholder="Deixe em branco para não alterar" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id_pastoral">Pastoral *</Label>
                  <Select value={formData.id_pastoral} onValueChange={(value) => setFormData({ ...formData, id_pastoral: value })} required disabled={isLoading}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {pastorais.map(p => <SelectItem key={p.id_pastoral} value={p.id_pastoral.toString()}>{p.nome_pastoral}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="funcao_pastoral">Função *</Label>
                  <Select value={formData.funcao_pastoral} onValueChange={(value: FuncaoPastoral) => setFormData({ ...formData, funcao_pastoral: value })} required disabled={isLoading}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COORDENADOR">Coordenador</SelectItem>
                      <SelectItem value="VICE_COORDENADOR">Vice-Coordenador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_user">Tipo de Usuário *</Label>
                <Select value={formData.tipo_user} onValueChange={(value: TipoUser) => setFormData({ ...formData, tipo_user: value })} disabled={isLoading}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMUM">Comum</SelectItem>
                    <SelectItem value="ADM">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar Alterações'}</Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  )
}

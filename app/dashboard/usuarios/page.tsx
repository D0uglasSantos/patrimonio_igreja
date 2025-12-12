'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'

type FuncaoPastoral = 'COORDENADOR' | 'VICE_COORDENADOR'

export default function UsuariosPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [pastorais, setPastorais] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    tipo_user: 'COMUM' as 'ADM' | 'COMUM',
    id_pastoral: '',
    funcao_pastoral: 'VICE_COORDENADOR' as FuncaoPastoral,
  })

  const isAdmin = session?.user?.tipo_user === 'ADM'

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.replace('/login')
    } else if (!isAdmin) {
      toast.error('Acesso negado', { description: 'Você não tem permissão para acessar esta página.' })
      router.replace('/dashboard')
    }
  }, [session, status, router, isAdmin])

  const fetchInitialData = async () => {
    try {
      setIsLoading(true)
      const [usersResponse, pastoraisResponse] = await Promise.all([
        fetch('/api/usuarios'),
        fetch('/api/pastorais'),
      ])

      if (!usersResponse.ok) throw new Error('Erro ao carregar usuários')
      if (!pastoraisResponse.ok) throw new Error('Erro ao carregar pastorais')

      const usersData = await usersResponse.json()
      const pastoraisData = await pastoraisResponse.json()
      
      setUsuarios(usersData)
      setPastorais(pastoraisData)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchInitialData()
    }
  }, [isAdmin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const payload = {
        ...formData,
        id_pastoral: parseInt(formData.id_pastoral),
      }
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao cadastrar usuário')
      }

      toast.success('Usuário cadastrado com sucesso!')
      setIsDialogOpen(false)
      setFormData({
        nome: '',
        email: '',
        senha: '',
        tipo_user: 'COMUM',
        id_pastoral: '',
        funcao_pastoral: 'VICE_COORDENADOR',
      })
      fetchInitialData()
    } catch (error: any) {
      toast.error('Erro ao cadastrar usuário', {
        description: error.message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (status === 'loading' || !isAdmin) {
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gerenciar Usuários</h1>
            <p className="text-gray-600">
              Cadastre e visualize usuários do sistema
            </p>
          </div>
          
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do novo usuário
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input id="nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required disabled={isSaving} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={isSaving} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha *</Label>
                    <Input id="senha" type="password" value={formData.senha} onChange={(e) => setFormData({ ...formData, senha: e.target.value })} required disabled={isSaving} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="id_pastoral">Pastoral *</Label>
                      <Select value={formData.id_pastoral} onValueChange={(value) => setFormData({ ...formData, id_pastoral: value })} required disabled={isSaving}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {pastorais.map(p => <SelectItem key={p.id_pastoral} value={p.id_pastoral.toString()}>{p.nome_pastoral}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="funcao_pastoral">Função *</Label>
                      <Select value={formData.funcao_pastoral} onValueChange={(value: FuncaoPastoral) => setFormData({ ...formData, funcao_pastoral: value })} required disabled={isSaving}>
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
                    <Select value={formData.tipo_user} onValueChange={(value: 'ADM' | 'COMUM') => setFormData({ ...formData, tipo_user: value })} disabled={isSaving}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COMUM">Comum</SelectItem>
                        <SelectItem value="ADM">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" disabled={isSaving}>{isSaving ? 'Cadastrando...' : 'Cadastrar'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader><CardTitle>Usuários Cadastrados</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p className="text-center py-8 text-gray-500">Carregando...</p> : 
            usuarios.length === 0 ? <p className="text-center py-8 text-gray-500">Nenhum usuário cadastrado</p> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Pastoral</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Tipo</TableHead>
                      {isAdmin && <TableHead className="text-right">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map((usuario) => (
                      <TableRow key={usuario.id_user}>
                        <TableCell className="font-medium">{usuario.nome}</TableCell>
                        <TableCell>{usuario.email}</TableCell>
                        <TableCell>{usuario.pastoral?.nome_pastoral || 'N/A'}</TableCell>
                        <TableCell>{usuario.funcao_pastoral?.replace('_', ' ') || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={usuario.tipo_user === 'ADM' ? 'default' : 'secondary'}>
                            {usuario.tipo_user === 'ADM' ? 'Admin' : 'Comum'}
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/usuarios/${usuario.id_user}/editar`)}>
                              Editar
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


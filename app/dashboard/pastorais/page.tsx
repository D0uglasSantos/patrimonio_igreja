'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Church } from 'lucide-react'

export default function PastoraisPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [pastorais, setPastorais] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    nome_pastoral: '',
  })

  const isAdmin = session?.user?.tipo_user === 'ADM'

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [session, status, router])

  const fetchPastorais = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/pastorais')
      if (!response.ok) {
        throw new Error('Erro ao carregar pastorais')
      }
      const data = await response.json()
      // Contar membros para cada pastoral
      const pastoraisComMembros = data.map((p: any) => ({
        ...p,
        coordenadores: p.membros?.filter((m: any) => m.funcao_pastoral === 'COORDENADOR').length || 0,
        vices: p.membros?.filter((m: any) => m.funcao_pastoral === 'VICE_COORDENADOR').length || 0,
      }))
      setPastorais(pastoraisComMembros)
    } catch (error) {
      toast.error('Erro ao carregar pastorais')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPastorais()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch('/api/pastorais', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao cadastrar pastoral')
      }

      toast.success('Pastoral cadastrada com sucesso!')
      setIsDialogOpen(false)
      setFormData({ nome_pastoral: '' })
      fetchPastorais()
    } catch (error: any) {
      toast.error('Erro ao cadastrar pastoral', {
        description: error.message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gerenciar Pastorais</h1>
            <p className="text-gray-600">
              Cadastre e visualize as pastorais da paróquia
            </p>
          </div>
          
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Church className="h-4 w-4 mr-2" />
                  Nova Pastoral
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar Nova Pastoral</DialogTitle>
                  <DialogDescription>
                    Preencha o nome da nova pastoral
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_pastoral">Nome da Pastoral *</Label>
                    <Input
                      id="nome_pastoral"
                      placeholder="Ex: Pastoral da Juventude"
                      value={formData.nome_pastoral}
                      onChange={(e) => setFormData({ ...formData, nome_pastoral: e.target.value })}
                      required
                      disabled={isSaving}
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isSaving}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'Cadastrando...' : 'Cadastrar'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pastorais Cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-gray-500">Carregando...</p>
            ) : pastorais.length === 0 ? (
              <p className="text-center py-8 text-gray-500">Nenhuma pastoral cadastrada</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Coordenadores</TableHead>
                      <TableHead>Vice-Coordenadores</TableHead>
                      {isAdmin && <TableHead className="text-right">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastorais.map((pastoral) => (
                      <TableRow key={pastoral.id_pastoral}>
                        <TableCell className="font-medium">{pastoral.nome_pastoral}</TableCell>
                        <TableCell>{pastoral.coordenadores} / 4</TableCell>
                        <TableCell>{pastoral.vices} / 2</TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/pastorais/${pastoral.id_pastoral}/editar`)}>
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


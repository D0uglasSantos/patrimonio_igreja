'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogOut, Home, Package, FileText, Users, Church } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function Navbar() {
  const { data: session } = useSession()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const isAdmin = session?.user?.tipo_user === 'ADM'

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <>
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Church className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-xl">Patrimônio Paróquia</span>
            </Link>
            
            <div className="hidden md:flex space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              
              {isAdmin && (
                <Link href="/dashboard/bens/novo">
                  <Button variant="ghost" size="sm">
                    <Package className="h-4 w-4 mr-2" />
                    Cadastrar Bem
                  </Button>
                </Link>
              )}
              
              <Link href="/dashboard/relatorios">
                <Button variant="ghost" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Relatórios
                </Button>
              </Link>
              
              {isAdmin && (
                <>
                  <Link href="/dashboard/usuarios">
                    <Button variant="ghost" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Usuários
                    </Button>
                  </Link>
                  <Link href="/dashboard/pastorais">
                    <Button variant="ghost" size="sm">
                      <Church className="h-4 w-4 mr-2" />
                      Pastorais
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <p className="font-medium">{session?.user?.nome}</p>
              <p className="text-gray-500 text-xs">
                {session?.user?.tipo_user === 'ADM' ? 'Administrador' : 'Usuário'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogoutDialog(true)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </nav>

      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Logout</DialogTitle>
            <DialogDescription>
              Deseja realmente sair do sistema?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLogout}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


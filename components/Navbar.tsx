"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, Home, Package, FileText, Users, Church, Menu, X } from "lucide-react"
import { useState } from "react"
import React from "react"
import { useSession, signOut } from "next-auth/react"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session } = useSession()

  const isAdmin = session?.user?.tipo_user === "ADM"

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4 md:space-x-8">
          <Link href="/dashboard" className="flex items-center space-x-2 shrink-0">
            <Church className="h-6 w-6 text-blue-600" />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-4">
            <NavLinks isAdmin={isAdmin} setMobileMenuOpen={setMobileMenuOpen} />
          </div>

          {/* Mobile Menu Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {session?.user && (
            <div className="text-sm text-right hidden sm:block">
              <p className="font-medium text-xs md:text-sm">{session.user.nome}</p>
              <p className="text-gray-500 text-xs">{isAdmin ? "Administrador" : "Usuário"}</p>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="cursor-pointer text-xs md:text-sm bg-transparent"
          >
            <LogOut className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
          <nav className="flex flex-col space-y-2">
            <NavLinks isAdmin={isAdmin} setMobileMenuOpen={setMobileMenuOpen} />
          </nav>
        </div>
      )}
    </nav>
  )
}

// MOVER NAVLINKS PARA FORA DA FUNÇÃO NAVBAR
interface NavLinksProps {
  isAdmin: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
const NavLinks = ({ isAdmin, setMobileMenuOpen }: NavLinksProps) => (
  <>
    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
      <Button variant="ghost" size="sm" className="w-full justify-start md:w-auto">
        <Home className="h-4 w-4 mr-2" />
        Dashboard
      </Button>
    </Link>

    <Link href="/dashboard/bens" onClick={() => setMobileMenuOpen(false)}>
      <Button variant="ghost" size="sm" className="w-full justify-start md:w-auto">
        <Package className="h-4 w-4 mr-2" />
        Bens
      </Button>
    </Link>

    {isAdmin && (
      <Link href="/dashboard/bens/novo" onClick={() => setMobileMenuOpen(false)}>
        <Button variant="ghost" size="sm" className="w-full justify-start md:w-auto">
          <Package className="h-4 w-4 mr-2" />
          Cadastrar Bem
        </Button>
      </Link>
    )}

    <Link href="/dashboard/relatorios" onClick={() => setMobileMenuOpen(false)}>
      <Button variant="ghost" size="sm" className="w-full justify-start md:w-auto">
        <FileText className="h-4 w-4 mr-2" />
        Relatórios
      </Button>
    </Link>

    {isAdmin && (
      <>
        <Link href="/dashboard/usuarios" onClick={() => setMobileMenuOpen(false)}>
          <Button variant="ghost" size="sm" className="w-full justify-start md:w-auto">
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </Button>
        </Link>
        <Link href="/dashboard/pastorais" onClick={() => setMobileMenuOpen(false)}>
          <Button variant="ghost" size="sm" className="w-full justify-start md:w-auto">
            <Church className="h-4 w-4 mr-2" />
            Pastorais
          </Button>
        </Link>
      </>
    )}
  </>
)

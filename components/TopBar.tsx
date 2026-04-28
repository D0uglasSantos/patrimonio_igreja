"use client"

import { useSession, signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TopBar() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.tipo_user === "ADM"

  return (
    <header className="bg-white sticky top-0 z-40 h-16 px-4 md:px-6 flex items-center justify-between border-b border-[#e3e2e6] shadow-sm shrink-0">
      {/* Mobile: título do app */}
      <div className="flex items-center">
        <span className="md:hidden text-base font-bold text-[#002045]">
          Patrimônio Paroquial
        </span>
      </div>

      {/* Direita: usuário + sair */}
      <div className="flex items-center gap-3">
        {session?.user && (
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-[#1a1c1e] leading-tight">
              {session.user.nome}
            </p>
            <p className="text-xs text-[#74777f]">
              {isAdmin ? "Administrador" : "Usuário"}
            </p>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="cursor-pointer border-[#c4c6cf] text-[#43474e] hover:bg-[#efedf1] text-xs"
        >
          <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  )
}

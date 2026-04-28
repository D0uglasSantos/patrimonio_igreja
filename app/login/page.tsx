'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Church, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ email: '', senha: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        senha: formData.senha,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Erro ao fazer login', {
          description: 'Email ou senha incorretos',
        })
      } else {
        toast.success('Login realizado com sucesso!')
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      toast.error('Erro ao fazer login', {
        description: 'Ocorreu um erro inesperado',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Painel esquerdo – Identidade visual ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-[#002045] to-[#1a365d] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Textura sutil */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-size-[32px_32px]" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-xs">
          <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-6">
            <Church className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 leading-tight">
            Gestão Patrimonial
          </h1>
          <p className="text-[#adc7f7] text-lg mb-6">Administração Diocesana</p>
          <p className="text-[#86a0cd] text-sm leading-relaxed">
            Sistema integrado de gestão e controle do patrimônio paroquial.
          </p>
        </div>
      </div>

      {/* ── Painel direito – Formulário ── */}
      <div className="flex-1 flex items-center justify-center bg-[#faf9fd] p-6">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-full bg-[#1a365d] flex items-center justify-center mb-3">
              <Church className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#002045]">Gestão Patrimonial</h1>
            <p className="text-[#74777f] text-sm">Administração Diocesana</p>
          </div>

          {/* Card de login */}
          <div className="bg-white rounded-xl border border-[#c4c6cf] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#002045] mb-1">
                Bem-vindo de volta
              </h2>
              <p className="text-sm text-[#74777f]">
                Faça login para acessar o sistema
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs font-semibold uppercase tracking-wider text-[#43474e]"
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#74777f]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isLoading}
                    className="pl-10 border-[#c4c6cf] focus-visible:ring-[#455f88] focus-visible:border-[#002045]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="senha"
                  className="text-xs font-semibold uppercase tracking-wider text-[#43474e]"
                >
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#74777f]" />
                  <Input
                    id="senha"
                    type="password"
                    placeholder="••••••••"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    required
                    disabled={isLoading}
                    className="pl-10 border-[#c4c6cf] focus-visible:ring-[#455f88] focus-visible:border-[#002045]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#002045] hover:bg-[#1a365d] text-white font-semibold mt-2 cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-[#74777f]">
              <span className="font-mono">admin@paroquia.com</span> /{' '}
              <span className="font-mono">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

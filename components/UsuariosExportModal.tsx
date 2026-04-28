'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function UsuariosExportModal() {
  const [open, setOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const response = await fetch('/api/usuarios/export')
      if (!response.ok) {
        const error = (await response.json()) as { error?: string }
        throw new Error(error.error || 'Erro ao exportar usuários')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `usuarios_${Date.now()}.xlsx`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)

      toast.success('Exportação concluída com sucesso')
      setOpen(false)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro inesperado'
      toast.error('Falha na exportação', { description: message })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-[#c4c6cf] text-[#002045] hover:bg-[#d5e0f7]/30 w-full md:w-auto"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] border-[#c4c6cf]">
        <DialogHeader>
          <DialogTitle className="text-[#002045]">Exportar Usuários em Excel</DialogTitle>
          <DialogDescription>
            Exporta todos os usuários cadastrados no momento.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-dashed border-[#c4c6cf] p-4">
          <div className="flex items-start gap-2">
            <FileSpreadsheet className="h-4 w-4 text-[#455f88] mt-0.5 shrink-0" />
            <p className="text-xs text-[#74777f]">
              O arquivo incluirá nome, email, tipo de usuário, pastoral e função pastoral.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isExporting}
            className="border-[#c4c6cf] text-[#002045]"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="bg-[#002045] hover:bg-[#1a365d] text-white"
          >
            {isExporting ? 'Exportando...' : 'Baixar Excel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

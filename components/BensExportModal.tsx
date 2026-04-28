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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type ExportEstado = 'todos' | 'NOVO' | 'USADO' | 'QUEBRADO' | 'EM_MANUTENCAO'

export function BensExportModal() {
  const [open, setOpen] = useState(false)
  const [estado, setEstado] = useState<ExportEstado>('todos')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)

      const params = new URLSearchParams({
        tipo: 'bens',
        formato: 'excel',
      })

      if (estado !== 'todos') {
        params.append('estado', estado)
      }

      const response = await fetch(`/api/relatorios?${params.toString()}`)
      if (!response.ok) {
        const error = (await response.json()) as { error?: string }
        throw new Error(error.error || 'Erro ao exportar bens')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      const suffix = estado === 'todos' ? 'todos' : estado.toLowerCase()
      anchor.href = url
      anchor.download = `bens_${suffix}_${new Date().getTime()}.xlsx`
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

      <DialogContent className="sm:max-w-[520px] border-[#c4c6cf]">
        <DialogHeader>
          <DialogTitle className="text-[#002045]">Exportar Bens em Excel</DialogTitle>
          <DialogDescription>
            Selecione o filtro desejado e exporte a listagem de bens cadastrados no momento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-[#c4c6cf] bg-[#f8f9fb] p-4">
            <p className="text-sm font-semibold text-[#1a1c1e] mb-2">Filtro para exportação</p>
            <Select value={estado} onValueChange={(value: ExportEstado) => setEstado(value)}>
              <SelectTrigger className="border-[#c4c6cf] focus-visible:ring-[#455f88]">
                <SelectValue placeholder="Selecione o filtro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Exportar todos</SelectItem>
                <SelectItem value="NOVO">Somente novos</SelectItem>
                <SelectItem value="USADO">Somente usados</SelectItem>
                <SelectItem value="EM_MANUTENCAO">Somente em manutenção</SelectItem>
                <SelectItem value="QUEBRADO">Somente quebrados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-dashed border-[#c4c6cf] p-4">
            <div className="flex items-start gap-2">
              <FileSpreadsheet className="h-4 w-4 text-[#455f88] mt-0.5 shrink-0" />
              <p className="text-xs text-[#74777f]">
                O arquivo será gerado com os bens existentes no momento da exportação.
              </p>
            </div>
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

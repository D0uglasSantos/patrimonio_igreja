'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, Download, FileSpreadsheet, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type ImportError = {
  linha: number
  campo: string
  mensagem: string
}

type ImportResponse = {
  message?: string
  totalImportados?: number
  totalProcessados?: number
}

type ImportErrorResponse = {
  error?: string
  erros?: ImportError[]
  totalErros?: number
  pastorais?: string[]
}

type PastoraisImportModalProps = {
  onImportSuccess: () => void
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Erro inesperado'
}

export function PastoraisImportModal({ onImportSuccess }: PastoraisImportModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [errors, setErrors] = useState<ImportError[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [totalErrors, setTotalErrors] = useState(0)

  const selectedFileLabel = useMemo(() => {
    if (!selectedFile) return 'Nenhum arquivo selecionado'
    const fileSizeMb = (selectedFile.size / (1024 * 1024)).toFixed(2)
    return `${selectedFile.name} (${fileSizeMb} MB)`
  }, [selectedFile])

  const resetState = () => {
    setSelectedFile(null)
    setErrors([])
    setErrorMessage('')
    setTotalErrors(0)
  }

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true)
      const response = await fetch('/api/pastorais/import/template')
      if (!response.ok) {
        const error = (await response.json()) as { error?: string }
        throw new Error(error.error || 'Erro ao baixar template')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'template_importacao_pastorais.xlsx'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Template baixado com sucesso')
    } catch (error: unknown) {
      toast.error('Erro ao baixar template', { description: getErrorMessage(error) })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setErrors([])
    setErrorMessage('')
    setTotalErrors(0)

    if (!file) {
      setSelectedFile(null)
      return
    }

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      toast.error('Arquivo inválido', { description: 'Selecione um arquivo com extensão .xlsx' })
      setSelectedFile(null)
      event.target.value = ''
      return
    }

    setSelectedFile(file)
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo para importar')
      return
    }

    try {
      setIsUploading(true)
      setErrors([])
      setErrorMessage('')
      setTotalErrors(0)

      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/pastorais/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = (await response.json()) as ImportErrorResponse
        setErrors(error.erros ?? [])
        setErrorMessage(error.error || 'Erro ao importar planilha')
        setTotalErrors(error.totalErros ?? 0)

        if (error.pastorais && error.pastorais.length > 0) {
          toast.error('Pastorais já cadastradas no sistema', {
            description: error.pastorais.slice(0, 5).join(', '),
          })
          return
        }

        throw new Error(error.error || 'Erro ao importar planilha')
      }

      const result = (await response.json()) as ImportResponse
      toast.success(result.message || 'Importação concluída', {
        description: `${result.totalImportados ?? 0} pastorais importadas com sucesso`,
      })
      setOpen(false)
      resetState()
      onImportSuccess()
    } catch (error: unknown) {
      toast.error('Falha na importação', { description: getErrorMessage(error) })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) resetState()
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-[#c4c6cf] text-[#002045] hover:bg-[#d5e0f7]/30 w-full md:w-auto"
        >
          <Upload className="h-4 w-4 mr-2" />
          Importar via Excel
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[640px] border-[#c4c6cf]">
        <DialogHeader>
          <DialogTitle className="text-[#002045]">Importação em Massa de Pastorais</DialogTitle>
          <DialogDescription>
            Use o template oficial e importe até 3000 pastorais por arquivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-[#c4c6cf] bg-[#f8f9fb] p-4">
            <p className="text-sm font-semibold text-[#1a1c1e] mb-1">1) Baixe o template de referência</p>
            <p className="text-xs text-[#74777f] mb-3">
              O template já vem com o cabeçalho esperado e um exemplo preenchido.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadTemplate}
              disabled={isDownloading}
              className="border-[#c4c6cf] text-[#002045] hover:bg-[#d5e0f7]/30"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Baixando...' : 'Baixar Template'}
            </Button>
          </div>

          <div className="rounded-xl border border-dashed border-[#c4c6cf] p-4">
            <p className="text-sm font-semibold text-[#1a1c1e] mb-2">2) Selecione o arquivo `.xlsx`</p>
            <Input
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              disabled={isUploading}
              className="border-[#c4c6cf] focus-visible:ring-[#455f88]"
            />
            <div className="mt-3 flex items-center gap-2 text-xs text-[#74777f]">
              <FileSpreadsheet className="h-4 w-4 text-[#455f88]" />
              <span>{selectedFileLabel}</span>
            </div>
            <p className="text-xs text-[#74777f] mt-2">
              Limites: até 3000 linhas e tamanho máximo de 10MB.
            </p>
          </div>

          {(errorMessage || errors.length > 0) && (
            <div className="rounded-xl border border-[#ffdad6] bg-[#fff8f7] p-4">
              <div className="flex items-start gap-2 text-[#ba1a1a] mb-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="text-sm font-semibold">{errorMessage || 'Erros encontrados na planilha'}</p>
              </div>
              {totalErrors > 0 && (
                <p className="text-xs text-[#93000a] mb-2">
                  Exibindo {errors.length} de {totalErrors} erros.
                </p>
              )}
              {errors.length > 0 && (
                <div className="max-h-44 overflow-auto space-y-1 pr-1">
                  {errors.map((error, index) => (
                    <p key={`${error.linha}-${error.campo}-${index}`} className="text-xs text-[#93000a]">
                      Linha {error.linha} - {error.campo}: {error.mensagem}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isUploading}
            className="border-[#c4c6cf] text-[#002045]"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={isUploading || !selectedFile}
            className="bg-[#002045] hover:bg-[#1a365d] text-white"
          >
            {isUploading ? 'Importando...' : 'Importar Pastorais'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

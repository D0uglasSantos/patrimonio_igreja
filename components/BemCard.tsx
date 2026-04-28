"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Package, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Bem {
  id_bem: number;
  nome_bem: string;
  codigo: string;
  estado: "NOVO" | "USADO" | "QUEBRADO" | "EM_MANUTENCAO";
  valor: number | null;
  foto: string | null;
  local?: string;
  emprestimos?: { data_entrega?: string | null; id?: number }[];
}

interface BemCardProps {
  bem: Bem;
  isAdmin: boolean;
  viewMode?: "grid" | "list";
}

const estadoConfig: Record<string, { label: string; className: string }> = {
  NOVO: {
    label: "Novo",
    className: "bg-[#1a365d] text-[#adc7f7] border-[#adc7f7]/30",
  },
  USADO: {
    label: "Usado",
    className: "bg-[#d5e0f7] text-[#3c475a] border-[#bcc7dd]/40",
  },
  QUEBRADO: {
    label: "Quebrado",
    className: "bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]/20",
  },
  EM_MANUTENCAO: {
    label: "Em Manutenção",
    className: "bg-amber-100 text-amber-800 border-amber-200/40",
  },
};

function BemThumbnail({
  foto,
  nome,
  className,
  imgClassName,
}: {
  foto: string | null;
  nome: string;
  className?: string;
  imgClassName?: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (foto && !imgError) {
    return (
      <div className={cn("relative bg-[#efedf1] overflow-hidden", className)}>
        <Image
          src={foto}
          alt={nome}
          fill
          sizes="(max-width: 640px) 100vw, 25vw"
          className={cn("object-cover", imgClassName)}
          onError={() => setImgError(true)}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-[#efedf1] overflow-hidden flex items-center justify-center",
        className,
      )}
    >
      <Package className="h-1/3 w-1/3 text-[#c4c6cf]" />
    </div>
  );
}

export function BemCard({ bem, isAdmin, viewMode = "grid" }: BemCardProps) {
  const emprestimosAtivos =
    bem.emprestimos?.filter((emp) => !emp.data_entrega) ?? [];
  const disponivel = emprestimosAtivos.length === 0;
  const estado = estadoConfig[bem.estado] ?? estadoConfig.USADO;
  const localLabel = bem.local === "MATRIZ" ? "Matriz" : "Capela";

  /* ──────────────── MODO LISTA ──────────────── */
  if (viewMode === "list") {
    return (
      <div className="group flex items-center gap-3 px-4 py-3 hover:bg-[#f8f9fb] transition-colors">
        {/* Thumbnail */}
        <BemThumbnail
          foto={bem.foto}
          nome={bem.nome_bem}
          className="h-12 w-12 rounded-lg shrink-0"
        />

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[#1a1c1e] truncate max-w-[200px] sm:max-w-xs md:max-w-sm">
              {bem.nome_bem}
            </span>
            <span className="text-[11px] text-[#74777f] shrink-0 hidden sm:inline">
              #{bem.codigo}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {bem.local && (
              <div className="flex items-center gap-1 text-[11px] text-[#43474e]">
                <MapPin className="h-3 w-3 shrink-0" />
                {localLabel}
              </div>
            )}
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border",
                estado.className,
              )}
            >
              {estado.label}
            </span>
          </div>
        </div>

        {/* Disponibilidade + ações */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              "hidden sm:inline text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border",
              disponivel
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200",
            )}
          >
            {disponivel ? "Disponível" : "Emprestado"}
          </span>

          {isAdmin && disponivel && (
            <Link href={`/dashboard/emprestimos/retirada/${bem.id_bem}`}>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs border-[#c4c6cf] text-[#002045] hover:bg-[#d5e0f7]/30"
              >
                Retirar
              </Button>
            </Link>
          )}
          {isAdmin && !disponivel && emprestimosAtivos.length > 0 && (
            <Link
              href={`/dashboard/emprestimos/devolucao/${emprestimosAtivos[0]?.id}`}
            >
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                Devolver
              </Button>
            </Link>
          )}
          <Link href={`/dashboard/bens/${bem.id_bem}`}>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-[#74777f] hover:text-[#002045] hover:bg-[#d5e0f7]/30"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  /* ──────────────── MODO GRID ──────────────── */
  return (
    <div className="bg-white rounded-xl border border-[#c4c6cf] overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.03)] group hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col h-full">
      {/* Imagem */}
      <div className="relative h-40 sm:h-44">
        <BemThumbnail
          foto={bem.foto}
          nome={bem.nome_bem}
          className="h-full w-full"
          imgClassName="group-hover:scale-105 transition-transform duration-500"
        />
        <span
          className={cn(
            "absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border backdrop-blur-sm shadow-sm",
            estado.className,
          )}
        >
          {estado.label}
        </span>
      </div>

      {/* Conteúdo */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-sm font-semibold text-[#1a1c1e] line-clamp-1 flex-1 mr-2">
            {bem.nome_bem}
          </h3>
          <span className="text-xs text-[#74777f] shrink-0">
            #{bem.codigo}
          </span>
        </div>

        {bem.local && (
          <div className="flex items-center gap-1 text-xs text-[#43474e] mb-1">
            <MapPin className="h-3 w-3" />
            {localLabel}
          </div>
        )}

        {/* Rodapé */}
        <div className="mt-auto pt-3 border-t border-[#e3e2e6] flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border",
              disponivel
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200",
            )}
          >
            {disponivel ? "Disponível" : "Emprestado"}
          </span>

          <div className="flex items-center gap-1">
            {isAdmin && disponivel && (
              <Link href={`/dashboard/emprestimos/retirada/${bem.id_bem}`}>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-xs border-[#c4c6cf] text-[#002045] hover:bg-[#d5e0f7]/30"
                >
                  Retirar
                </Button>
              </Link>
            )}
            {isAdmin && !disponivel && emprestimosAtivos.length > 0 && (
              <Link
                href={`/dashboard/emprestimos/devolucao/${emprestimosAtivos[0]?.id}`}
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  Devolver
                </Button>
              </Link>
            )}
            <Link href={`/dashboard/bens/${bem.id_bem}`}>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-[#74777f] hover:text-[#002045] hover:bg-[#d5e0f7]/30"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

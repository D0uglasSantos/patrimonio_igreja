"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Users,
  Church,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  { href: "/dashboard/bens", label: "Catálogo", icon: Package, exact: false },
  {
    href: "/dashboard/relatorios",
    label: "Relatórios",
    icon: BarChart3,
    exact: false,
  },
];

const adminLinks = [
  { href: "/dashboard/usuarios", label: "Usuários", icon: Users, exact: false },
  {
    href: "/dashboard/pastorais",
    label: "Pastorais",
    icon: Church,
    exact: false,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.tipo_user === "ADM";

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  const desktopLink = (active: boolean) =>
    cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
      active
        ? "bg-white text-[#002045] shadow-sm ring-1 ring-[#e3e2e6]"
        : "text-[#43474e] hover:text-[#002045] hover:bg-[#d5e0f7]/30",
    );

  const allLinks = [...navLinks, ...(isAdmin ? adminLinks : [])];

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-[#f7fafc] border-r border-[#e3e2e6] flex-col p-4 z-50">
        {/* Logo */}
        <div className="mb-8 px-2">
          <div className="w-10 h-10 rounded-full bg-[#1a365d] flex items-center justify-center mb-3">
            <Church className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-[#002045] font-bold text-xl leading-tight">
            Gestão Patrimonial
          </h1>
          <span className="text-[#74777f] text-xs">
            Administração Paroquial
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 flex flex-col gap-1">
          {navLinks.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={desktopLink(isActive(href, exact))}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="my-2 border-t border-[#e3e2e6]" />
              {adminLinks.map(({ href, label, icon: Icon, exact }) => (
                <Link
                  key={href}
                  href={href}
                  className={desktopLink(isActive(href, exact))}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* CTA */}
        {isAdmin && (
          <div className="pt-4 border-t border-[#e3e2e6]">
            <Link
              href="/dashboard/bens/novo"
              className="w-full py-2.5 px-4 bg-[#002045] text-white text-sm font-semibold rounded-lg hover:bg-[#1a365d] transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Bem
            </Link>
          </div>
        )}
      </aside>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e3e2e6] z-50 flex items-center justify-around px-1 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {allLinks.slice(0, 4).map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors flex-1 max-w-[80px]",
                active
                  ? "text-[#002045] bg-[#d5e0f7]/50"
                  : "text-[#74777f] hover:text-[#002045]",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  active ? "text-[#002045]" : "text-[#74777f]",
                )}
              />
              <span className="truncate w-full text-center leading-tight">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

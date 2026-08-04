"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  Building2,
  LogOut,
  Menu,
  X,
  Search,
  Activity,
  HardDriveDownload,
  PanelLeftClose,
  PanelLeftOpen,
  Eye,
  UserPlus,
  CalendarPlus,
  Smile,
  PlusCircle,
  BarChart3,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { initials } from "@/lib/utils"
import { useToast } from "@/components/ui/toaster"
import { NotificationBell } from "@/components/layout/notification-bell"
import { ToothLogo } from "@/components/ui/tooth-logo"

type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
  module?: string
  adminSafe?: boolean
  clinicOnly?: boolean
}

const MENU: { group: string; items: NavItem[] }[] = [
  {
    group: "Principal",
    items: [
      {
        label: "Dashboard",
        href: "/app",
        icon: <LayoutDashboard className="h-[18px] w-[18px]" />,
        adminSafe: true,
      },
      {
        label: "Novo Paciente",
        href: "/app/pacientes/novo",
        icon: <UserPlus className="h-[18px] w-[18px]" />,
        module: "patients",
      },
      {
        label: "Novo atendimento",
        href: "/app/atendimentos/novo",
        icon: <CalendarPlus className="h-[18px] w-[18px]" />,
        module: "appointments",
      },
      {
        label: "Odontograma",
        href: "/app/odontograma",
        icon: <Smile className="h-[18px] w-[18px]" />,
        module: "odontogram",
      },
      {
        label: "Nova produção",
        href: "/app/producao",
        icon: <PlusCircle className="h-[18px] w-[18px]" />,
        module: "production",
      },
      {
        label: "Gerar relatório",
        href: "/app/relatorios",
        icon: <BarChart3 className="h-[18px] w-[18px]" />,
        module: "reports",
      },
      {
        label: "Financeiro",
        href: "/app/financeiro",
        icon: <Wallet className="h-[18px] w-[18px]" />,
        module: "finance",
      },
    ],
  },
]

const ADMIN_MENU: NavItem[] = [
  { label: "Clientes", href: "/admin/clientes", icon: <Building2 className="h-[18px] w-[18px]" /> },
  { label: "Planos", href: "/admin/planos", icon: <Activity className="h-[18px] w-[18px]" /> },
  { label: "Logs & Auditoria", href: "/admin/logs", icon: <ClipboardList className="h-[18px] w-[18px]" /> },
  { label: "Backup", href: "/admin/backup", icon: <HardDriveDownload className="h-[18px] w-[18px]" /> },
  { label: "Configurações", href: "/admin/configuracoes", icon: <Settings className="h-[18px] w-[18px]" /> },
]

export type ShellUser = {
  id: string
  name: string
  email: string
  role: string
  avatarUrl?: string | null
}

export function AppShell({
  children,
  user,
  modules,
  isAdminMaster,
  impersonating,
  tenantId,
}: {
  children: React.ReactNode
  user: ShellUser
  modules: string[]
  isAdminMaster: boolean
  impersonating: boolean
  tenantId: string | null
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const hasMod = (item: NavItem) => {
    if (item.clinicOnly && isAdminMaster && !impersonating) return false
    if (isAdminMaster) {
      if (impersonating) return true
      return !!item.adminSafe || !item.module
    }
    if (!item.module) return true
    return modules.includes(item.module)
  }

  const exitImpersonation = async () => {
    await fetch("/api/admin/impersonate", { method: "DELETE" })
    toast("Visualização encerrada.", "info")
    router.push("/admin/clientes")
    router.refresh()
  }

  const logout = async () => {
    const res = await fetch("/api/auth/logout", { method: "POST" })
    if (res.ok) {
      toast("Sessão encerrada com segurança.", "info")
      router.push("/login")
      router.refresh()
    }
  }

  const renderItem = (item: NavItem) => {
    if (!hasMod(item)) return null
    const active = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href))
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
          active
            ? "bg-sky-500/10 text-sky-300 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.25)]"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
          collapsed && "justify-center px-2",
        )}
      >
        <span className={cn(active ? "text-sky-400" : "text-slate-500 group-hover:text-slate-300", "shrink-0")}>
          {item.icon}
        </span>
        {!collapsed && <span className="truncate">{item.label}</span>}
        {active && !collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-400" />}
      </Link>
    )
  }

  const sideContent = (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center gap-3 px-5 py-5", collapsed && "justify-center px-2")}>
        <ToothLogo boxClassName={cn("h-10 w-10", collapsed && "h-9 w-9")} />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-white">
              <span className="text-gradient">Odonto</span>Cloud
            </p>
            <p className="truncate text-[11px] text-slate-500">Plataforma profissional</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {MENU.map((group) => {
          const visible = group.items.filter(hasMod)
          if (visible.length === 0) return null
          return (
            <div key={group.group}>
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                  {group.group}
                </p>
              )}
              <div className="space-y-0.5">{visible.map(renderItem)}</div>
            </div>
          )
        })}

        {isAdminMaster && (
          <div>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-500/80">
                Administração
              </p>
            )}
            <div className="space-y-0.5">{ADMIN_MENU.map(renderItem)}</div>
          </div>
        )}
      </nav>

      <div className="border-t border-[#16213a] p-3">
        <button
          onClick={logout}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300",
            collapsed && "justify-center px-2",
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-40 hidden border-r border-[#16213a] bg-[#070b14]/95 backdrop-blur-xl transition-all lg:block",
          collapsed ? "w-[68px]" : "w-64",
        )}
      >
        {sideContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 hidden h-7 w-7 items-center justify-center rounded-full border border-[#23345a] bg-[#0c1322] text-slate-400 transition hover:text-sky-300 lg:flex"
          aria-label="Alternar sidebar"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </aside>

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="anim-fade-in absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="anim-fade-in absolute inset-y-0 left-0 w-72 border-r border-[#16213a] bg-[#070b14]">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sideContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className={cn("flex min-h-screen flex-col transition-all", collapsed ? "lg:pl-[68px]" : "lg:pl-64")}>
        {impersonating && (
          <div className="no-print flex items-center justify-center gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
            <Eye className="h-3.5 w-3.5" />
            <span className="font-medium">Modo visualização — você está vendo o sistema como este cliente.</span>
            <button
              onClick={exitImpersonation}
              className="rounded-lg border border-amber-500/40 px-2.5 py-1 font-semibold text-amber-100 transition hover:bg-amber-500/20"
            >
              Sair da visualização
            </button>
          </div>
        )}
        <header className="no-print sticky top-0 z-30 border-b border-[#16213a] bg-[#070b14]/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden items-center gap-2 rounded-xl border border-[#1c2942] bg-[#0a1120] px-3.5 py-2 sm:flex sm:max-w-md sm:flex-1">
              <Search className="h-4 w-4 shrink-0 text-slate-500" />
              <GlobalSearch />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <NotificationBell />
              <button
                onClick={() => router.push("/app/configuracoes/perfil")}
                className="flex items-center gap-2.5 rounded-xl border border-[#1c2942] bg-[#0a1120] px-2.5 py-1.5 transition hover:border-sky-700/50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-600 to-cyan-500 text-xs font-bold text-white">
                  {initials(user.name)}
                </span>
                <span className="hidden text-left md:block">
                  <span className="block max-w-[140px] truncate text-xs font-semibold text-slate-200">{user.name}</span>
                  <span className="block text-[10px] text-slate-500">
                    {user.role === "ADMIN_MASTER" ? "Administrador" : "Profissional"}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

function GlobalSearch() {
  const router = useRouter()
  return (
    <input
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
          router.push(`/app/busca?q=${encodeURIComponent((e.target as HTMLInputElement).value.trim())}`)
        }
      }}
      placeholder="Buscar paciente, CPF, produção, exame..."
      className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
    />
  )
}
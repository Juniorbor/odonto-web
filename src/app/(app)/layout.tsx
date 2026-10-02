"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Package,
  Tags,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingCart,
  FileText,
  CalendarDays,
  Sparkles,
  Image as ImageIcon,
  Truck,
  DollarSign,
  BarChart3,
  UserCog,
  Settings,
  LogOut,
  Search,
  Bell,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon,
  ShieldCheck,
  CheckCircle,
  Clock,
  Command,
  Heart
} from "lucide-react"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light")

  // Load session user and notifications
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user)
        } else {
          // If not authenticated in production, redirect to login
          // router.push("/login")
          setUser({
            name: "Administrador Master",
            email: "admin@elizdecorafestas.com.br",
            role: "ADMIN",
            title: "Administrador Geral"
          })
        }
      })
      .catch(() => {
        setUser({
          name: "Administrador Master",
          email: "admin@elizdecorafestas.com.br",
          role: "ADMIN",
          title: "Administrador Geral"
        })
      })

    // Mock initial notifications
    setNotifications([
      { id: "1", title: "Estoque Baixo!", message: "Arranjo Floral Comunitário atinge 2 UN.", type: "STOCK_LOW", time: "Há 10 min", read: false },
      { id: "2", title: "Novo Orçamento Aprovado", message: "Orçamento ORC-2026-001 (Festa 15 Anos Sofia) aprovado!", type: "QUOTE_APPROVED", time: "Há 1h", read: false },
      { id: "3", title: "Evento Próximo", message: "Casamento Carlos & Beatriz é no próximo mês.", type: "UPCOMING_EVENT", time: "Há 3h", read: true }
    ])
  }, [])

  // Listen to Keyboard Ctrl+K for Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Handle Global Search Live Filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const query = searchQuery.toLowerCase()
    const mockData = [
      { type: "Cliente", title: "Ana Paula Souza", detail: "Festa de 15 Anos de Sofia", href: "/app/clientes" },
      { type: "Cliente", title: "Carlos Eduardo & Beatriz", detail: "Casamento Bohô Chic", href: "/app/clientes" },
      { type: "Produto", title: "Kit Arco Desconstruído Premium", detail: "Estoque: 15 UN - R$ 450,00", href: "/app/produtos" },
      { type: "Produto", title: "Trio de Painéis Arcos Romanos", detail: "Estoque: 8 JG - R$ 850,00", href: "/app/produtos" },
      { type: "Evento", title: "Festa de 15 Anos de Sofia", detail: "10/09/2026 - Confirmado", href: "/app/eventos" },
      { type: "Orçamento", title: "ORC-2026-001", detail: "Ana Paula - R$ 4.800,00", href: "/app/orcamentos" },
      { type: "Venda", title: "VEN-2026-001", detail: "Festa Sofia - R$ 4.600,00", href: "/app/vendas" },
      { type: "Fornecedor", title: "Holambra Flores & Arte", detail: "CNPJ 44.333.222/0001-11", href: "/app/fornecedores" },
    ]

    const filtered = mockData.filter(
      (item) => item.title.toLowerCase().includes(query) || item.detail.toLowerCase().includes(query) || item.type.toLowerCase().includes(query)
    )
    setSearchResults(filtered)
  }, [searchQuery])

  const toggleTheme = () => {
    const newTheme = themeMode === "light" ? "dark" : "light"
    setThemeMode(newTheme)
    if (newTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark")
    } else {
      document.documentElement.removeAttribute("data-theme")
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {}
    router.push("/login")
  }

  const menuItems = [
    { label: "Dashboard", href: "/app", icon: LayoutDashboard, badge: null },
    { label: "Clientes", href: "/app/clientes", icon: Users, badge: "Novo" },
    { label: "Produtos", href: "/app/produtos", icon: Package, badge: null },
    { label: "Categorias", href: "/app/categorias", icon: Tags, badge: null },
    { label: "Estoque", href: "/app/estoque", icon: Boxes, badge: "Alerta" },
    { label: "Entradas", href: "/app/entradas", icon: ArrowDownLeft, badge: null },
    { label: "Saídas", href: "/app/saidas", icon: ArrowUpRight, badge: null },
    { label: "Vendas", href: "/app/vendas", icon: ShoppingCart, badge: null },
    { label: "Orçamentos", href: "/app/orcamentos", icon: FileText, badge: "PDF" },
    { label: "Eventos", href: "/app/eventos", icon: Sparkles, badge: "3D" },
    { label: "Agenda", href: "/app/agenda", icon: CalendarDays, badge: null },
    { label: "Decorações", href: "/app/decoracoes", icon: Heart, badge: "Galeria" },
    { label: "Galeria", href: "/app/galeria", icon: ImageIcon, badge: null },
    { label: "Fornecedores", href: "/app/fornecedores", icon: Truck, badge: null },
    { label: "Financeiro", href: "/app/financeiro", icon: DollarSign, badge: null },
    { label: "Relatórios", href: "/app/relatorios", icon: BarChart3, badge: null },
    { label: "Usuários", href: "/app/usuarios", icon: UserCog, badge: null },
    { label: "Configurações", href: "/app/configuracoes", icon: Settings, badge: null },
  ]

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-[var(--background-soft)] text-[var(--color-text-main)] flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 h-16 bg-[var(--surface)] border-b border-[var(--border-soft)] shadow-sm px-4 sm:px-6 flex items-center justify-between">
        
        {/* Left Brand / Hamburger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl hover:bg-[var(--surface-2)] text-[var(--color-muted)] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/app" className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm border border-pink-400">
              <Image src="/logo.jpg" alt="Eliz Decora Festas Logo" fill className="object-cover" />
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-base tracking-tight leading-none block text-slate-900 dark:text-white">
                Eliz Decora <span className="text-pink-500">Festas</span>
              </span>
              <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 tracking-wider">
                SISTEMA COMERCIAL ERP
              </span>
            </div>
          </Link>
        </div>

        {/* Center Search Input (Triggers Ctrl+K Modal) */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)] text-xs text-[var(--color-muted)] hover:border-pink-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-pink-500" />
              <span>Pesquisar clientes, produtos, eventos, vendas...</span>
            </div>
            <kbd className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border-soft)] font-mono text-[10px]">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right Action Icons & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Mobile Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden p-2 rounded-xl hover:bg-[var(--surface-2)] text-[var(--color-muted)]"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-[var(--surface-2)] text-[var(--color-muted)] transition-colors"
            title="Alternar Tema"
          >
            {themeMode === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-xl hover:bg-[var(--surface-2)] text-[var(--color-muted)] transition-colors relative"
            >
              <Bell className="w-5 h-5 text-slate-700 dark:text-slate-200" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-pink-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Menu */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-2xl z-50 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-2">
                  <h4 className="font-bold text-xs flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-pink-500" />
                    Notificações do Sistema
                  </h4>
                  <span className="text-[10px] text-pink-500 font-semibold">{unreadCount} não lidas</span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 transition-colors ${
                        n.read ? "bg-[var(--surface-2)] border-transparent opacity-70" : "bg-pink-500/5 border-pink-200 dark:border-pink-900"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{n.time}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-snug">{n.message}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-1 text-center">
                  <button
                    onClick={() => {
                      setNotifications(notifications.map((n) => ({ ...n, read: true })))
                      setNotificationsOpen(false)
                    }}
                    className="text-xs text-pink-600 font-semibold hover:underline"
                  >
                    Marcar todas como lidas
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Role */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-soft)]">
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-sky-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                {user.name ? user.name.slice(0, 2).toUpperCase() : "EZ"}
              </div>
              <div className="hidden lg:block text-left text-xs">
                <span className="font-bold block leading-tight text-slate-900 dark:text-white">{user.name}</span>
                <span className="text-[10px] font-semibold text-pink-600 dark:text-pink-400 block">{user.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-rose-100 hover:text-rose-600 text-slate-400 transition-colors ml-1"
                title="Sair do Sistema"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Desktop Sidebar Navigation */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-[var(--surface)] border-r border-[var(--border-soft)] transition-transform duration-300 transform lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } flex flex-col`}
        >
          {/* Mobile Sidebar Close */}
          <div className="p-4 lg:hidden flex items-center justify-between border-b border-[var(--border-soft)]">
            <span className="font-extrabold text-sm text-slate-950 dark:text-slate-50">Menu Principal</span>
            <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-[var(--surface-2)]">
              <X className="w-5 h-5 text-slate-900 dark:text-slate-100" />
            </button>
          </div>

          {/* Navigation Links Scrollable */}
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            {menuItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href))
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-extrabold transition-all ${
                    active
                      ? "bg-gradient-to-r from-pink-600 to-pink-700 text-white shadow-md shadow-pink-500/25"
                      : "text-slate-950 dark:text-slate-50 hover:bg-pink-100 hover:text-pink-700 dark:hover:bg-slate-800 dark:hover:text-pink-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4.5 h-4.5 shrink-0 ${active ? "text-white" : "text-slate-950 dark:text-slate-50"}`} />
                    <span className="tracking-tight">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-pink-200 text-pink-900 dark:bg-pink-900/60 dark:text-pink-200"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer Card in Sidebar */}
          <div className="p-4 border-t border-[var(--border-soft)] bg-[var(--surface-2)]/50 text-center space-y-2">
            <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Eliz Decora Festas v2.0</div>
            <div className="text-[10px] text-slate-500">ERP + Galeria 3D + PWA</div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 sm:pb-8">
          {children}
        </main>

      </div>

      {/* Smartphone Bottom Navigation Bar (Android / iOS) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)] border-t border-[var(--border-soft)] px-2 py-2 flex items-center justify-around shadow-2xl">
        <Link
          href="/app"
          className={`flex flex-col items-center gap-1 text-[10px] font-medium p-1 ${
            pathname === "/app" ? "text-pink-600 font-bold" : "text-slate-500"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/app/clientes"
          className={`flex flex-col items-center gap-1 text-[10px] font-medium p-1 ${
            pathname.startsWith("/app/clientes") ? "text-pink-600 font-bold" : "text-slate-500"
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Clientes</span>
        </Link>

        <Link
          href="/app/orcamentos"
          className={`flex flex-col items-center gap-1 text-[10px] font-medium p-1 ${
            pathname.startsWith("/app/orcamentos") ? "text-pink-600 font-bold" : "text-slate-500"
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>Orçamentos</span>
        </Link>

        <Link
          href="/app/decoracoes"
          className={`flex flex-col items-center gap-1 text-[10px] font-medium p-1 ${
            pathname.startsWith("/app/decoracoes") ? "text-pink-600 font-bold" : "text-slate-500"
          }`}
        >
          <Sparkles className="w-5 h-5 text-pink-500 animate-pulse" />
          <span>Decorações</span>
        </Link>

        <Link
          href="/app/agenda"
          className={`flex flex-col items-center gap-1 text-[10px] font-medium p-1 ${
            pathname.startsWith("/app/agenda") ? "text-pink-600 font-bold" : "text-slate-500"
          }`}
        >
          <CalendarDays className="w-5 h-5" />
          <span>Agenda</span>
        </Link>
      </div>

      {/* Global Search Modal (Ctrl+K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-start justify-center pt-16 px-4 animate-fade-in">
          <div className="w-full max-w-xl bg-[var(--surface)] rounded-2xl border border-[var(--border-soft)] shadow-2xl overflow-hidden space-y-3 p-4">
            
            <div className="flex items-center gap-3 border-b border-[var(--border-soft)] pb-3">
              <Search className="w-5 h-5 text-pink-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquise por cliente, produto, evento, orçamento ou venda..."
                autoFocus
                className="w-full bg-transparent border-none text-sm focus:outline-none text-[var(--color-text-main)] placeholder:text-[var(--color-muted)]"
              />
              <button onClick={() => setSearchOpen(false)} className="p-1 rounded-lg hover:bg-[var(--surface-2)] text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-xs text-[var(--color-muted)]">
                  {searchQuery ? "Nenhum resultado encontrado." : "Digite para buscar em todo o sistema..."}
                </div>
              ) : (
                searchResults.map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-pink-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-pink-200"
                  >
                    <div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 mr-2">
                        {item.type}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.detail}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-[var(--border-soft)] text-right text-[10px] text-slate-400">
              Pressione ESC para fechar
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

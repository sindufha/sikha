import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard, Users, GraduationCap, Shield, QrCode, Camera,
  FileText, Clock, Activity, LogOut, Menu, School, ChevronDown, UserCircle,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/siswa', icon: Users, label: 'Data Siswa' },
  { to: '/admin/kelas', icon: GraduationCap, label: 'Data Kelas' },
  { to: '/admin/users', icon: Shield, label: 'Data Pengguna' },
  { to: '/admin/generate-qr', icon: QrCode, label: 'Generate QR' },
  { to: '/admin/presensi-qr', icon: Camera, label: 'Scan QR' },
  { to: '/admin/laporan', icon: FileText, label: 'Laporan Presensi' },
  { to: '/admin/pengaturan-jam', icon: Clock, label: 'Pengaturan Jam' },
  { to: '/admin/audit-log', icon: Activity, label: 'Log Aktivitas' },
  { to: '/admin/profil', icon: UserCircle, label: 'Profil' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const pageTitle = navItems.find(item => location.pathname === item.to)?.label || 'Dashboard'

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Sidebar ── */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-sidebar',
        'transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-white/10 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/30">
            <School className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-sm font-bold text-white leading-tight">SIKHA</h2>
            <p className="text-[10px] text-slate-400 leading-tight">SDI Khadijah Sukorejo</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-0.5 mt-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="p-2.5 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary-light">{user?.nama?.charAt(0) || 'A'}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.nama || 'Admin'}</p>
              <p className="text-[10px] text-slate-400">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-border px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button className="lg:hidden shrink-0" variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} aria-label="Buka menu">
              <Menu className="w-4 h-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-text truncate">{pageTitle}</h1>
            </div>
          </div>

          {/* User menu */}
          <div ref={userMenuRef} className="relative shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-lg pl-2 pr-2.5"
              onClick={() => setUserMenuOpen(o => !o)}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
            >
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{user?.nama?.charAt(0) || 'A'}</span>
              </div>
              <span className="hidden sm:block text-xs font-medium text-text-secondary max-w-[100px] truncate">{user?.nama}</span>
              <ChevronDown className={cn('w-3.5 h-3.5 text-text-muted transition-transform', userMenuOpen && 'rotate-180')} />
            </Button>

            {userMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-52 rounded-xl border border-border bg-white py-1.5 shadow-dropdown animate-in">
                <div className="px-3.5 py-2 border-b border-border">
                  <p className="text-sm font-semibold text-text">{user?.nama}</p>
                  <p className="text-xs text-text-muted">Administrator</p>
                </div>
                <div className="pt-1.5 px-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    fullWidth
                    className="justify-start text-error hover:bg-error-bg hover:text-error"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Keluar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

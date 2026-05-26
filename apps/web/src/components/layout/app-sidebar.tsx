'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  MessagesSquare,
  BarChart2,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { RolUsuario, LABEL_ROL } from '@kings/shared'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles?: RolUsuario[]
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/citas', label: 'Citas', icon: CalendarDays },
  { href: '/ordenes', label: 'Órdenes de Trabajo', icon: ClipboardList },
  {
    href: '/control-calidad',
    label: 'Control de Calidad',
    icon: ShieldCheck,
    roles: [RolUsuario.CONTROL_CALIDAD, RolUsuario.ADMIN],
  },
  { href: '/mensajes', label: 'Mensajes', icon: MessagesSquare },
  {
    href: '/reportes',
    label: 'Reportes',
    icon: BarChart2,
    roles: [RolUsuario.ADMIN],
  },
  {
    href: '/config',
    label: 'Configuración',
    icon: Settings,
    roles: [RolUsuario.ADMIN],
  },
]

interface AppSidebarProps {
  user: {
    nombre: string
    email: string
    rol: RolUsuario
  }
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user.rol),
  )

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="flex items-center justify-center px-4 py-4 border-b border-border">
        <Image
          src="/logo-dark.jpeg"
          alt="Kings Auto Diagnósticos"
          width={180}
          height={90}
          priority
          className="rounded-lg"
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-secondary/20 text-secondary border border-secondary/20'
                  : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
              )}
            >
              <item.icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-secondary')} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-border p-4">
        <div className="mb-3 px-1">
          <p className="text-sm font-semibold text-foreground truncate">{user.nombre}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          <span className="mt-1 inline-block rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-accent border border-primary/20">
            {LABEL_ROL[user.rol]}
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

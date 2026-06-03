'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { Menu } from 'lucide-react'
import { AppSidebar } from './app-sidebar'
import type { RolUsuario } from '@kings/shared'

interface AppShellProps {
  user: { nombre: string; email: string; rol: RolUsuario }
  children: React.ReactNode
}

export function AppShell({ user, children }: AppShellProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <div className="flex h-screen h-dvh bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <AppSidebar user={user} />
      </div>

      {/* Mobile overlay */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex md:hidden">
            <AppSidebar user={user} onClose={() => setOpen(false)} />
          </div>
        </>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 h-14 px-4 border-b border-border bg-surface shrink-0 md:hidden">
          <button
            onClick={() => setOpen(true)}
            className="p-2 -ml-1 rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Image
            src="/logo-dark.jpeg"
            alt="Kings Auto"
            width={80}
            height={40}
            className="rounded object-contain"
          />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

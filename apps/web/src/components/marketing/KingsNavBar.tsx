'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/#servicios', label: 'Servicios' },
  { href: '/#nosotros', label: 'Nosotros' },
  { href: '/#galeria', label: 'Galería' },
  { href: '/#resenas', label: 'Reseñas' },
  { href: '/blog', label: 'Blog' },
  { href: '/#contacto', label: 'Contacto' },
]

const DEFAULT_TELEFONO = '+504 9999-9999'
const DEFAULT_WHATSAPP = '50499999999'

interface KingsNavBarProps {
  telefono?: string | null
  whatsapp?: string | null
}

export function KingsNavBar({ telefono, whatsapp }: KingsNavBarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const telefonoDisplay = telefono || DEFAULT_TELEFONO
  const waHref = `https://wa.me/${(whatsapp || DEFAULT_WHATSAPP).replace(/[^0-9]/g, '')}`

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    handler()
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <header
        className={cn(
          'fixed top-0 inset-x-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-white/97 backdrop-blur-md border-b border-gray-200 shadow-sm'
            : 'bg-white/95 backdrop-blur-sm border-b border-gray-100',
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo — siempre visible y prominente */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
            <div className="relative h-11 w-11 rounded-xl overflow-hidden border-2 border-[#1e3a8a]/30 shadow-md group-hover:border-[#00d4e8]/60 transition-colors bg-[#0f1a2e]">
              <Image
                src="/logo-dark.jpeg"
                alt="Kings Auto Diagnósticos"
                fill
                className="object-contain p-1"
                priority
              />
            </div>
            <div className="leading-tight">
              <span className="block text-base font-bold text-[#1e3a8a]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Kings Auto
              </span>
              <span className="block text-[10px] text-[#00bcd4] tracking-widest uppercase font-semibold">
                Diagnósticos
              </span>
            </div>
          </Link>

          {/* Links desktop */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                  pathname === '/blog' && l.href === '/blog'
                    ? 'text-[#1e3a8a] bg-[#1e3a8a]/8'
                    : 'text-gray-600 hover:text-[#1e3a8a] hover:bg-gray-100',
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* CTA desktop */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-[#1e3a8a] transition-colors hidden lg:block"
            >
              {telefonoDisplay}
            </a>
            <Link
              href="/reservar"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#1e3a8a] hover:bg-[#163070] transition-colors shadow-sm"
            >
              Agendar Cita
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Hamburger mobile */}
          <button
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors ml-auto"
            onClick={() => setOpen(v => !v)}
            aria-label="Menú"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Panel lateral mobile */}
      <div className={cn('fixed inset-0 z-40 lg:hidden transition-all duration-300', open ? 'visible' : 'invisible')}>
        <div
          className={cn('absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0')}
          onClick={() => setOpen(false)}
        />
        <div className={cn('absolute right-0 top-0 h-full w-72 bg-white border-l border-gray-200 shadow-2xl flex flex-col transition-transform duration-300', open ? 'translate-x-0' : 'translate-x-full')}>

          {/* Header del drawer */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-[#1e3a8a]/30 bg-[#0f1a2e]">
                <Image src="/logo-dark.jpeg" alt="Kings Auto" fill className="object-contain p-0.5" />
              </div>
              <span className="text-sm font-bold text-[#1e3a8a]" style={{ fontFamily: 'Orbitron, sans-serif' }}>Kings Auto</span>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 opacity-40" />
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="px-4 pb-8 pt-2 border-t border-gray-100 space-y-3">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm text-gray-600 border border-gray-200 hover:border-gray-300 transition-colors"
            >
              {telefonoDisplay}
            </a>
            <Link
              href="/reservar"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white bg-[#1e3a8a] hover:bg-[#163070] transition-colors"
            >
              Agendar Cita
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

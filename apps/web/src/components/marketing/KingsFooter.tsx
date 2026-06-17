import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'

const servicios = [
  { label: 'Diagnóstico Computarizado', href: '/servicios#diagnostico' },
  { label: 'Frenos y Suspensión', href: '/servicios#frenos' },
  { label: 'Motor y Transmisión', href: '/servicios#motor' },
  { label: 'Mantenimiento Preventivo', href: '/servicios#mantenimiento' },
  { label: 'Eléctrico Automotriz', href: '/servicios#electrico' },
]

const navegacion = [
  { label: 'Inicio', href: '/' },
  { label: 'Servicios', href: '/servicios' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Galería', href: '/galeria' },
  { label: 'Reseñas', href: '/resenas' },
  { label: 'Blog', href: '/blog' },
  { label: 'Agendar Cita', href: '/reservar' },
]

const DEFAULT_DIRECCION = 'Cofradía, Cortés, Honduras'
const DEFAULT_TELEFONO = '+504 9999-9999'
const DEFAULT_EMAIL = 'info@kingsauto.hn'

interface KingsFooterProps {
  direccion?: string | null
  telefono?: string | null
  email?: string | null
}

export function KingsFooter({ direccion, telefono, email }: KingsFooterProps) {
  const direccionDisplay = direccion || DEFAULT_DIRECCION
  const telefonoDisplay = telefono || DEFAULT_TELEFONO
  const emailDisplay = email || DEFAULT_EMAIL
  const telHref = `tel:${(telefono || DEFAULT_TELEFONO).replace(/[^0-9+]/g, '')}`

  return (
    <footer className="bg-[#0f1a2e] text-white relative overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-[#1e3a8a] via-[#00d4e8] to-[#1e3a8a]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">

          {/* Columna 1 — Marca */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-white/10 border border-white/20">
                <Image src="/logo-dark.jpeg" alt="Kings Auto" fill className="object-contain p-0.5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>Kings Auto</span>
                <span className="block text-[10px] text-[#00d4e8] tracking-widest uppercase">Diagnósticos</span>
              </div>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed mb-4">
              Centro de servicio automotriz en Cofradía, Cortés. Diagnóstico computarizado con seguimiento digital de tu vehículo.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="h-8 w-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-[#00d4e8] hover:border-[#00d4e8]/30 transition-colors" aria-label="Facebook">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" className="h-8 w-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-[#00d4e8] hover:border-[#00d4e8]/30 transition-colors" aria-label="Instagram">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            </div>
          </div>

          {/* Columna 2 — Servicios */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#00d4e8] mb-4">Servicios</h3>
            <ul className="space-y-2.5">
              {servicios.map(s => (
                <li key={s.href}>
                  <Link href={s.href} className="text-sm text-white/60 hover:text-white transition-colors">{s.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3 — Navegación */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#00d4e8] mb-4">Navegación</h3>
            <ul className="space-y-2.5">
              {navegacion.map(n => (
                <li key={n.href}>
                  <Link href={n.href} className="text-sm text-white/60 hover:text-white transition-colors">{n.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 4 — Contacto */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#00d4e8] mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-[#00d4e8] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white/60">{direccionDisplay}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-[#00d4e8] flex-shrink-0" />
                <a href={telHref} className="text-sm text-white/60 hover:text-white transition-colors">{telefonoDisplay}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[#00d4e8] flex-shrink-0" />
                <a href={`mailto:${emailDisplay}`} className="text-sm text-white/60 hover:text-white transition-colors">{emailDisplay}</a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-[#00d4e8] mt-0.5 flex-shrink-0" />
                <div className="text-sm text-white/60 space-y-0.5">
                  <p>Lun–Vie: 7:00am – 6:00pm</p>
                  <p>Sáb: 8:00am – 2:00pm</p>
                  <p>Dom: Cerrado</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">© {new Date().getFullYear()} Kings Auto Diagnósticos. Todos los derechos reservados.</p>
          <p className="text-xs text-white/30">Desarrollado con ❤️ en Honduras</p>
        </div>
      </div>
    </footer>
  )
}

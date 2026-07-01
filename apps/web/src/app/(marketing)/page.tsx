import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronRight, Wrench, Cpu, Radar, CircleDot,
  Droplet, Disc, MapPin, Phone, Clock, Award, BookOpen,
  ShieldCheck, Calendar, Star, Search,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { SeguimientoWidget } from '@/components/marketing/SeguimientoWidget'
import { GaleriaCarousel } from '@/components/marketing/GaleriaCarousel'
import { ResenaCard } from '@/components/marketing/ResenaCard'
import { HeroSlideshow } from '@/components/marketing/HeroSlideshow'
import { CardCarousel } from '@/components/marketing/CardCarousel'
import { Reveal } from '@/components/marketing/Reveal'

export const metadata: Metadata = {
  title: 'Kings Auto Diagnósticos — Cofradía, Cortés, Honduras',
  description: 'Centro de servicio automotriz con diagnóstico computarizado y seguimiento digital en tiempo real. Cofradía, Cortés.',
}

// Fotos de taller (Unsplash — uso libre)
const PHOTOS = {
  diagnostico: 'https://images.unsplash.com/photo-1727893380169-4dda123e19f7?w=1200&q=80&auto=format&fit=crop',
  radares: 'https://images.unsplash.com/photo-1764983253036-edd0f55af679?w=800&q=80&auto=format&fit=crop',
  mecanica: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=800&q=80&auto=format&fit=crop',
  alineacion: 'https://images.unsplash.com/photo-1616788902258-138db56fe7e5?w=800&q=80&auto=format&fit=crop',
  aceite: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&q=80&auto=format&fit=crop',
  frenos: 'https://images.unsplash.com/photo-1645445522156-9ac06bc7a767?w=1200&q=80&auto=format&fit=crop',
  taller: 'https://images.unsplash.com/photo-1643700973089-baa86a1ab9ee?w=1200&q=80&auto=format&fit=crop',
  elevador: 'https://images.unsplash.com/photo-1633863507928-9269584c50b0?w=1920&q=80&auto=format&fit=crop',
  tablero: 'https://images.unsplash.com/photo-1777286644467-2f2324150d9c?w=1920&q=80&auto=format&fit=crop',
  asesoria: 'https://images.unsplash.com/photo-1727893467393-24bc37e8a117?w=800&q=80&auto=format&fit=crop',
}

// Hero — vehículos de alto lujo + equipo de diagnóstico (Unsplash, uso libre)
const HERO_PHOTOS = [
  'https://images.unsplash.com/photo-1749639881040-a6eb9abb398e?w=1920&q=80&auto=format&fit=crop', // Mercedes-AMG GT, exterior nocturno
  'https://images.unsplash.com/photo-1727893380169-4dda123e19f7?w=1920&q=80&auto=format&fit=crop', // Escáner OBD conectado al vehículo
  'https://images.unsplash.com/photo-1745709575370-0e6b69fe4267?w=1920&q=80&auto=format&fit=crop', // Tablero digital de superdeportivo
  'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=1920&q=80&auto=format&fit=crop', // Mecánico con guantes reparando
  'https://images.unsplash.com/photo-1732347702185-368853f286ae?w=1920&q=80&auto=format&fit=crop', // Interior Mercedes-Maybach, tonos azul/cyan
]

const DIFERENCIADORES = [
  { icono: Award, titulo: 'Personal Certificado', descripcion: 'Entrenado y certificado por compañías líderes de la industria automotriz: Lear, Ford, General Motors, IATF y más.' },
  { icono: Cpu, titulo: 'Ingeniería Aplicada a tu Vehículo', descripcion: 'Nuestros procedimientos y procesos de reparación están basados en los principios de ingeniería del fabricante.' },
  { icono: BookOpen, titulo: 'Manuales de Fábrica', descripcion: 'Acceso a los manuales de diagnóstico y reparación oficiales de todos los fabricantes, lo cual garantiza que tu vehículo será restaurado de acuerdo a los requerimientos del fabricante.' },
  { icono: ShieldCheck, titulo: 'Control de Calidad', descripcion: 'Validación y control de calidad en cada reparación: garantizamos un trabajo certificado.' },
]

const DEFAULT_DIRECCION = 'Res. Montelimar, KM 24 Carretera hacia Occidente'
const DEFAULT_TELEFONO = '+504 9999-9999'
const DEFAULT_WHATSAPP = '50499999999'

export default async function HomePage() {
  const [galeria, resenasRaw, blogPosts, config] = await Promise.all([
    prisma.galeriaTrabajo.findMany({
      where: { activo: true },
      orderBy: [{ orden: 'asc' }, { createdAt: 'desc' }],
      take: 10,
      select: { id: true, url: true, descripcion: true, categoria: true },
    }),
    prisma.resena.findMany({
      where: { estado: 'APROBADA' },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, nombre: true, vehiculoMarca: true, vehiculoModelo: true, vehiculoAnio: true, calificacion: true, comentario: true, createdAt: true },
    }),
    prisma.blogPost.findMany({
      where: { estado: 'PUBLICADO' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, titulo: true, slug: true, extracto: true, categoria: true, imagenUrl: true, createdAt: true },
    }),
    prisma.configuracionTaller.findFirst({
      select: { direccion: true, telefono: true, whatsapp: true, horariosAtencion: true },
    }),
  ])

  const direccionDisplay = config?.direccion || DEFAULT_DIRECCION
  const telefonoDisplay = config?.telefono || DEFAULT_TELEFONO
  const waNumero = (config?.whatsapp || DEFAULT_WHATSAPP).replace(/[^0-9]/g, '')
  const telHref = `tel:${(config?.telefono || DEFAULT_TELEFONO).replace(/[^0-9+]/g, '')}`

  type HorarioDia = { dia: number; activo: boolean; apertura: string; cierre: string }
  const DEFAULT_HORARIOS: HorarioDia[] = [
    { dia: 0, activo: false, apertura: '08:00', cierre: '17:00' },
    { dia: 1, activo: true,  apertura: '08:00', cierre: '17:00' },
    { dia: 2, activo: true,  apertura: '08:00', cierre: '17:00' },
    { dia: 3, activo: true,  apertura: '08:00', cierre: '17:00' },
    { dia: 4, activo: true,  apertura: '08:00', cierre: '17:00' },
    { dia: 5, activo: true,  apertura: '08:00', cierre: '17:00' },
    { dia: 6, activo: true,  apertura: '08:00', cierre: '12:00' },
  ]
  const horarios: HorarioDia[] = Array.isArray(config?.horariosAtencion)
    ? (config.horariosAtencion as HorarioDia[])
    : DEFAULT_HORARIOS
  const fmtHora = (h: string) => {
    const [hStr, m] = h.split(':')
    const hNum = parseInt(hStr, 10)
    return `${hNum > 12 ? hNum - 12 : hNum === 0 ? 12 : hNum}:${m} ${hNum < 12 ? 'am' : 'pm'}`
  }
  const horLv  = horarios.find(h => h.dia === 1)
  const horSab = horarios.find(h => h.dia === 6)
  const horDom = horarios.find(h => h.dia === 0)

  const resenas = resenasRaw.map(r => ({
    id: r.id,
    nombre: r.nombre,
    vehiculo: [r.vehiculoMarca, r.vehiculoModelo, r.vehiculoAnio].filter(Boolean).join(' ') || undefined,
    calificacion: r.calificacion,
    comentario: r.comentario,
    fecha: r.createdAt.toISOString(),
  }))

  return (
    <div className="bg-white text-gray-900">

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-end overflow-hidden bg-[#0a1220]">

        {/* Slideshow de fondo — vehículos de alto lujo, rota automáticamente */}
        <HeroSlideshow images={HERO_PHOTOS} />

        {/* Overlays para legibilidad — más sutiles, dejan ver las fotos */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1220]/60 via-[#0a1220]/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1220]/85 via-transparent to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full pb-12 sm:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight drop-shadow-lg" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Kings Auto Diagnósticos
              <span className="block text-[#00d4e8]">Ingeniería Aplicada</span>
              a tu Auto
            </h1>
            <p className="text-base sm:text-lg text-white/75 leading-relaxed">
              Kings Auto Diagnósticos es un centro de servicio de diagnóstico y reparación automotriz. Nos especializamos en sistemas de diagnósticos eléctricos y electrónicos utilizando equipo de última generación. Nuestras reparaciones son realizadas de acuerdo con las especificaciones de los fabricantes.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SERVICIOS — BENTO GRID
      ══════════════════════════════════════════ */}
      <section id="servicios" className="py-24 px-4 sm:px-6 bg-gray-50 scroll-mt-16">
        <Reveal className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-semibold tracking-widest text-[#00d4e8] uppercase mb-3">Especialidades</p>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Nuestros Servicios
              </h2>
              <a href="#contacto" className="text-sm text-[#1e3a8a] font-medium hover:text-[#00d4e8] transition-colors flex items-center gap-1">
                Ver todos <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* BENTO — grid 3 cols: 01 ocupa 2×3, 02-07 son 1×1 simétricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

            {/* 01. DIAGNÓSTICO ELÉCTRICO Y ELECTRÓNICO — 2×3, el más grande */}
            <div className="sm:col-span-2 md:col-span-2 md:row-span-3 relative overflow-hidden rounded-2xl bg-[#0f1a2e] min-h-[320px] flex flex-col justify-between p-8 group cursor-default">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PHOTOS.diagnostico} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a2e]/90 via-[#0f1a2e]/40 to-transparent" />
              <div className="relative z-10">
                <span className="text-6xl font-bold text-white/8 leading-none" style={{ fontFamily: 'Orbitron, sans-serif' }}>01.</span>
                <div className="mt-4 h-12 w-12 rounded-xl bg-[#00d4e8]/15 border border-[#00d4e8]/30 flex items-center justify-center">
                  <Cpu className="h-6 w-6 text-[#00d4e8]" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mt-5 leading-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Diagnóstico Eléctrico<br />y Electrónico
                </h3>
                <p className="text-white/60 text-sm mt-3 leading-relaxed max-w-sm">
                  Reparación de sistemas eléctricos y electrónicos, programación de módulos utilizando el software y licencia del fabricante. Además, ofrecemos solución a tus necesidades de llaves para tu vehículo.
                </p>
              </div>
              <div className="relative z-10 mt-6">
                <Link href="/reservar" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00d4e8] text-[#0f1a2e] font-bold text-sm hover:bg-[#00bcd4] transition-colors">
                  Agendar <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* 02. CALIBRACIÓN DE RADARES — 1×1 */}
            <div className="relative overflow-hidden rounded-2xl bg-[#0f1a2e] min-h-[200px] flex flex-col p-6 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PHOTOS.radares} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a2e]/90 via-[#0f1a2e]/40 to-transparent" />
              <div className="relative z-10 flex flex-col h-full">
                <span className="text-4xl font-bold text-white/8 leading-none" style={{ fontFamily: 'Orbitron, sans-serif' }}>02.</span>
                <Radar className="h-8 w-8 text-[#00d4e8] mt-3" />
                <h3 className="text-lg font-bold text-white mt-3">Calibración de Radares</h3>
                <p className="text-xs text-white/60 mt-1 leading-relaxed flex-1">Ofrecemos el servicio más completo y confiable en diagnóstico, instalación y calibración de todos los sensores, radares y cámaras de los sistemas de asistencia ADAS.</p>
                <Link href="/reservar" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00d4e8] text-[#0f1a2e] font-bold text-xs mt-4 hover:bg-[#00bcd4] transition-colors self-start">
                  Agendar <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* 03. MECÁNICA RÁPIDA — 1×1 */}
            <div className="relative overflow-hidden rounded-2xl bg-[#0f1a2e] min-h-[200px] flex flex-col p-6 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PHOTOS.mecanica} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a2e]/90 via-[#0f1a2e]/40 to-transparent" />
              <div className="relative z-10 flex flex-col h-full">
                <span className="text-4xl font-bold text-white/8 leading-none" style={{ fontFamily: 'Orbitron, sans-serif' }}>03.</span>
                <Wrench className="h-8 w-8 text-[#00d4e8] mt-3" />
                <h3 className="text-lg font-bold text-white mt-3">Mecánica Rápida</h3>
                <p className="text-xs text-white/60 mt-1 leading-relaxed flex-1">Reparaciones y mantenimientos generales con atención ágil y confiable. Todas nuestras reparaciones son realizadas utilizando las especificaciones del fabricante.</p>
                <Link href="/reservar" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00d4e8] text-[#0f1a2e] font-bold text-xs mt-4 hover:bg-[#00bcd4] transition-colors self-start">
                  Agendar <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* 04. CAMBIO DE ACEITE — 1×1 */}
            <div className="relative overflow-hidden rounded-2xl bg-[#0f1a2e] min-h-[200px] flex flex-col p-6 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PHOTOS.aceite} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a2e]/90 via-[#0f1a2e]/40 to-transparent" />
              <div className="relative z-10 flex flex-col h-full">
                <span className="text-4xl font-bold text-white/8 leading-none" style={{ fontFamily: 'Orbitron, sans-serif' }}>04.</span>
                <Droplet className="h-8 w-8 text-[#00d4e8] mt-3" />
                <h3 className="text-lg font-bold text-white mt-3">Cambio de Aceite</h3>
                <p className="text-xs text-white/60 mt-1 leading-relaxed flex-1">Tu vehículo merece un mantenimiento preventivo de calidad. En Kings realizamos el cambio de aceite de manera profesional, cuidando cada detalle.</p>
                <Link href="/reservar" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00d4e8] text-[#0f1a2e] font-bold text-xs mt-4 hover:bg-[#00bcd4] transition-colors self-start">
                  Agendar <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* 05. ALINEAMIENTO Y BALANCEO — 1×1 */}
            <div className="relative overflow-hidden rounded-2xl bg-[#0f1a2e] min-h-[200px] flex flex-col p-6 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PHOTOS.alineacion} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a2e]/90 via-[#0f1a2e]/40 to-transparent" />
              <div className="relative z-10 flex flex-col h-full">
                <span className="text-4xl font-bold text-white/8 leading-none" style={{ fontFamily: 'Orbitron, sans-serif' }}>05.</span>
                <CircleDot className="h-8 w-8 text-[#00d4e8] mt-3" />
                <h3 className="text-lg font-bold text-white mt-3">Alineamiento y Balanceo</h3>
                <p className="text-xs text-white/60 mt-1 leading-relaxed flex-1">Nuestro servicio de alineamiento se realiza utilizando equipo con tecnología de punta, garantizando una conducción segura y mayor vida útil de tus neumáticos.</p>
                <Link href="/reservar" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00d4e8] text-[#0f1a2e] font-bold text-xs mt-4 hover:bg-[#00bcd4] transition-colors self-start">
                  Agendar <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* 06. RECTIFICACIÓN DE DISCOS Y FRENOS — 1×1 */}
            <div className="relative overflow-hidden rounded-2xl bg-[#0f1a2e] min-h-[200px] flex flex-col p-6 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PHOTOS.frenos} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a2e]/90 via-[#0f1a2e]/40 to-transparent" />
              <div className="relative z-10 flex flex-col h-full">
                <span className="text-4xl font-bold text-white/8 leading-none" style={{ fontFamily: 'Orbitron, sans-serif' }}>06.</span>
                <Disc className="h-8 w-8 text-[#00d4e8] mt-3" />
                <h3 className="text-lg font-bold text-white mt-3">Rectificación de Discos y Frenos</h3>
                <p className="text-xs text-white/60 mt-1 leading-relaxed flex-1">Servicio ofrecido al público general, incluyendo a talleres, utilizando equipo de última generación para rectificado de discos y tambores.</p>
                <Link href="/reservar" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00d4e8] text-[#0f1a2e] font-bold text-xs mt-4 hover:bg-[#00bcd4] transition-colors self-start">
                  Agendar <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* 07. ASESORÍA DE COMPRA — 1×1 */}
            <div className="relative overflow-hidden rounded-2xl bg-[#0f1a2e] min-h-[200px] flex flex-col p-6 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PHOTOS.asesoria} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a2e]/90 via-[#0f1a2e]/40 to-transparent" />
              <div className="relative z-10 flex flex-col h-full">
                <span className="text-4xl font-bold text-white/8 leading-none" style={{ fontFamily: 'Orbitron, sans-serif' }}>07.</span>
                <Search className="h-8 w-8 text-[#00d4e8] mt-3" />
                <h3 className="text-lg font-bold text-white mt-3">Asesoría de Compra</h3>
                <p className="text-xs text-white/60 mt-1 leading-relaxed flex-1">¿Pensando en comprar un vehículo usado? Te asesoramos con una inspección diagnóstica completa — revisamos el estado eléctrico, electrónico y mecánico para que tomes una decisión segura e informada.</p>
                <Link href="/reservar" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00d4e8] text-[#0f1a2e] font-bold text-xs mt-4 hover:bg-[#00bcd4] transition-colors self-start">
                  Agendar <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════
          SEGUIMIENTO
      ══════════════════════════════════════════ */}
      <section id="seguimiento" className="relative py-24 px-4 sm:px-6 border-y border-gray-100 scroll-mt-16 overflow-hidden">
        {/* Foto de fondo — tablero digital del vehículo, tenue */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PHOTOS.tablero} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-[#0a1220]/75" />
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(0,212,232,0.14), transparent 55%)' }} />

        <Reveal className="max-w-3xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest text-[#00d4e8] uppercase mb-3">Seguimiento en tiempo real</p>
            <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg" style={{ fontFamily: 'Orbitron, sans-serif' }}>¿Cómo va tu vehículo?</h2>
            <p className="text-white/60 text-sm leading-relaxed">Ingresa la placa para conocer el estado de tu cita o el avance de tu orden de trabajo.</p>
          </div>

          {/* Panel tipo vidrio — deja ver el tablero de fondo */}
          <div className="relative rounded-3xl bg-white/8 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/40 p-6 sm:p-10 overflow-hidden">
            {/* Grid técnico decorativo */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(#00d4e8 1px, transparent 1px), linear-gradient(90deg, #00d4e8 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
            <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-[#00d4e8]/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-[#1e3a8a]/20 blur-3xl pointer-events-none" />

            {/* Indicador "en vivo" */}
            <div className="relative z-10 flex items-center justify-center gap-2 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#00d4e8] opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00d4e8]" />
              </span>
              <span className="text-[10px] font-semibold tracking-widest uppercase text-[#00d4e8]/80">Sistema de seguimiento activo</span>
            </div>

            <div className="relative z-10">
              <SeguimientoWidget />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════
          GALERÍA
      ══════════════════════════════════════════ */}
      <section id="galeria" className="py-24 px-4 sm:px-6 bg-gray-50 scroll-mt-16">
        <Reveal className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <p className="text-xs font-semibold tracking-widest text-[#00d4e8] uppercase mb-3">Nuestro trabajo</p>
              <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Orbitron, sans-serif' }}>Galería de Trabajos</h2>
            </div>
            <Link href="/galeria" className="text-sm text-[#1e3a8a] font-medium hover:text-[#00d4e8] transition-colors flex items-center gap-1">
              Ver galería completa <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {galeria.length > 0 ? (
            <GaleriaCarousel items={galeria} showLink />
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white p-16 text-center">
              <p className="text-gray-400">Pronto publicaremos fotos de nuestros trabajos.</p>
            </div>
          )}
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════
          RESEÑAS
      ══════════════════════════════════════════ */}
      <section id="resenas" className="py-24 px-4 sm:px-6 bg-white border-t border-gray-100 scroll-mt-16">
        <Reveal className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <p className="text-xs font-semibold tracking-widest text-[#00d4e8] uppercase mb-3">Testimonios</p>
              <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Orbitron, sans-serif' }}>Lo que dicen nuestros clientes</h2>
            </div>
            <Link href="/resenas" className="text-sm text-[#1e3a8a] font-medium hover:text-[#00d4e8] transition-colors flex items-center gap-1">
              Ver todas las reseñas <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {resenas.length > 0 ? (
            <CardCarousel slideClassName="w-[280px] sm:w-[320px]">
              {resenas.map(r => (
                <ResenaCard key={r.id} nombre={r.nombre} vehiculo={r.vehiculo} calificacion={r.calificacion} comentario={r.comentario} fecha={r.fecha} />
              ))}
            </CardCarousel>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-16 text-center">
              <Star className="h-10 w-10 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">Aún no hay reseñas publicadas.</p>
              <Link href="/resenas#formulario" className="text-sm text-[#1e3a8a] hover:text-[#00d4e8] transition-colors">
                ¡Sé el primero en dejar la tuya →
              </Link>
            </div>
          )}
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════
          NOSOTROS
      ══════════════════════════════════════════ */}
      <section id="nosotros" className="py-24 px-4 sm:px-6 bg-gray-50 border-t border-gray-100 scroll-mt-16">
        <Reveal className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            {/* Foto + stats */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PHOTOS.taller}
                  alt="Taller Kings Auto Diagnósticos"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a2e]/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 px-4 py-3">
                    <div className="h-8 w-8 rounded-lg overflow-hidden bg-[#0f1a2e] border border-[#00d4e8]/30 flex-shrink-0 relative">
                      <Image src="/logo-dark.jpeg" alt="Kings Auto" fill className="object-contain p-0.5" />
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>Kings Auto Diagnósticos</p>
                      <p className="text-white/60 text-[10px]">{direccionDisplay}</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Stats flotantes */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {[
                  { valor: '15+', etiqueta: 'Años de operación' },
                  { valor: '100+', etiqueta: 'Vehículos por mes' },
                  { valor: '7', etiqueta: 'Especialidades' },
                  { valor: '4.8★', etiqueta: 'Calificación promedio' },
                ].map(stat => (
                  <div key={stat.etiqueta} className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
                    <p className="text-2xl font-bold text-[#1e3a8a]" style={{ fontFamily: 'Orbitron, sans-serif' }}>{stat.valor}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{stat.etiqueta}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Texto */}
            <div>
              <p className="text-xs font-semibold tracking-widest text-[#00d4e8] uppercase mb-3">Quiénes somos</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-5" style={{ fontFamily: 'Orbitron, sans-serif' }}>Sobre Nosotros</h2>
              <div className="space-y-4 text-gray-500 text-sm leading-relaxed mb-8">
                <p>Kings Auto Diagnósticos es un centro de diagnóstico y reparación automotriz innovador, que combina tecnología de punta con un servicio al cliente de clase mundial. Utilizamos las metodologías de solución de problemas aplicadas por los fabricantes (Six Sigma, Red X, 8D's, etc.).</p>
                <p>Contamos con un sistema digital de seguimiento desde su móvil que permite a nuestros clientes saber exactamente en qué etapa se encuentra su vehículo durante su permanencia en nuestras instalaciones.</p>
              </div>

              {/* Diferenciadores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DIFERENCIADORES.map(v => (
                  <div key={v.titulo} className="rounded-xl border border-gray-200 bg-white p-4 hover:border-[#1e3a8a]/30 hover:shadow-sm transition-all">
                    <div className="h-8 w-8 rounded-lg bg-[#1e3a8a]/8 border border-[#1e3a8a]/15 flex items-center justify-center text-[#1e3a8a] mb-3">
                      <v.icono className="h-4 w-4" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">{v.titulo}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{v.descripcion}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════
          BLOG PREVIEW
      ══════════════════════════════════════════ */}
      {blogPosts.length > 0 && (
        <section id="blog" className="py-24 px-4 sm:px-6 bg-white border-t border-gray-100 scroll-mt-16">
          <Reveal className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
              <div>
                <p className="text-xs font-semibold tracking-widest text-[#00d4e8] uppercase mb-3">Artículos</p>
                <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Orbitron, sans-serif' }}>Blog</h2>
              </div>
              <Link href="/blog" className="text-sm text-[#1e3a8a] font-medium hover:text-[#00d4e8] transition-colors flex items-center gap-1">
                Ver todos los artículos <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {blogPosts.map(post => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-[#1e3a8a]/30 hover:shadow-md transition-all flex flex-col"
                >
                  {post.imagenUrl ? (
                    <div className="relative h-44 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.imagenUrl} alt={post.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="h-44 bg-gradient-to-br from-[#1e3a8a] to-[#0f1a2e] flex items-center justify-center">
                      <span className="text-white/15 text-5xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>KA</span>
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col gap-2">
                    <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-[#1e3a8a] transition-colors line-clamp-2">{post.titulo}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 flex-1">{post.extracto}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-2 border-t border-gray-100">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.createdAt).toLocaleDateString('es-HN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* ══════════════════════════════════════════
          CONTACTO
      ══════════════════════════════════════════ */}
      <section id="contacto" className="py-24 px-4 sm:px-6 bg-gray-50 border-t border-gray-100 scroll-mt-16">
        <Reveal className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-[#00d4e8] uppercase mb-3">Encuéntranos</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>Visítanos</h2>
            <p className="text-gray-500 text-sm">Estamos ubicados en {direccionDisplay}. Agenda en línea o llámanos.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Info */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 space-y-6">
              {[
                { icon: MapPin, label: 'Dirección', content: direccionDisplay },
                { icon: Phone, label: 'Teléfono', content: telefonoDisplay, href: telHref },
                { icon: Clock, label: 'Horario', content: null },
              ].map(({ icon: Icon, label, content, href }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-[#1e3a8a]/8 border border-[#1e3a8a]/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-[#1e3a8a]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                    {label === 'Horario' ? (
                      <div className="text-sm space-y-0.5">
                        {horLv?.activo && (
                          <p className="text-gray-700">Lun – Vie: <span className="text-gray-500">{fmtHora(horLv.apertura)} – {fmtHora(horLv.cierre)}</span></p>
                        )}
                        <p className="text-gray-700">Sábado:{' '}{horSab?.activo ? <span className="text-gray-500">{fmtHora(horSab.apertura)} – {fmtHora(horSab.cierre)}</span> : <span className="text-red-500">Cerrado</span>}</p>
                        <p className="text-gray-700">Domingo:{' '}{horDom?.activo ? <span className="text-gray-500">{fmtHora(horDom.apertura)} – {fmtHora(horDom.cierre)}</span> : <span className="text-red-500">Cerrado</span>}</p>
                      </div>
                    ) : href ? (
                      <a href={href} className="text-gray-800 font-medium hover:text-[#1e3a8a] transition-colors text-sm">{content}</a>
                    ) : (
                      <p className="text-gray-800 font-medium text-sm">{content}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* WhatsApp */}
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-green-600" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">WhatsApp</p>
                  <a
                    href={`https://wa.me/${waNumero}?text=${encodeURIComponent('Hola Kings Auto, me gustaría consultar sobre sus servicios.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-800 font-medium hover:text-green-600 transition-colors text-sm"
                  >
                    Escríbenos directo
                  </a>
                </div>
              </div>

              <a href={`https://maps.google.com/?q=${encodeURIComponent(direccionDisplay)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#1e3a8a] hover:text-[#00d4e8] transition-colors pt-2">
                <MapPin className="h-4 w-4" />
                Ver en Google Maps
              </a>
            </div>

            {/* CTA */}
            <div className="rounded-2xl bg-gradient-to-br from-[#0f1a2e] to-[#1e3a8a] p-8 flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PHOTOS.diagnostico} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-10" />
              <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="h-16 w-16 rounded-full bg-[#00d4e8]/15 border border-[#00d4e8]/30 flex items-center justify-center">
                  <div className="relative h-10 w-10">
                    <Image src="/logo-dark.jpeg" alt="Kings Auto" fill className="object-contain" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>¿Listo para agendar?</h3>
                  <p className="text-white/60 text-sm leading-relaxed">Reserva tu cita en línea y te confirmamos por WhatsApp. Sin esperas innecesarias.</p>
                </div>
                <Link href="/reservar" className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-[#0f1a2e] font-bold text-sm bg-[#00d4e8] hover:bg-[#00bcd4] transition-colors w-full justify-center">
                  Agendar mi Cita Ahora
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <a
                  href={`https://wa.me/${waNumero}?text=${encodeURIComponent('Hola Kings Auto, me gustaría consultar sobre sus servicios.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold text-sm bg-green-500 hover:bg-green-400 transition-colors w-full justify-center"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  Escríbenos por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}

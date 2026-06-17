import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Target, Eye, Heart, ShieldCheck, Award, Cpu, BookOpen } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Nosotros',
  description: 'Kings Auto Diagnósticos es una cadena de centros de diagnóstico y reparación automotriz innovadores en Cofradía, Cortés, Honduras. Personal certificado, ingeniería aplicada y control de calidad.',
}

const DIFERENCIADORES = [
  { icono: Award, titulo: 'Personal Certificado', descripcion: 'Entrenado y certificado por compañías líderes de la industria automotriz: Lear, Ford, General Motors, IATF y más.' },
  { icono: Cpu, titulo: 'Ingeniería Aplicada', descripcion: 'Un concepto de ingeniería aplicada a tu vehículo, en lugar de taller tradicional.' },
  { icono: BookOpen, titulo: 'Manuales de Fábrica', descripcion: 'Acceso a los manuales de diagnóstico y reparación originales de todos los fabricantes.' },
  { icono: ShieldCheck, titulo: 'Control de Calidad', descripcion: 'Validación y control de calidad en cada reparación: garantizamos un trabajo certificado.' },
]

const VALORES = [
  { icono: ShieldCheck, titulo: 'Honestidad', descripcion: 'Diagnósticos transparentes y presupuestos claros. Solo hacemos el trabajo que tu vehículo realmente necesita.' },
  { icono: Target, titulo: 'Precisión', descripcion: 'Tecnología de diagnóstico computarizado para identificar fallas exactas y evitar reparaciones innecesarias.' },
  { icono: Heart, titulo: 'Compromiso', descripcion: 'Tu satisfacción es nuestra prioridad. Seguimos el proceso hasta que tu vehículo quede en perfectas condiciones.' },
  { icono: Eye, titulo: 'Transparencia', descripcion: 'Seguimiento digital en tiempo real para que siempre sepas qué está pasando con tu vehículo.' },
]

export default function NosotrosPage() {
  return (
    <div className="bg-white text-gray-900 pt-16">
      {/* Hero */}
      <section className="relative py-24 px-4 sm:px-6 overflow-hidden bg-gradient-to-br from-[#0f1a2e] to-[#1e3a8a]">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #00d4e8, transparent 60%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest text-[#00d4e8] uppercase mb-3">Quiénes somos</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'Orbitron, sans-serif' }}>Sobre Nosotros</h1>
          <p className="text-white/70 leading-relaxed text-lg">Más de 15 años brindando servicio automotriz de calidad con tecnología y honestidad en el corazón de Cofradía, Cortés.</p>
        </div>
      </section>

      {/* Historia */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold tracking-widest text-[#00d4e8] uppercase mb-3">Nuestra historia</p>
              <h2 className="text-2xl font-bold text-gray-900 mb-5" style={{ fontFamily: 'Orbitron, sans-serif' }}>De taller a centro de servicio digital</h2>
              <div className="space-y-4 text-gray-500 text-sm leading-relaxed">
                <p>Kings Auto Diagnósticos es una cadena de centros de diagnóstico y reparación automotriz innovadores, que combina tecnología de punta con un servicio al cliente de clase mundial — diferenciándonos de cualquier taller existente en el país.</p>
                <p>Hoy somos el centro de servicio de referencia en la zona, con un sistema digital de seguimiento que permite a nuestros clientes saber exactamente en qué fase está su vehículo, en tiempo real, desde su teléfono.</p>
                <p>Cada orden de trabajo pasa por un proceso estructurado: diagnóstico, reparación, control de calidad y entrega. Nada se entrega sin pasar nuestro estándar de calidad.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { valor: '15+', etiqueta: 'Años de operación' },
                { valor: '100+', etiqueta: 'Vehículos por mes' },
                { valor: '6', etiqueta: 'Especialidades' },
                { valor: '4.8★', etiqueta: 'Calificación promedio' },
              ].map(stat => (
                <div key={stat.etiqueta} className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                  <p className="text-2xl font-bold text-[#1e3a8a] mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>{stat.valor}</p>
                  <p className="text-xs text-gray-500">{stat.etiqueta}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Diferenciadores */}
      <section className="py-20 px-4 sm:px-6 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-[#00d4e8] uppercase mb-3">Lo que nos distingue</p>
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Orbitron, sans-serif' }}>Por Qué Somos Diferentes</h2>
            <p className="text-gray-500 text-sm mt-3 max-w-xl mx-auto leading-relaxed">
              Los aspectos principales que nos diferencian de cualquier taller existente en el país.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DIFERENCIADORES.map(d => (
              <div key={d.titulo} className="rounded-xl border border-gray-200 bg-gray-50 p-6 hover:border-[#1e3a8a]/30 hover:shadow-md transition-all">
                <div className="h-10 w-10 rounded-lg bg-[#1e3a8a]/8 border border-[#1e3a8a]/15 flex items-center justify-center text-[#1e3a8a] mb-4">
                  <d.icono className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{d.titulo}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{d.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Misión y Visión */}
      <section className="py-16 px-4 sm:px-6 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8">
            <div className="h-10 w-10 rounded-lg bg-[#1e3a8a]/8 border border-[#1e3a8a]/15 flex items-center justify-center mb-5">
              <Target className="h-5 w-5 text-[#1e3a8a]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Misión</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Brindar servicio automotriz de excelencia con tecnología de diagnóstico computarizado, garantizando reparaciones precisas, transparentes y con seguimiento digital en tiempo real para la tranquilidad total de nuestros clientes.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8">
            <div className="h-10 w-10 rounded-lg bg-[#1e3a8a]/8 border border-[#1e3a8a]/15 flex items-center justify-center mb-5">
              <Eye className="h-5 w-5 text-[#1e3a8a]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Visión</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Ser el centro de servicio automotriz de referencia en Cortés, reconocido por la precisión de sus diagnósticos, la calidad de sus reparaciones y por llevar la transparencia digital al servicio mecánico de Honduras.</p>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-[#00d4e8] uppercase mb-3">Lo que nos define</p>
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Orbitron, sans-serif' }}>Nuestros Valores</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {VALORES.map(v => (
              <div key={v.titulo} className="rounded-xl border border-gray-200 bg-white p-6 hover:border-[#1e3a8a]/30 hover:shadow-md transition-all">
                <div className="h-10 w-10 rounded-lg bg-[#1e3a8a]/8 border border-[#1e3a8a]/15 flex items-center justify-center text-[#1e3a8a] mb-4">
                  <v.icono className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{v.titulo}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-[#0f1a2e] to-[#1e3a8a]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>¿Listo para experimentarlo?</h2>
          <p className="text-white/60 text-sm mb-8">Agenda tu cita y descubre la diferencia de un diagnóstico con tecnología.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/reservar" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[#0f1a2e] font-bold bg-[#00d4e8] hover:bg-[#00bcd4] transition-colors">
              Agendar Cita <ChevronRight className="h-4 w-4" />
            </Link>
            <Link href="/servicios" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white border border-white/20 hover:border-white/40 hover:bg-white/5 transition-colors">
              Ver Servicios
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Cpu, Wrench, CircleDot, CheckCircle2 } from 'lucide-react'
import { OilCanIcon, BrakeWarningIcon, AdasRadarIcon } from '@/components/marketing/DashboardIcons'

export const metadata: Metadata = {
  title: 'Servicios',
  description:
    'Diagnóstico eléctrico y electrónico, programación de módulos y llaves, calibración de radares, mecánica rápida, alineamiento y balanceo, cambio de aceite y rectificación de discos y frenos.',
}

const SERVICIOS = [
  {
    id: 'diagnostico',
    icono: Cpu,
    nombre: 'Diagnóstico Eléctrico y Electrónico',
    descripcion:
      'Identificamos y reparamos fallas en los sistemas eléctricos y electrónicos de tu vehículo. Además, programamos módulos y llaves con equipo especializado.',
    items: [
      'Diagnóstico y reparación de sistemas eléctricos',
      'Diagnóstico y reparación de sistemas electrónicos',
      'Programación de módulos',
      'Programación de llaves',
    ],
  },
  {
    id: 'radares',
    icono: AdasRadarIcon,
    nombre: 'Calibración de Radares',
    descripcion:
      'Calibramos los sensores y cámaras de los sistemas de asistencia al conductor (ADAS) para que funcionen con la precisión de fábrica tras un cambio de parabrisas, alineación o reparación.',
    items: [
      'Calibración de radar de crucero adaptativo',
      'Calibración de cámaras de asistencia al manejo',
      'Verificación post-reparación de sensores',
    ],
  },
  {
    id: 'mecanica-rapida',
    icono: Wrench,
    nombre: 'Mecánica Rápida',
    descripcion:
      'Servicios mecánicos generales con atención ágil, ideales para reparaciones y mantenimientos menores sin perder tiempo.',
    items: [
      'Revisiones y reparaciones generales',
      'Atención rápida sin cita previa',
      'Repuestos de calidad garantizada',
    ],
  },
  {
    id: 'alineamiento',
    icono: CircleDot,
    nombre: 'Alineamiento y Balanceo',
    descripcion:
      'Alineación computarizada y balanceo de llantas para un manejo seguro, uniforme y mayor vida útil de tus neumáticos.',
    items: [
      'Alineación computarizada de las 4 ruedas',
      'Balanceo de llantas',
      'Revisión de desgaste irregular',
    ],
  },
  {
    id: 'aceite',
    icono: OilCanIcon,
    nombre: 'Cambio de Aceite',
    descripcion:
      'Cambio de aceite y filtro con productos de calidad, siguiendo las especificaciones del fabricante de tu vehículo.',
    items: [
      'Aceite sintético, semisintético o mineral',
      'Cambio de filtro de aceite',
      'Revisión de niveles y fluidos',
    ],
  },
  {
    id: 'frenos',
    icono: BrakeWarningIcon,
    nombre: 'Rectificación de Discos y Frenos',
    descripcion:
      'Rectificación de discos y reparación completa del sistema de frenos para garantizar tu seguridad en cada frenada.',
    items: [
      'Rectificación de discos de freno',
      'Cambio de pastillas / balatas',
      'Revisión de líquido de frenos',
    ],
  },
]

export default function ServiciosPage() {
  return (
    <div className="bg-white text-gray-900 pt-16">
      {/* Header */}
      <section className="relative py-20 px-4 sm:px-6 overflow-hidden bg-gradient-to-br from-[#0f1a2e] to-[#1e3a8a]">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #00d4e8, transparent 60%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest text-[#00d4e8] uppercase mb-3">Especialidades</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Nuestros Servicios
          </h1>
          <p className="text-white/70 leading-relaxed text-lg">
            Soluciones completas para el cuidado de tu vehículo con tecnología de diagnóstico computarizado
            y técnicos especializados en Cofradía, Cortés.
          </p>
        </div>
      </section>

      {/* Lista de servicios */}
      <section className="py-16 pb-24 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto space-y-6">
          {SERVICIOS.map((s, i) => (
            <div
              key={s.id}
              id={s.id}
              className="group rounded-2xl border border-gray-200 bg-white p-8 hover:border-[#1e3a8a]/30 hover:shadow-md transition-all scroll-mt-24"
            >
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-[#1e3a8a]/8 border border-[#1e3a8a]/15 flex items-center justify-center text-[#1e3a8a] group-hover:bg-[#1e3a8a] group-hover:text-white transition-colors">
                  <s.icono className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-mono text-gray-300">0{i + 1}</span>
                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-[#1e3a8a] transition-colors">
                      {s.nombre}
                    </h2>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed mb-5">{s.descripcion}</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {s.items.map(item => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-[#00d4e8] flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-[#0f1a2e] to-[#1e3a8a]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            ¿Listo para comenzar?
          </h2>
          <p className="text-white/60 text-sm mb-8 leading-relaxed">
            Agenda tu cita en línea y recibe confirmación por WhatsApp. Sin colas, sin esperas.
          </p>
          <Link
            href="/reservar"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[#0f1a2e] font-bold bg-[#00d4e8] hover:bg-[#00bcd4] transition-colors"
          >
            Agendar Cita
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}

import { cn } from '@/lib/utils'

interface ServicioCardProps {
  icono: React.ReactNode
  nombre: string
  descripcion: string
  className?: string
}

export function ServicioCard({ icono, nombre, descripcion, className }: ServicioCardProps) {
  return (
    <div
      className={cn(
        'group relative rounded-xl border border-[#1a2540] bg-[#0f1520] p-6 transition-all duration-300',
        'hover:border-[#00d4e8]/40 hover:bg-[#0f1520] hover:shadow-lg hover:shadow-[#00d4e8]/5',
        className,
      )}
    >
      {/* Glow sutil al hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-[#00d4e8]/3 to-transparent pointer-events-none" />

      {/* Ícono */}
      <div className="relative mb-4 h-12 w-12 rounded-lg bg-[#1a3a6b]/30 border border-[#1a3a6b]/50 flex items-center justify-center text-[#00d4e8] group-hover:border-[#00d4e8]/40 transition-colors">
        {icono}
      </div>

      {/* Contenido */}
      <h3 className="relative text-base font-semibold text-white mb-2 group-hover:text-[#00d4e8] transition-colors">
        {nombre}
      </h3>
      <p className="relative text-sm text-[#6b7a99] leading-relaxed">
        {descripcion}
      </p>

      {/* Línea decorativa */}
      <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#00d4e8]/0 to-transparent group-hover:via-[#00d4e8]/30 transition-all duration-300" />
    </div>
  )
}

import Image from 'next/image'
import Link from 'next/link'
import { ZoomIn, ChevronRight } from 'lucide-react'
import { CardCarousel } from './CardCarousel'

interface GaleriaItem {
  id: string
  url: string
  descripcion: string | null
  categoria: string | null
}

const CATEGORIA_LABEL: Record<string, string> = {
  FRENOS: 'Frenos',
  MOTOR: 'Motor',
  DIAGNOSTICO: 'Diagnóstico',
  ELECTRICO: 'Eléctrico',
  MANTENIMIENTO: 'Mantenimiento',
  OTRO: 'Otro',
}

interface GaleriaCarouselProps {
  items: GaleriaItem[]
  showLink?: boolean
}

export function GaleriaCarousel({ items, showLink = false }: GaleriaCarouselProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-400 text-sm">Pronto publicaremos fotos de nuestros trabajos.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <CardCarousel slideClassName="w-[240px] sm:w-[300px]" autoPlayMs={3500}>
        {items.map((item, idx) => (
          <div key={item.id} className="relative aspect-[4/5] overflow-hidden rounded-2xl group">
            <Image
              src={item.url}
              alt={item.descripcion ?? `Trabajo ${idx + 1}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 240px, 300px"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/10">
              <div className="h-10 w-10 rounded-full bg-[#00d4e8]/20 border border-[#00d4e8]/40 backdrop-blur-sm flex items-center justify-center">
                <ZoomIn className="h-4 w-4 text-[#00d4e8]" />
              </div>
            </div>
            {(item.categoria || item.descripcion) && (
              <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-1 bg-gradient-to-t from-[#0a0a0c]/85 via-[#0a0a0c]/35 to-transparent">
                {item.categoria && (
                  <span className="self-start text-[10px] font-semibold text-[#00d4e8] bg-[#0a0a0c]/70 border border-[#00d4e8]/30 px-2 py-0.5 rounded-full">
                    {CATEGORIA_LABEL[item.categoria] ?? item.categoria}
                  </span>
                )}
                {item.descripcion && (
                  <p className="text-xs text-white/90 line-clamp-2">{item.descripcion}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </CardCarousel>

      {showLink && (
        <div className="text-center pt-2">
          <Link
            href="/galeria"
            className="inline-flex items-center gap-1 text-sm text-[#1e3a8a] font-medium hover:text-[#00d4e8] transition-colors"
          >
            Ver galería completa <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}

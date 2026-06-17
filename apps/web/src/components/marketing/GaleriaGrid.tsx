import Image from 'next/image'
import Link from 'next/link'
import { ZoomIn } from 'lucide-react'

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

interface GaleriaGridProps {
  items: GaleriaItem[]
  showLink?: boolean
}

// Spans predefinidos para el grid asimétrico (se repiten)
const SPANS = [
  'col-span-2 row-span-2',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-2 row-span-1',
  'col-span-1 row-span-1',
]

export function GaleriaGrid({ items, showLink = false }: GaleriaGridProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-400 text-sm">Pronto publicaremos fotos de nuestros trabajos.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        className="grid grid-cols-3 gap-3 auto-rows-[160px] sm:auto-rows-[200px]"
      >
        {items.slice(0, 6).map((item, idx) => (
          <div
            key={item.id}
            className={`relative overflow-hidden rounded-xl group ${SPANS[idx % SPANS.length]}`}
          >
            <Image
              src={item.url}
              alt={item.descripcion ?? `Trabajo ${idx + 1}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
            {/* Ícono zoom — solo en hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/10">
              <div className="h-10 w-10 rounded-full bg-[#00d4e8]/20 border border-[#00d4e8]/40 backdrop-blur-sm flex items-center justify-center">
                <ZoomIn className="h-4 w-4 text-[#00d4e8]" />
              </div>
            </div>
            {/* Categoría + descripción — siempre visibles */}
            {(item.categoria || item.descripcion) && (
              <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-1 bg-gradient-to-t from-[#0a0a0c]/85 via-[#0a0a0c]/35 to-transparent">
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
      </div>

      {showLink && items.length >= 4 && (
        <div className="text-center pt-2">
          <Link
            href="/galeria"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#1a2540] text-sm text-[#a8b4cc] hover:border-[#00d4e8]/30 hover:text-[#00d4e8] transition-colors"
          >
            Ver galería completa
          </Link>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { ZoomIn } from 'lucide-react'
import { Lightbox } from '@/components/marketing/Lightbox'

type Categoria = 'FRENOS' | 'MOTOR' | 'DIAGNOSTICO' | 'ELECTRICO' | 'MANTENIMIENTO' | 'OTRO'

interface GaleriaItem {
  id: string
  url: string
  descripcion: string | null
  categoria: string | null
}

const CATEGORIAS: { key: Categoria | 'TODAS'; label: string }[] = [
  { key: 'TODAS', label: 'Todas' },
  { key: 'DIAGNOSTICO', label: 'Diagnóstico' },
  { key: 'MOTOR', label: 'Motor' },
  { key: 'FRENOS', label: 'Frenos' },
  { key: 'ELECTRICO', label: 'Eléctrico' },
  { key: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { key: 'OTRO', label: 'Otros' },
]

export default function GaleriaPage() {
  const [items, setItems] = useState<GaleriaItem[]>([])
  const [filtro, setFiltro] = useState<Categoria | 'TODAS'>('TODAS')
  const [loading, setLoading] = useState(true)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    const url = filtro === 'TODAS'
      ? '/api/public/galeria?limit=50'
      : `/api/public/galeria?limit=50&categoria=${filtro}`
    fetch(url)
      .then(r => r.json())
      .then(data => { setItems(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filtro])

  const lightboxImages = items.map(i => ({ url: i.url, descripcion: i.descripcion }))

  const handlePrev = useCallback(() => {
    setLightboxIdx(i => (i === null ? null : (i - 1 + items.length) % items.length))
  }, [items.length])

  const handleNext = useCallback(() => {
    setLightboxIdx(i => (i === null ? null : (i + 1) % items.length))
  }, [items.length])

  return (
    <div className="bg-white text-gray-900 pt-16 min-h-screen">
      {/* Header */}
      <section className="relative py-20 px-4 sm:px-6 overflow-hidden bg-gradient-to-br from-[#0f1a2e] to-[#1e3a8a]">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #00d4e8, transparent 60%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest text-[#00d4e8] uppercase mb-3">Portfolio</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Galería de Trabajos
          </h1>
          <p className="text-white/70 leading-relaxed text-lg">
            Una muestra de los trabajos realizados en nuestro centro de servicio.
            Cada reparación con el mismo estándar de calidad.
          </p>
        </div>
      </section>

      {/* Filtros */}
      <section className="px-4 sm:px-6 py-6 border-b border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-2 justify-center">
          {CATEGORIAS.map(c => (
            <button
              key={c.key}
              onClick={() => setFiltro(c.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtro === c.key
                  ? 'bg-[#1e3a8a] text-white'
                  : 'border border-gray-200 text-gray-500 hover:border-[#1e3a8a]/30 hover:text-[#1e3a8a] bg-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 px-4 sm:px-6 pb-24 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-gray-200 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white p-16 text-center">
              <p className="text-gray-400">Pronto publicaremos fotos de nuestros trabajos.</p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="relative overflow-hidden rounded-xl group cursor-pointer break-inside-avoid"
                  onClick={() => setLightboxIdx(idx)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.descripcion ?? `Trabajo ${idx + 1}`}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/10">
                    <div className="h-10 w-10 rounded-full bg-[#00d4e8]/20 border border-[#00d4e8]/40 backdrop-blur-sm flex items-center justify-center">
                      <ZoomIn className="h-4 w-4 text-[#00d4e8]" />
                    </div>
                  </div>
                  {item.descripcion && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-[#0a0a0c]/85 via-[#0a0a0c]/35 to-transparent">
                      <p className="text-xs text-white/90 line-clamp-2">{item.descripcion}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          images={lightboxImages}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
    </div>
  )
}

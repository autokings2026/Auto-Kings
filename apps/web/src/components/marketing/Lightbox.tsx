'use client'

import { useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface LightboxProps {
  images: { url: string; descripcion?: string | null }[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export function Lightbox({ images, index, onClose, onPrev, onNext }: LightboxProps) {
  const current = images[index]

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    },
    [onClose, onPrev, onNext],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [handleKey])

  if (!current) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Click fuera para cerrar */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Botón cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Navegación prev */}
      {images.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); onPrev() }}
          className="absolute left-4 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Imagen */}
      <div className="relative z-10 max-w-5xl max-h-[90vh] w-full mx-16 flex flex-col items-center gap-3">
        <div className="relative w-full" style={{ maxHeight: '80vh' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.url}
            alt={current.descripcion ?? ''}
            className="max-h-[80vh] max-w-full mx-auto rounded-xl object-contain"
          />
        </div>
        {current.descripcion && (
          <p className="text-sm text-[#a8b4cc] text-center px-4">{current.descripcion}</p>
        )}
        <p className="text-xs text-[#6b7a99]">{index + 1} / {images.length}</p>
      </div>

      {/* Navegación next */}
      {images.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); onNext() }}
          className="absolute right-4 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}

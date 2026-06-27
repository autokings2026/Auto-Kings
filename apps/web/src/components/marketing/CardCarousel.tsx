'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CardCarouselProps {
  children: ReactNode[]
  slideClassName?: string
  className?: string
  autoPlayMs?: number
}

export function CardCarousel({ children, slideClassName = 'w-[260px] sm:w-[300px]', className = '', autoPlayMs }: CardCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [paused, setPaused] = useState(false)

  const updateArrows = () => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 8)
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }

  useEffect(() => {
    updateArrows()
    const el = trackRef.current
    if (!el) return
    el.addEventListener('scroll', updateArrows, { passive: true })
    window.addEventListener('resize', updateArrows)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
  }, [])

  const scrollByCard = useCallback((dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-card]')
    const amount = card ? card.offsetWidth + 16 : el.clientWidth * 0.8
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (!autoPlayMs || paused) return
    const id = setInterval(() => {
      const el = trackRef.current
      if (!el) return
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 8
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        scrollByCard(1)
      }
    }, autoPlayMs)
    return () => clearInterval(id)
  }, [autoPlayMs, paused, scrollByCard])

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-1 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {children.map((child, i) => (
          <div key={i} data-card className={`snap-start flex-shrink-0 ${slideClassName}`}>
            {child}
          </div>
        ))}
      </div>

      {canPrev && (
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          aria-label="Anterior"
          className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-600 hover:text-[#1e3a8a] hover:border-[#1e3a8a]/30 transition-colors z-10"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {canNext && (
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          aria-label="Siguiente"
          className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-600 hover:text-[#1e3a8a] hover:border-[#1e3a8a]/30 transition-colors z-10"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

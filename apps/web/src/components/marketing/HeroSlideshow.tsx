'use client'

import { useEffect, useState } from 'react'

interface HeroSlideshowProps {
  images: string[]
  intervalMs?: number
}

const TRANSITION_MS = 1000

export function HeroSlideshow({ images, intervalMs = 6000 }: HeroSlideshowProps) {
  const hasMultiple = images.length > 1
  const slides = hasMultiple ? [...images, images[0]] : images

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [noTransition, setNoTransition] = useState(false)

  // Avanza el slide cada `intervalMs`, deslizando hacia la derecha
  useEffect(() => {
    if (paused || !hasMultiple) return
    const id = setInterval(() => setIndex(i => i + 1), intervalMs)
    return () => clearInterval(id)
  }, [paused, hasMultiple, intervalMs])

  // Al llegar al clon del primer slide, salta de vuelta al inicio sin transición (loop infinito)
  useEffect(() => {
    if (!hasMultiple || index !== slides.length - 1) return
    const timeout = setTimeout(() => {
      setNoTransition(true)
      setIndex(0)
    }, TRANSITION_MS)
    return () => clearTimeout(timeout)
  }, [index, hasMultiple, slides.length])

  useEffect(() => {
    if (!noTransition) return
    const raf = requestAnimationFrame(() => setNoTransition(false))
    return () => cancelAnimationFrame(raf)
  }, [noTransition])

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={`absolute inset-0 flex h-full ${noTransition ? '' : 'transition-transform duration-1000 ease-in-out'}`}
        style={{
          width: `${slides.length * 100}%`,
          transform: `translateX(-${index * (100 / slides.length)}%)`,
        }}
      >
        {slides.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${i}`}
            src={src}
            alt=""
            aria-hidden
            className="h-full object-cover flex-shrink-0"
            style={{ width: `${100 / slides.length}%` }}
          />
        ))}
      </div>
    </div>
  )
}

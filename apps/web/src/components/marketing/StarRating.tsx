'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (val: number) => void
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
}

const sizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' }

export function StarRating({ value, onChange, size = 'md', readonly = false }: StarRatingProps) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={cn(
            'transition-transform',
            !readonly && 'hover:scale-110 cursor-pointer',
            readonly && 'cursor-default',
          )}
          aria-label={`${star} estrellas`}
        >
          <svg
            viewBox="0 0 24 24"
            className={cn(sizes[size], 'transition-colors')}
            fill={(hover || value) >= star ? '#f59e0b' : 'none'}
            stroke={(hover || value) >= star ? '#f59e0b' : '#374151'}
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        </button>
      ))}
    </div>
  )
}

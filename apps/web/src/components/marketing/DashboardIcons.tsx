import type { SVGProps } from 'react'

/** Testigo de presión de aceite (aceitera con tapa, boquilla y gota) */
export function OilCanIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2.5" y="11.5" width="3.5" height="4" rx="1" />
      <rect x="6" y="9.5" width="8" height="7.5" rx="1.3" />
      <path d="M9.5 9.5V7.3" />
      <path d="M8.3 7.3h2.4" />
      <path d="M14 10.5 19.3 5.3" />
      <path d="M19.5 9.3c-1 0-1.8-.8-1.8-1.8 0-1.2 1.8-3.4 1.8-3.4s1.8 2.2 1.8 3.4c0 1-.8 1.8-1.8 1.8z" />
    </svg>
  )
}

/** Testigo del sistema de frenos (círculo con "!" y ondas laterales, símbolo ISO) */
export function BrakeWarningIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="6" />
      <path d="M7 6.5 Q3.5 12 7 17.5" />
      <path d="M17 6.5 Q20.5 12 17 17.5" />
      <line x1="12" y1="9" x2="12" y2="13.3" />
      <circle cx="12" cy="15.3" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Testigo de radar / ADAS (vehículo visto desde arriba con ondas de sensor a ambos lados) */
export function AdasRadarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="9" y="4" width="6" height="16" rx="3" />
      <rect x="10.3" y="6.5" width="3.4" height="4" rx="1" />
      <line x1="9" y1="10" x2="7.7" y2="10" />
      <line x1="15" y1="10" x2="16.3" y2="10" />
      <path d="M6.3 8 Q4.3 12 6.3 16" />
      <path d="M4 6.5 Q1 12 4 17.5" />
      <path d="M17.7 8 Q19.7 12 17.7 16" />
      <path d="M20 6.5 Q23 12 20 17.5" />
    </svg>
  )
}

import type { SVGProps } from 'react'

/** Testigo de presión de aceite (icono de tablero: aceitera + gota) */
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
      <rect x="3.5" y="9.5" width="11" height="7.5" rx="1.5" />
      <path d="M14.5 11 L19.5 6" />
      <path d="M17.5 6h2.5v2.5" />
      <path d="M9 20.5c-1.1 0-2-.9-2-2 0-1.3 2-3.7 2-3.7s2 2.4 2 3.7c0 1.1-.9 2-2 2z" />
    </svg>
  )
}

/** Testigo del sistema de frenos (icono de tablero: círculo con "(!)") */
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
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 7.5c-1.6 2.2-1.6 7.1 0 9.3" />
      <path d="M15.5 7.5c1.6 2.2 1.6 7.1 0 9.3" />
      <line x1="12" y1="7.8" x2="12" y2="13.5" />
      <circle cx="12" cy="16.3" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Testigo de radar / ADAS (icono de tablero: vehículo con ondas de sensor) */
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
      <path d="M8.5 14.5 10 11h4l1.5 3.5" />
      <rect x="5.5" y="14.5" width="13" height="4.5" rx="1.8" />
      <circle cx="8.3" cy="19.3" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.7" cy="19.3" r="1.1" fill="currentColor" stroke="none" />
      <path d="M9.5 8.3c1.6-1.5 3.4-1.5 5 0" />
      <path d="M7.8 5.8c2.7-2.4 5.7-2.4 8.4 0" />
    </svg>
  )
}

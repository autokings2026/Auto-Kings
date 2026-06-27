import { StarRating } from './StarRating'

interface ResenaCardProps {
  nombre: string
  vehiculo?: string
  calificacion: number
  comentario: string
  fecha: string
  fuente?: 'manual' | 'encuesta'
}

function getInitials(nombre: string) {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

function getAvatarColor(nombre: string) {
  const colors = [
    'bg-[#1a3a6b]',
    'bg-[#1e6eb5]',
    'bg-[#0e4f8a]',
    'bg-[#164e8c]',
    'bg-[#0a4b7a]',
  ]
  let hash = 0
  for (const ch of nombre) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return colors[Math.abs(hash) % colors.length]
}

export function ResenaCard({ nombre, vehiculo, calificacion, comentario, fecha }: ResenaCardProps) {
  const initials = getInitials(nombre)
  const avatarColor = getAvatarColor(nombre)
  const date = new Date(fecha).toLocaleDateString('es-HN', { month: 'long', year: 'numeric' })

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-3 hover:border-[#1e3a8a]/30 hover:shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-full ${avatarColor} flex items-center justify-center flex-shrink-0`}>
          <span className="text-sm font-bold text-white">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{nombre}</p>
          {vehiculo && (
            <p className="text-xs text-gray-400 truncate">{vehiculo}</p>
          )}
        </div>
        <StarRating value={calificacion} readonly size="sm" />
      </div>

      {/* Comentario */}
      <p className="text-sm text-gray-500 leading-relaxed flex-1 line-clamp-4">
        &ldquo;{comentario}&rdquo;
      </p>

      {/* Fecha */}
      <p className="text-xs text-gray-400 capitalize">{date}</p>
    </div>
  )
}

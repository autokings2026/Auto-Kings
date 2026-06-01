'use client'

import { useEffect, useState } from 'react'
import { Star, Loader2, CheckCircle, AlertTriangle, Car, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'


interface EncuestaData {
  token: string
  numero: string
  clienteNombre: string
  vehiculo: string
  placa: string
  tecnico: string
  respondido: boolean
  calidad: number | null
  tiempo: number | null
  atencion: number | null
  comentario: string | null
  respondidoEn: string | null
}

const CATEGORIAS = [
  { key: 'calidad',  label: 'Calidad del trabajo',    emoji: '🔧' },
  { key: 'tiempo',   label: 'Tiempo de entrega',       emoji: '⏱️' },
  { key: 'atencion', label: 'Atención al cliente',     emoji: '😊' },
] as const

function StarRating({
  value,
  onChange,
  readonly,
}: {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
}) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={cn('transition-transform', !readonly && 'hover:scale-110 cursor-pointer', readonly && 'cursor-default')}
        >
          <Star
            className={cn(
              'h-8 w-8 transition-colors',
              n <= (hovered || value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-gray-600',
            )}
          />
        </button>
      ))}
    </div>
  )
}

export function EncuestaView({ token }: { token: string }) {
  const [data, setData] = useState<EncuestaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const [calidad, setCalidad] = useState(0)
  const [tiempo, setTiempo] = useState(0)
  const [atencion, setAtencion] = useState(0)
  const [comentario, setComentario] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetch(`/api/encuesta/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: EncuestaData) => {
        setData(d)
        if (d.respondido) {
          setCalidad(d.calidad ?? 0)
          setTiempo(d.tiempo ?? 0)
          setAtencion(d.atencion ?? 0)
          setComentario(d.comentario ?? '')
        }
      })
      .catch(() => setError('Encuesta no encontrada o enlace inválido.'))
      .finally(() => setLoading(false))
  }, [token])

  const submit = async () => {
    if (calidad === 0 || tiempo === 0 || atencion === 0) {
      setFormError('Por favor califica las tres categorías antes de enviar.')
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      const res = await fetch(`/api/encuesta/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calidad, tiempo, atencion, comentario: comentario.trim() || undefined }),
      })
      if (!res.ok) {
        const e = await res.json()
        setFormError(e.message)
        return
      }
      setDone(true)
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
        <p className="text-white font-medium">{error}</p>
      </div>
    </div>
  )

  if (!data) return null

  const yaRespondido = data.respondido || done

  if (yaRespondido && done) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
        <h1 className="text-2xl font-bold text-white">¡Gracias por su opinión!</h1>
        <p className="text-gray-400 text-sm">
          Su calificación ha sido registrada. Nos esforzamos cada día para brindarle el mejor servicio.
        </p>
        <p className="text-gray-600 text-xs">Kings Auto Diagnósticos · +504</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Car className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Kings Auto Diagnósticos</p>
            <p className="text-xs text-gray-400">Encuesta de satisfacción · OT {data.numero}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6 pb-10">
        {/* Saludo */}
        <div className="pt-2">
          <h1 className="text-xl font-bold text-white">Hola, {data.clienteNombre}</h1>
          <p className="text-gray-400 text-sm mt-1">
            Gracias por confiar en nosotros con su {data.vehiculo} (placa {data.placa}).
            {yaRespondido
              ? ' Aquí están sus respuestas registradas.'
              : ' Por favor califique nuestro servicio del 1 al 5.'}
          </p>
        </div>

        {/* Info vehículo */}
        <div className="bg-gray-900 rounded-xl px-4 py-3 flex justify-between text-sm">
          <span className="text-gray-500">Técnico asignado</span>
          <span className="text-white font-medium">{data.tecnico}</span>
        </div>

        {/* Categorías */}
        <div className="bg-gray-900 rounded-xl divide-y divide-gray-800">
          {CATEGORIAS.map(({ key, label, emoji }) => {
            const val = key === 'calidad' ? calidad : key === 'tiempo' ? tiempo : atencion
            const setter = key === 'calidad' ? setCalidad : key === 'tiempo' ? setTiempo : setAtencion
            return (
              <div key={key} className="px-4 py-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{emoji}</span>
                  <p className="text-sm font-medium text-white">{label}</p>
                </div>
                <StarRating value={val} onChange={yaRespondido ? undefined : setter} readonly={yaRespondido} />
                {val > 0 && (
                  <p className="text-xs text-gray-500">
                    {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][val]}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Comentario */}
        <div className="space-y-2">
          <p className="text-sm text-gray-400">¿Algún comentario adicional? <span className="text-gray-600">(opcional)</span></p>
          <textarea
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            disabled={yaRespondido}
            rows={3}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none disabled:opacity-60"
            placeholder="Cuéntenos cómo mejorar nuestro servicio…"
          />
        </div>

        {formError && <p className="text-sm text-red-400 text-center">{formError}</p>}

        {/* Botón enviar */}
        {!yaRespondido && (
          <Button
            onClick={submit}
            disabled={submitting || calidad === 0 || tiempo === 0 || atencion === 0}
            className="w-full h-14 text-base font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950"
          >
            {submitting
              ? <Loader2 className="h-5 w-5 animate-spin" />
              : <><Send className="h-5 w-5 mr-2" />Enviar calificación</>}
          </Button>
        )}

        {yaRespondido && !done && (
          <div className="flex items-center gap-2 justify-center text-green-400 text-sm">
            <CheckCircle className="h-4 w-4" />
            Encuesta respondida el {new Date(data.respondidoEn!).toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        )}

        <p className="text-center text-xs text-gray-700 pt-2">Kings Auto Diagnósticos · Honduras</p>
      </div>
    </div>
  )
}

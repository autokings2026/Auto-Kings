'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Loader2, AlertTriangle, Car, Gauge } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChecklistData {
  token: string
  numero: string
  clienteNombre: string
  vehiculo: string
  placa: string
  kilometraje: number
  tecnico: string
  fotos: string[]
  testigos: string[]
  testigoOtro: string | null
  anormalidades: string[]
  anormalidadOtro: string | null
  observacionesRecepcion: string | null
  observacionesAdicionales: string | null
  aceptado: boolean | null
  fechaRespuesta: string | null
}

export function AceptacionView({ token }: { token: string }) {
  const [data, setData] = useState<ChecklistData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState<'aceptar' | 'rechazar' | null>(null)
  const [comentario, setComentario] = useState('')
  const [rechazando, setRechazando] = useState(false)
  const [done, setDone] = useState<boolean | null>(null)

  useEffect(() => {
    fetch(`/api/checklist/public/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setData)
      .catch(() => setError('Checklist no encontrado o enlace inválido.'))
      .finally(() => setLoading(false))
  }, [token])

  const responder = async (aceptado: boolean) => {
    if (!aceptado && !comentario.trim()) { setRechazando(true); return }
    setSubmitting(aceptado ? 'aceptar' : 'rechazar')
    try {
      const res = await fetch(`/api/checklist/public/${token}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aceptado, comentario: comentario || undefined }),
      })
      if (!res.ok) { const e = await res.json(); setError(e.message); return }
      setDone(aceptado)
    } finally { setSubmitting(null) }
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

  // Ya respondido previamente
  if (data.aceptado !== null || done !== null) {
    const aceptado = done ?? data.aceptado
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          {aceptado
            ? <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
            : <XCircle className="h-16 w-16 text-red-400 mx-auto" />}
          <h1 className="text-2xl font-bold text-white">
            {aceptado ? '¡Checklist aceptado!' : 'Checklist rechazado'}
          </h1>
          <p className="text-gray-400 text-sm">
            {aceptado
              ? 'Hemos recibido su confirmación. Nuestro equipo continuará con el diagnóstico de su vehículo.'
              : 'Hemos recibido su respuesta. Nos pondremos en contacto para aclarar cualquier diferencia.'}
          </p>
          <p className="text-gray-500 text-xs">Kings Auto Diagnósticos</p>
        </div>
      </div>
    )
  }

  const sinTestigos = data.testigos.length === 0 && !data.testigoOtro
  const sinAnormalidades = data.anormalidades.length === 0 && !data.anormalidadOtro

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
            <p className="text-xs text-gray-400">Checklist de Recepción — OT {data.numero}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-5 pb-10">
        {/* Saludo */}
        <div className="pt-2">
          <h1 className="text-xl font-bold text-white">Hola, {data.clienteNombre}</h1>
          <p className="text-gray-400 text-sm mt-1">
            Este es el estado registrado de su {data.vehiculo} (placa {data.placa}) al momento de su ingreso a nuestras instalaciones. Por favor revíselo y confírmenos.
          </p>
        </div>

        {/* Vehículo / KM */}
        <div className="bg-gray-900 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Vehículo</p>
            <p className="text-sm text-white mt-0.5">{data.vehiculo} · {data.placa}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium flex items-center gap-1 justify-end">
              <Gauge className="h-3 w-3" /> Kilometraje
            </p>
            <p className="text-sm text-white mt-0.5">{data.kilometraje.toLocaleString('es-HN')} km</p>
          </div>
        </div>

        {/* Fotos de ingreso */}
        {data.fotos.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-4 space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              Fotos de ingreso ({data.fotos.length})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {data.fotos.map((url, i) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-square rounded-lg overflow-hidden bg-gray-800"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Foto de ingreso ${i + 1}`} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Testigos del tablero */}
        <div className="bg-gray-900 rounded-xl p-4 space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Testigos del tablero encendidos</p>
          {sinTestigos ? (
            <p className="text-sm text-gray-500 italic">Ninguno reportado</p>
          ) : (
            <ul className="space-y-1.5">
              {data.testigos.map(t => (
                <li key={t} className="flex items-center gap-2 text-sm text-gray-200">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" /> {t}
                </li>
              ))}
              {data.testigoOtro && (
                <li className="flex items-center gap-2 text-sm text-gray-200">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" /> {data.testigoOtro}
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Anormalidades */}
        <div className="bg-gray-900 rounded-xl p-4 space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Anormalidades reportadas</p>
          {sinAnormalidades ? (
            <p className="text-sm text-gray-500 italic">Ninguna reportada</p>
          ) : (
            <ul className="space-y-1.5">
              {data.anormalidades.map(a => (
                <li key={a} className="flex items-center gap-2 text-sm text-gray-200">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" /> {a}
                </li>
              ))}
              {data.anormalidadOtro && (
                <li className="flex items-center gap-2 text-sm text-gray-200">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" /> {data.anormalidadOtro}
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Observaciones */}
        {(data.observacionesRecepcion || data.observacionesAdicionales) && (
          <div className="bg-gray-900 rounded-xl p-4 space-y-3">
            {data.observacionesRecepcion && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Observaciones de recepción</p>
                <p className="text-sm text-gray-300 mt-1">{data.observacionesRecepcion}</p>
              </div>
            )}
            {data.observacionesAdicionales && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Observaciones adicionales</p>
                <p className="text-sm text-gray-300 mt-1">{data.observacionesAdicionales}</p>
              </div>
            )}
          </div>
        )}

        {/* Disclosure */}
        <div className="bg-amber-950/40 border border-amber-700/30 rounded-xl px-4 py-3 flex gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/80">
            Durante el proceso de diagnóstico pueden detectarse códigos de falla o anomalías adicionales que no estaban presentes o no fueron reportadas al momento de la recepción. Estas serán informadas antes de efectuar cualquier reparación adicional.
          </p>
        </div>

        {/* Formulario rechazo */}
        {rechazando && (
          <div className="bg-gray-900 rounded-xl p-4 space-y-3">
            <p className="text-sm text-gray-300">¿Puede indicarnos con qué no está de acuerdo?</p>
            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              placeholder="Ej: El kilometraje no es correcto…"
            />
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => responder(false)}
                disabled={!!submitting}
                className="flex-1"
              >
                {submitting === 'rechazar' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar rechazo'}
              </Button>
              <Button variant="outline" onClick={() => setRechazando(false)} className="border-gray-700">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Botones principales */}
        {!rechazando && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => responder(true)}
              disabled={!!submitting}
              className="bg-green-600 hover:bg-green-500 text-white h-14 text-base font-semibold rounded-xl"
            >
              {submitting === 'aceptar'
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : <><CheckCircle className="h-5 w-5 mr-2" />Acepto</>}
            </Button>
            <Button
              onClick={() => setRechazando(true)}
              disabled={!!submitting}
              className="bg-red-700 hover:bg-red-600 text-white h-14 text-base font-semibold rounded-xl"
            >
              <XCircle className="h-5 w-5 mr-2" />Rechazar
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

        <p className="text-center text-xs text-gray-600 pt-2">
          Técnico asignado: {data.tecnico} · Kings Auto Diagnósticos
        </p>
      </div>
    </div>
  )
}

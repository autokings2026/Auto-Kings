'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Loader2, FileDown, AlertTriangle, Car } from 'lucide-react'
import { Button } from '@/components/ui/button'


interface CotizacionData {
  token: string
  numero: string
  clienteNombre: string
  vehiculo: string
  placa: string
  tecnico: string
  sintomaCliente: string
  diagnosticoTecnico: string
  items: { descripcion: string; tipo: string; cantidad: number; precioUnitario: number; subtotal: number }[]
  totalMateriales: number
  totalPartes: number
  totalManoObra: number
  aplicarISV: boolean
  totalGeneral: number
  aprobado: boolean | null
  fechaAprobacion: string | null
}

const fmt = (n: number) => `L. ${n.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

export function AprobacionView({ token }: { token: string }) {
  const [data, setData] = useState<CotizacionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState<'aprobar' | 'rechazar' | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [rechazando, setRechazando] = useState(false)
  const [done, setDone] = useState<boolean | null>(null)

  useEffect(() => {
    fetch(`/api/cotizacion/public/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setData)
      .catch(() => setError('Cotización no encontrada o enlace inválido.'))
      .finally(() => setLoading(false))
  }, [token])

  const responder = async (aprobado: boolean) => {
    if (!aprobado && !mensaje.trim()) { setRechazando(true); return }
    setSubmitting(aprobado ? 'aprobar' : 'rechazar')
    try {
      const res = await fetch(`/api/cotizacion/public/${token}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aprobado, mensaje: mensaje || undefined }),
      })
      if (!res.ok) { const e = await res.json(); setError(e.message); return }
      setDone(aprobado)
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

  // Ya respondida previamente
  if (data.aprobado !== null || done !== null) {
    const aprobado = done ?? data.aprobado
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          {aprobado
            ? <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
            : <XCircle className="h-16 w-16 text-red-400 mx-auto" />}
          <h1 className="text-2xl font-bold text-white">
            {aprobado ? '¡Cotización aprobada!' : 'Cotización rechazada'}
          </h1>
          <p className="text-gray-400 text-sm">
            {aprobado
              ? 'Hemos recibido su aprobación. Nuestro equipo comenzará la reparación de su vehículo. Le avisaremos cuando esté listo.'
              : 'Hemos recibido su respuesta. Si tiene alguna pregunta, no dude en contactarnos.'}
          </p>
          <p className="text-gray-500 text-xs">Kings Auto Diagnósticos · +504</p>
        </div>
      </div>
    )
  }

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
            <p className="text-xs text-gray-400">Cotización {data.numero}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-5 pb-10">
        {/* Saludo */}
        <div className="pt-2">
          <h1 className="text-xl font-bold text-white">Hola, {data.clienteNombre}</h1>
          <p className="text-gray-400 text-sm mt-1">
            Aquí está la cotización para su {data.vehiculo} (placa {data.placa}).
            Por favor revísela y apruebe o rechace los trabajos.
          </p>
        </div>

        {/* Síntoma */}
        <div className="bg-gray-900 rounded-xl p-4 space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Síntoma reportado</p>
          <p className="text-sm text-gray-300">{data.sintomaCliente}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium pt-1">Diagnóstico técnico</p>
          <p className="text-sm text-gray-300">{data.diagnosticoTecnico}</p>
        </div>

        {/* Items */}
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Trabajos y materiales</p>
          </div>
          <div className="divide-y divide-gray-800">
            {data.items.map((item, i) => (
              <div key={i} className="px-4 py-3 flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{item.descripcion}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.tipo === 'MATERIAL' ? 'Material' : item.tipo === 'PARTE' ? 'Parte' : 'Mano de obra'} · {item.cantidad} × {fmt(item.precioUnitario)}
                  </p>
                </div>
                <p className="text-sm text-white font-medium shrink-0">{fmt(item.subtotal)}</p>
              </div>
            ))}
          </div>
          {/* Totales */}
          <div className="border-t border-gray-800 px-4 py-3 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Materiales</span><span>{fmt(data.totalMateriales)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Partes</span><span>{fmt(data.totalPartes)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Mano de obra</span><span>{fmt(data.totalManoObra)}</span>
            </div>
            {data.aplicarISV && (
              <>
                <div className="flex justify-between text-sm text-gray-400 border-t border-gray-800 pt-1.5">
                  <span>Subtotal</span>
                  <span>{fmt(data.totalMateriales + data.totalPartes + data.totalManoObra)}</span>
                </div>
                <div className="flex justify-between text-sm text-amber-400/80">
                  <span>ISV (15%)</span>
                  <span>+ {fmt(parseFloat(((data.totalMateriales + data.totalPartes + data.totalManoObra) * 0.15).toFixed(2)))}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-base font-bold text-white pt-1 border-t border-gray-800">
              <span>Total estimado</span><span className="text-amber-400">{fmt(data.totalGeneral)}</span>
            </div>
          </div>
        </div>

        {/* PDF */}
        <a href={`/api/cotizacion/pdf/${token}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full border-gray-700 text-gray-300">
            <FileDown className="h-4 w-4 mr-2" />
            Descargar cotización en PDF
          </Button>
        </a>

        {/* Disclosure */}
        <div className="bg-amber-950/40 border border-amber-700/30 rounded-xl px-4 py-3 flex gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/80">
            Si la cotización no es aprobada, se cobrará el costo del diagnóstico por los servicios de evaluación realizados.
          </p>
        </div>

        {/* Formulario rechazo */}
        {rechazando && (
          <div className="bg-gray-900 rounded-xl p-4 space-y-3">
            <p className="text-sm text-gray-300">¿Puede indicarnos el motivo del rechazo? (opcional)</p>
            <textarea
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              placeholder="Ej: El precio está fuera de mi presupuesto…"
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
              {submitting === 'aprobar'
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : <><CheckCircle className="h-5 w-5 mr-2" />Aprobar</>}
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

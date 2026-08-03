'use client'

import { useState } from 'react'
import { Search, Loader2, CheckCircle2, Clock, AlertCircle, Car } from 'lucide-react'

type EstadoCita = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'CONVERTIDA' | 'NO_ASISTIO'
type FaseOT = 'LLEGADA_FOTOS' | 'DIAGNOSTICO' | 'REPARACION' | 'CONTROL_CALIDAD' | 'ENTREGA' | 'COMPLETADA'
type EstadoOT = 'ACTIVA' | 'EN_ESPERA_APROBACION' | 'RECHAZADA_COTIZACION' | 'COMPLETADA' | 'CANCELADA'

interface CitaResult {
  fecha: string
  hora: string
  marca: string
  modelo: string
  anio: number
  estado: EstadoCita
}

interface OTResult {
  numero: string
  marca: string
  modelo: string
  anio: number
  faseActual: FaseOT
  estado: EstadoOT
  tecnico: string
  actualizadoEn: string
  entregadoEn: string | null
}

interface ApiResult {
  encontrado: boolean
  cita?: CitaResult
  ot?: OTResult
}

const FASES_OT: { key: FaseOT; label: string }[] = [
  { key: 'LLEGADA_FOTOS', label: 'Ingreso' },
  { key: 'DIAGNOSTICO', label: 'Diagnóstico' },
  { key: 'REPARACION', label: 'Reparación' },
  { key: 'CONTROL_CALIDAD', label: 'Control' },
  { key: 'ENTREGA', label: 'Listo' },
]

const LABEL_ESTADO_CITA: Record<EstadoCita, string> = {
  PENDIENTE: 'Pendiente de confirmar',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  CONVERTIDA: 'En proceso',
  NO_ASISTIO: 'No asistió',
}

// Solo para los estados que no son el flujo normal (ACTIVA se refleja con la
// barra de fases; COMPLETADA tiene su propia tarjeta de "entregado").
const LABEL_ESTADO_OT: Partial<Record<EstadoOT, string>> = {
  EN_ESPERA_APROBACION: 'Esperando tu aprobación de la cotización',
  RECHAZADA_COTIZACION: 'Cotización rechazada',
}

export function SeguimientoWidget() {
  const [placa, setPlaca] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ApiResult | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const p = placa.trim().toUpperCase()
    if (!p || p.length < 2) return

    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`/api/public/citas?placa=${encodeURIComponent(p)}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.message ?? 'Ocurrió un error. Intenta de nuevo.')
        return
      }
      setResult(data)
    } catch {
      setError('No se pudo conectar. Verifica tu conexión e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const faseIndex = result?.ot
    ? FASES_OT.findIndex(f => f.key === result.ot?.faseActual)
    : -1

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Input de búsqueda */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Car className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            value={placa}
            onChange={e => setPlaca(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 8))}
            placeholder="Ej: PCZ-1234"
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/30 text-base focus:outline-none focus:border-[#00d4e8]/50 focus:ring-1 focus:ring-[#00d4e8]/30 transition-colors font-mono tracking-widest uppercase"
            maxLength={8}
          />
        </div>
        <button
          type="submit"
          disabled={loading || placa.length < 2}
          className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#00d4e8] text-[#0f1a2e] font-bold text-sm hover:bg-[#00bcd4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Consultar</span>
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Sin resultado */}
      {result && !result.encontrado && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Search className="h-5 w-5 text-white/40" />
          </div>
          <p className="text-white/60 text-sm">
            No encontramos ninguna cita activa ni orden de trabajo para la placa{' '}
            <span className="font-mono font-bold text-white">{placa}</span>.
          </p>
          <p className="text-white/40 text-xs">¿Tu cita es nueva? Revisa en un momento o contáctanos directamente.</p>
        </div>
      )}

      {/* Resultado — Cita */}
      {result?.cita && (
        <div className="rounded-xl border border-[#00d4e8]/20 bg-white/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#00d4e8]" />
            <span className="text-sm font-semibold text-[#00d4e8]">Cita registrada</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-white/40 text-xs mb-0.5">Vehículo</p>
              <p className="text-white font-medium">{result.cita.marca} {result.cita.modelo} {result.cita.anio}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-0.5">Estado</p>
              <p className="text-white font-medium">{LABEL_ESTADO_CITA[result.cita.estado]}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-0.5">Fecha</p>
              <p className="text-white font-medium">
                {new Date(result.cita.fecha + 'T12:00:00').toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-0.5">Hora</p>
              <p className="text-white font-medium">{result.cita.hora}</p>
            </div>
          </div>
        </div>
      )}

      {/* Resultado — OT completada / entregada */}
      {result?.ot && result.ot.estado === 'COMPLETADA' && (
        <div className="rounded-xl border border-green-400/30 bg-green-400/5 p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-sm font-semibold text-white">Orden de Trabajo {result.ot.numero}</span>
            </div>
            <span className="text-xs text-white/40">
              Técnico: <span className="text-white">{result.ot.tecnico}</span>
            </span>
          </div>
          <div className="text-sm text-white/60">
            {result.ot.marca} {result.ot.modelo} {result.ot.anio}
          </div>
          <div className="rounded-lg bg-green-400/10 border border-green-400/20 px-4 py-3">
            <p className="text-sm font-semibold text-green-300">✓ Trabajo finalizado — vehículo entregado</p>
            <p className="text-xs text-white/40 mt-1">
              Entregado el{' '}
              {new Date(result.ot.entregadoEn ?? result.ot.actualizadoEn).toLocaleString('es-HN', {
                day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      )}

      {/* Resultado — OT en curso */}
      {result?.ot && result.ot.estado !== 'COMPLETADA' && (
        <div className="rounded-xl border border-[#1e3a8a]/40 bg-white/5 p-5 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#00d4e8]" />
              <span className="text-sm font-semibold text-white">Orden de Trabajo {result.ot.numero}</span>
            </div>
            <span className="text-xs text-white/40">
              Técnico: <span className="text-white">{result.ot.tecnico}</span>
            </span>
          </div>

          <div className="text-sm text-white/60">
            {result.ot.marca} {result.ot.modelo} {result.ot.anio}
          </div>

          {LABEL_ESTADO_OT[result.ot.estado] && (
            <div className="text-xs font-medium text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2 inline-block">
              {LABEL_ESTADO_OT[result.ot.estado]}
            </div>
          )}

          {/* Barra de fases */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              {FASES_OT.map((fase, idx) => {
                const done = idx < faseIndex
                const active = idx === faseIndex
                return (
                  <div key={fase.key} className="flex flex-col items-center gap-1.5 flex-1">
                    <div
                      className={`relative h-8 w-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                        done
                          ? 'border-[#00d4e8] bg-[#00d4e8]/10'
                          : active
                          ? 'border-[#00d4e8] bg-[#00d4e8]/20 shadow-[0_0_12px_rgba(0,212,232,0.4)]'
                          : 'border-white/15 bg-white/5'
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 text-[#00d4e8]" />
                      ) : (
                        <span className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-[#00d4e8] animate-pulse' : 'bg-white/20'}`} />
                      )}
                      {/* Línea conectora */}
                      {idx < FASES_OT.length - 1 && (
                        <div
                          className={`absolute left-full top-1/2 -translate-y-1/2 h-0.5 w-full transition-colors ${
                            done ? 'bg-[#00d4e8]/40' : 'bg-white/10'
                          }`}
                        />
                      )}
                    </div>
                    <span className={`text-[10px] text-center leading-tight ${active ? 'text-[#00d4e8] font-medium' : done ? 'text-white/50' : 'text-white/30'}`}>
                      {fase.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <p className="text-xs text-white/30">
            Última actualización:{' '}
            {new Date(result.ot.actualizadoEn).toLocaleString('es-HN', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      )}
    </div>
  )
}
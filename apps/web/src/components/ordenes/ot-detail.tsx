'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatDate } from '@/lib/utils'
import { FaseOT, EstadoOT, LABEL_FASE, ORDEN_FASES } from '@kings/shared'
import { FaseFotos } from './fase-fotos'
import { FaseDiagnostico } from './fase-diagnostico'
import { FaseReparacion } from './fase-reparacion'
import { FaseCC } from './fase-cc'
import { FaseEntrega } from './fase-entrega'
import { EventosTimeline } from './eventos-timeline'


// ── Types ─────────────────────────────────────────────────────────────────────

export interface OrdenDetalle {
  id: string
  numero: string
  faseActual: FaseOT
  estado: EstadoOT
  placa: string
  anio: number
  color: string
  combustible: string
  kilometraje: number
  createdAt: string
  cliente: { id: string; nombre: string; telefono: string; email: string | null }
  tecnico: { id: string; nombre: string; email: string }
  marca: { nombre: string }
  modelo: { nombre: string }
  cita: { id: string; fecha: string; hora: string } | null
  fotos: { id: string; url: string; publicId: string; createdAt: string; tipoFoto?: { id: string; nombre: string } | null }[]
  diagnostico: {
    id: string
    sintomaCliente: string
    diagnosticoTecnico: string
    totalMateriales: string
    totalManoObra: string
    aplicarISV: boolean
    totalGeneral: string
    tokenAprobacion: string
    aprobado: boolean | null
    fechaAprobacion: string | null
    mensajeAprobacion: string | null
    items: {
      id: string
      descripcion: string
      tipo: string
      cantidad: string
      precioUnitario: string
      subtotal: string
      posicion: number
    }[]
  } | null
  reparacion: {
    id: string
    notas: string | null
    iniciadaEn: string | null
    finalizadaEn: string | null
    tecnico: { nombre: string }
  } | null
  controlesCC: {
    id: string
    aprobado: boolean
    observaciones: string | null
    revisadoEn: string
    revisadoPor: { nombre: string }
  }[]
  entrega: {
    id: string
    notificadoEn: string | null
    entregadoEn: string | null
    registradoPor: { nombre: string }
  } | null
  encuesta: {
    id: string
    token: string
    calidad: number | null
    tiempo: number | null
    atencion: number | null
    comentario: string | null
    respondidoEn: string | null
  } | null
  eventos: {
    id: string
    tipo: string
    descripcion: string
    createdAt: string
    realizadoPor: { nombre: string } | null
  }[]
}

// ── Fase stepper styles ───────────────────────────────────────────────────────

const FASE_ICON_STYLE = {
  done: 'bg-secondary border-secondary text-white',
  active: 'bg-secondary/20 border-secondary text-secondary ring-2 ring-secondary/30',
  pending: 'bg-surface-2 border-surface-2 text-muted-foreground',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OtDetail({ ordenId }: { ordenId: string }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [orden, setOrden] = useState<OrdenDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeFase, setActiveFase] = useState<FaseOT | null>(null)

  const fetchOrden = useCallback(async () => {
    if (!session?.user) return
    try {
      const res = await fetch(`/api/ordenes/${ordenId}`, {

      })
      if (!res.ok) { router.push('/ordenes'); return }
      const data: OrdenDetalle = await res.json()
      setOrden(data)
      setActiveFase((prev) => prev ?? data.faseActual)
    } finally {
      setLoading(false)
    }
  }, [session, ordenId, router])

  useEffect(() => { fetchOrden() }, [fetchOrden])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    )
  }

  if (!orden) return null

  const faseIdx = ORDEN_FASES.indexOf(orden.faseActual as FaseOT)

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/ordenes')} className="mb-3 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Órdenes
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white font-mono">{orden.numero}</h1>
              <EstadoBadge estado={orden.estado} />
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {orden.marca.nombre} {orden.modelo.nombre} {orden.anio} ·{' '}
              <span className="font-medium text-white">{orden.placa}</span> ·{' '}
              {orden.color}
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Cliente: <span className="text-white">{orden.cliente.nombre}</span> ·{' '}
              Técnico: <span className="text-white">{orden.tecnico.nombre}</span> ·{' '}
              Creada: {formatDate(orden.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Fase stepper */}
      <div className="flex items-center gap-0 overflow-x-auto pb-1">
        {ORDEN_FASES.map((fase, i) => {
          const isDone = i < faseIdx
          const isActive = fase === orden.faseActual
          const style = isDone ? FASE_ICON_STYLE.done : isActive ? FASE_ICON_STYLE.active : FASE_ICON_STYLE.pending
          const isClickable = isDone || isActive

          return (
            <div key={fase} className="flex items-center">
              <button
                onClick={() => isClickable && setActiveFase(fase)}
                disabled={!isClickable}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[90px]',
                  isClickable ? 'hover:bg-surface-2 cursor-pointer' : 'cursor-default',
                  activeFase === fase && 'bg-surface-2',
                )}
              >
                <div className={cn('h-7 w-7 rounded-full border-2 flex items-center justify-center text-xs font-bold', style)}>
                  {isDone ? '✓' : i + 1}
                </div>
                <span className={cn('text-[10px] text-center leading-tight', isActive ? 'text-secondary font-medium' : isDone ? 'text-white' : 'text-muted-foreground')}>
                  {LABEL_FASE[fase]}
                </span>
              </button>
              {i < ORDEN_FASES.length - 1 && (
                <div className={cn('h-px w-6 shrink-0', i < faseIdx ? 'bg-secondary' : 'bg-surface-2')} />
              )}
            </div>
          )
        })}
      </div>

      {/* Content + Timeline */}
      <div className="grid xl:grid-cols-[1fr_320px] gap-6">
        {/* Fase content */}
        <div>
          {activeFase === FaseOT.LLEGADA_FOTOS && (
            <FaseFotos orden={orden} onUpdate={fetchOrden} />
          )}
          {activeFase === FaseOT.DIAGNOSTICO && (
            <FaseDiagnostico orden={orden} onUpdate={fetchOrden} />
          )}
          {activeFase === FaseOT.REPARACION && (
            <FaseReparacion orden={orden} onUpdate={fetchOrden} />
          )}
          {activeFase === FaseOT.CONTROL_CALIDAD && (
            <FaseCC orden={orden} onUpdate={fetchOrden} />
          )}
          {activeFase === FaseOT.ENTREGA && (
            <FaseEntrega orden={orden} onUpdate={fetchOrden} />
          )}
          {activeFase === FaseOT.COMPLETADA && (
            <CompletadaPanel orden={orden} />
          )}
        </div>

        {/* Timeline */}
        <EventosTimeline eventos={orden.eventos} />
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: EstadoOT }) {
  const styles: Record<EstadoOT, string> = {
    [EstadoOT.ACTIVA]:                 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    [EstadoOT.EN_ESPERA_APROBACION]:   'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    [EstadoOT.RECHAZADA_COTIZACION]:   'bg-red-500/15 text-red-300 border-red-500/30',
    [EstadoOT.COMPLETADA]:             'bg-green-500/15 text-green-300 border-green-500/30',
    [EstadoOT.CANCELADA]:              'bg-gray-500/15 text-gray-300 border-gray-500/30',
  }
  const labels: Record<EstadoOT, string> = {
    [EstadoOT.ACTIVA]:                 'Activa',
    [EstadoOT.EN_ESPERA_APROBACION]:   'Esperando aprobación',
    [EstadoOT.RECHAZADA_COTIZACION]:   'Cotización rechazada',
    [EstadoOT.COMPLETADA]:             'Completada',
    [EstadoOT.CANCELADA]:              'Cancelada',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', styles[estado])}>
      {labels[estado]}
    </span>
  )
}

function StarDisplay({ value }: { value: number | null }) {
  if (!value) return <span className="text-muted-foreground text-xs">Sin respuesta</span>
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={n <= value ? 'text-amber-400' : 'text-gray-700'}>★</span>
      ))}
    </span>
  )
}

function CompletadaPanel({ orden }: { orden: OrdenDetalle }) {
  const enc = orden.encuesta
  const promedio = enc?.calidad && enc?.tiempo && enc?.atencion
    ? ((enc.calidad + enc.tiempo + enc.atencion) / 3).toFixed(1)
    : null

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5 flex items-center gap-4">
        <div className="text-3xl">✅</div>
        <div>
          <h2 className="text-lg font-bold text-white">OT Completada</h2>
          <p className="text-muted-foreground text-sm">
            Entregado el {formatDate(orden.entrega?.entregadoEn)}
          </p>
        </div>
      </div>

      {/* Resultados encuesta */}
      {enc ? (
        <div className="rounded-xl border border-surface-2 bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Encuesta de satisfacción</h3>
            {enc.respondidoEn ? (
              promedio && (
                <span className="text-amber-400 font-bold text-sm">★ {promedio} / 5</span>
              )
            ) : (
              <span className="text-xs text-muted-foreground border border-surface-2 rounded px-2 py-0.5">Sin responder</span>
            )}
          </div>

          {enc.respondidoEn ? (
            <div className="space-y-3">
              {[
                { label: 'Calidad del trabajo', value: enc.calidad },
                { label: 'Tiempo de entrega',   value: enc.tiempo },
                { label: 'Atención al cliente', value: enc.atencion },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <StarDisplay value={value} />
                </div>
              ))}
              {enc.comentario && (
                <div className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-gray-300 italic">
                  "{enc.comentario}"
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Respondida el {formatDate(enc.respondidoEn)}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Link para el cliente:{' '}
              <span className="text-accent font-mono">
                {`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/encuesta/${enc.token}`}
              </span>
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}

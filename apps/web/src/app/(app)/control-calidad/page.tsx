'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Loader2, ShieldCheck, CheckCircle, XCircle, Clock,
  Wrench, ArrowRight, ChevronLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatDate } from '@/lib/utils'
import { FaseOT, RolUsuario } from '@kings/shared'


interface OTResumen {
  id: string
  numero: string
  clienteNombre: string
  tecnicoNombre: string
  marcaNombre: string
  modeloNombre: string
  anio: number
  placa: string
  updatedAt: string
}

interface OTDetalle {
  id: string
  numero: string
  placa: string
  anio: number
  clienteNombre: string  // We'll use what we have
  marca: { nombre: string }
  modelo: { nombre: string }
  cliente: { nombre: string; telefono: string }
  tecnico: { nombre: string }
  reparacion: {
    notas: string | null
    iniciadaEn: string | null
    finalizadaEn: string | null
    tecnico: { nombre: string }
  } | null
  diagnostico: {
    sintomaCliente: string
    diagnosticoTecnico: string
    totalGeneral: string
    items: { descripcion: string; tipo: string; cantidad: string; precioUnitario: string; subtotal: string }[]
  } | null
  controlesCC: { id: string; aprobado: boolean; observaciones: string | null; revisadoEn: string; revisadoPor: { nombre: string } }[]
}

export default function ControlCalidadPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [ordenes, setOrdenes] = useState<OTResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detalle, setDetalle] = useState<OTDetalle | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  // CC form state
  const [aprobado, setAprobado] = useState<boolean | null>(null)
  const [observaciones, setObservaciones] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const canApproveCC = session?.user?.rol === RolUsuario.ADMIN || session?.user?.rol === RolUsuario.CONTROL_CALIDAD

  const fetchOrdenes = useCallback(async () => {
    if (!session?.user) return
    try {
      const res = await fetch(`/api/ordenes?fase=${FaseOT.CONTROL_CALIDAD}&pageSize=100`, {

      })
      if (!res.ok) return
      const json = await res.json()
      setOrdenes(Array.isArray(json) ? json : json.data ?? [])
    } finally { setLoading(false) }
  }, [session])

  const fetchDetalle = useCallback(async (id: string) => {
    if (!session?.user) return
    setLoadingDetalle(true)
    setAprobado(null)
    setObservaciones('')
    setError('')
    try {
      const res = await fetch(`/api/ordenes/${id}`, {

      })
      if (res.ok) setDetalle(await res.json())
    } finally { setLoadingDetalle(false) }
  }, [session])

  useEffect(() => { fetchOrdenes() }, [fetchOrdenes])

  useEffect(() => {
    if (selectedId) fetchDetalle(selectedId)
    else setDetalle(null)
  }, [selectedId, fetchDetalle])

  const submitCC = async () => {
    if (aprobado === null) { setError('Selecciona si apruebas o rechazas'); return }
    if (!aprobado && !observaciones.trim()) { setError('Las observaciones son requeridas al rechazar'); return }
    if (!detalle) return
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/ordenes/${detalle.id}/cc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aprobado, observaciones: observaciones || undefined }),
      })
      if (!res.ok) { const e = await res.json(); setError(e.message); return }
      setSelectedId(null)
      await fetchOrdenes()
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
          <ShieldCheck className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Control de Calidad</h1>
          <p className="text-muted-foreground text-sm">Vehículos pendientes de inspección</p>
        </div>
      </div>

      {/* Split pane */}
      <div className="grid xl:grid-cols-[380px_1fr] gap-4 items-start">

        {/* ── Lista ── */}
        <div className="rounded-xl border border-surface-2 bg-surface overflow-hidden">
          <div className="px-4 py-2.5 border-b border-surface-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Pendientes
            </span>
            {!loading && (
              <span className={cn(
                'text-xs font-bold rounded-full px-2 py-0.5',
                ordenes.length === 0 ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400',
              )}>
                {ordenes.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-secondary" />
            </div>
          ) : ordenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4 space-y-2">
              <CheckCircle className="h-8 w-8 text-green-400" />
              <p className="text-white text-sm font-medium">Todo al día</p>
              <p className="text-muted-foreground text-xs">Sin vehículos pendientes</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-2">
              {ordenes.map(ot => (
                <button
                  key={ot.id}
                  onClick={() => setSelectedId(ot.id === selectedId ? null : ot.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-surface-2 transition-colors',
                    selectedId === ot.id && 'bg-surface-2 border-l-2 border-blue-400',
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">{ot.numero}</span>
                      <span className="text-xs text-muted-foreground">{ot.placa}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {ot.marcaNombre} {ot.modeloNombre} {ot.anio} · {ot.clienteNombre}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Técnico: {ot.tecnicoNombre} · {formatDate(ot.updatedAt)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Panel derecho ── */}
        {!selectedId ? (
          <div className="hidden xl:flex items-center justify-center h-64 rounded-xl border border-surface-2 bg-surface text-center text-muted-foreground">
            <div className="space-y-2">
              <ShieldCheck className="h-8 w-8 mx-auto" />
              <p className="text-sm">Selecciona una OT para ver el detalle</p>
            </div>
          </div>
        ) : loadingDetalle ? (
          <div className="flex items-center justify-center h-64 rounded-xl border border-surface-2 bg-surface">
            <Loader2 className="h-6 w-6 animate-spin text-secondary" />
          </div>
        ) : detalle ? (
          <div className="space-y-4">
            {/* Header OT */}
            <div className="rounded-xl border border-surface-2 bg-surface p-4 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white">{detalle.numero}</span>
                  <span className="text-sm text-muted-foreground">
                    {detalle.marca.nombre} {detalle.modelo.nombre} {detalle.anio} · {detalle.placa}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cliente: {detalle.cliente.nombre} · Técnico: {detalle.tecnico.nombre}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/ordenes/${detalle.id}`)}
                className="text-accent text-xs shrink-0"
              >
                Ver OT completa <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>

            {/* Síntoma + diagnóstico */}
            {detalle.diagnostico && (
              <div className="rounded-xl border border-surface-2 bg-surface p-4 space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Diagnóstico</h3>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Síntoma reportado</p>
                  <p className="text-sm text-gray-300">{detalle.diagnostico.sintomaCliente}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Diagnóstico técnico</p>
                  <p className="text-sm text-gray-300">{detalle.diagnostico.diagnosticoTecnico}</p>
                </div>
              </div>
            )}

            {/* Items reparados */}
            {detalle.diagnostico?.items && detalle.diagnostico.items.length > 0 && (
              <div className="rounded-xl border border-surface-2 bg-surface overflow-hidden">
                <div className="px-4 py-2.5 border-b border-surface-2 flex items-center gap-2">
                  <Wrench className="h-3.5 w-3.5 text-amber-400" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trabajos realizados</h3>
                </div>
                <div className="divide-y divide-surface-2">
                  {detalle.diagnostico.items.map((item, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center justify-between text-sm">
                      <div>
                        <p className="text-white">{item.descripcion}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.tipo === 'MATERIAL' ? 'Material' : item.tipo === 'PARTE' ? 'Parte' : 'Mano de obra'} · {item.cantidad} × L. {Number(item.precioUnitario).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <span className="text-white font-medium shrink-0 ml-4">
                        L. {Number(item.subtotal).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-surface-2 flex justify-between text-sm font-bold text-white bg-surface-2/50">
                  <span>Total</span>
                  <span className="text-accent">L. {Number(detalle.diagnostico.totalGeneral).toLocaleString('es-HN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            {/* Notas de reparación */}
            {detalle.reparacion?.notas && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1">
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Notas del técnico</p>
                <p className="text-sm text-gray-300">{detalle.reparacion.notas}</p>
              </div>
            )}

            {/* Historial CC previo */}
            {detalle.controlesCC.length > 0 && (
              <div className="rounded-xl border border-surface-2 bg-surface p-4 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Historial CC</h3>
                {detalle.controlesCC.map(cc => (
                  <div key={cc.id} className={cn('rounded-lg p-3 text-sm border flex items-start gap-2', cc.aprobado ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5')}>
                    {cc.aprobado ? <CheckCircle className="h-4 w-4 text-green-400 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
                    <div>
                      <p className={cn('font-medium', cc.aprobado ? 'text-green-300' : 'text-red-300')}>
                        {cc.aprobado ? 'Aprobado' : 'Rechazado'} · {cc.revisadoPor.nombre} · {formatDate(cc.revisadoEn)}
                      </p>
                      {cc.observaciones && <p className="text-xs text-muted-foreground mt-0.5">{cc.observaciones}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario CC */}
            {canApproveCC ? (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-400" /> Registrar resultado
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAprobado(true)}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-all',
                      aprobado === true
                        ? 'border-green-500 bg-green-500/15 text-green-300'
                        : 'border-surface-2 bg-surface text-muted-foreground hover:border-green-500/50',
                    )}
                  >
                    <CheckCircle className="h-4 w-4" /> Aprobado
                  </button>
                  <button
                    onClick={() => setAprobado(false)}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-all',
                      aprobado === false
                        ? 'border-red-500 bg-red-500/15 text-red-300'
                        : 'border-surface-2 bg-surface text-muted-foreground hover:border-red-500/50',
                    )}
                  >
                    <XCircle className="h-4 w-4" /> Rechazado
                  </button>
                </div>

                {aprobado === false && (
                  <textarea
                    value={observaciones}
                    onChange={e => setObservaciones(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-surface-2 bg-surface px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                    placeholder="Observaciones requeridas al rechazar…"
                  />
                )}

                {error && <p className="text-xs text-red-400">{error}</p>}

                <Button
                  onClick={submitCC}
                  disabled={saving || aprobado === null}
                  className="w-full"
                  variant="primary"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : aprobado === true ? (
                    'Aprobar → pasar a Entrega'
                  ) : aprobado === false ? (
                    'Rechazar → volver a Reparación'
                  ) : (
                    'Registrar resultado'
                  )}
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-surface-2 bg-surface-2/40 px-4 py-3 text-sm text-muted-foreground">
                Solo el personal de Control de Calidad o un administrador puede registrar el resultado.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

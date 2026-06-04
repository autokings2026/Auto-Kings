'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatDate } from '@/lib/utils'
import { FaseOT, RolUsuario } from '@kings/shared'
import type { OrdenDetalle } from './ot-detail'
import { ReparacionFotoUpload } from './reparacion-foto-upload'


export function FaseCC({ orden, onUpdate }: { orden: OrdenDetalle; onUpdate: () => void }) {
  const { data: session } = useSession()
  const isActive = orden.faseActual === FaseOT.CONTROL_CALIDAD
  const canApproveCC = session?.user?.rol === RolUsuario.ADMIN || session?.user?.rol === RolUsuario.CONTROL_CALIDAD

  const [aprobado, setAprobado] = useState<boolean | null>(null)
  const [observaciones, setObservaciones] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (aprobado === null) { setError('Selecciona si apruebas o rechazas'); return }
    if (!aprobado && !observaciones.trim()) { setError('Las observaciones son requeridas al rechazar'); return }
    setSaving(true); setError('')
    try {
      await fetch(`/api/ordenes/${orden.id}/cc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify({ aprobado, observaciones: observaciones || undefined }),
      })
      onUpdate()
    } finally { setSaving(false) }
  }

  return (
    <Card className="bg-surface border-surface-2">
      <CardContent className="pt-5 pb-5 space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-accent">
          Fase 4 · Control de Calidad
        </h2>

        {/* Fotos de reparación para revisión */}
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs uppercase">
            Fotos del trabajo realizado ({orden.fotosReparacion.length})
          </Label>
          <ReparacionFotoUpload
            ordenId={orden.id}
            fotos={orden.fotosReparacion}
            onUpdate={() => {}}
            readonly
          />
        </div>

        {/* Historial de controles anteriores */}
        {orden.controlesCC.length > 0 && (
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase">Historial CC</Label>
            {orden.controlesCC.map(cc => (
              <div
                key={cc.id}
                className={cn(
                  'rounded-lg p-3 text-sm border',
                  cc.aprobado
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-red-500/30 bg-red-500/5',
                )}
              >
                <div className="flex items-center gap-2">
                  {cc.aprobado
                    ? <CheckCircle className="h-4 w-4 text-green-400" />
                    : <XCircle className="h-4 w-4 text-red-400" />}
                  <span className={cc.aprobado ? 'text-green-300' : 'text-red-300'}>
                    {cc.aprobado ? 'Aprobado' : 'Rechazado'}
                  </span>
                  <span className="text-muted-foreground text-xs ml-auto">
                    {cc.revisadoPor.nombre} · {formatDate(cc.revisadoEn)}
                  </span>
                </div>
                {cc.observaciones && (
                  <p className="text-muted-foreground text-xs mt-1 ml-6">{cc.observaciones}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sin permiso */}
        {isActive && !canApproveCC && (
          <div className="rounded-lg border border-surface-2 bg-surface-2/40 px-4 py-3 text-sm text-muted-foreground">
            Solo el personal de Control de Calidad o un administrador puede registrar el resultado de esta fase.
          </div>
        )}

        {/* Formulario CC */}
        {isActive && canApproveCC && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Resultado de la inspección</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAprobado(true)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-all',
                    aprobado === true
                      ? 'border-green-500 bg-green-500/15 text-green-300'
                      : 'border-surface-2 bg-surface-2 text-muted-foreground hover:border-green-500/50',
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
                      : 'border-surface-2 bg-surface-2 text-muted-foreground hover:border-red-500/50',
                  )}
                >
                  <XCircle className="h-4 w-4" /> Rechazado
                </button>
              </div>
            </div>

            {aprobado === false && (
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Observaciones (requeridas) *</Label>
                <textarea
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                  placeholder="Describe qué debe corregirse…"
                />
              </div>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}

            <Button
              variant="primary"
              onClick={submit}
              disabled={saving || aprobado === null}
              className="w-full"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registrando…</>
              ) : aprobado === true ? (
                'Aprobar → pasar a Entrega'
              ) : aprobado === false ? (
                'Rechazar → volver a Reparación'
              ) : (
                'Registrar resultado'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

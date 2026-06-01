'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { FaseOT } from '@kings/shared'
import type { OrdenDetalle } from './ot-detail'


export function FaseReparacion({ orden, onUpdate }: { orden: OrdenDetalle; onUpdate: () => void }) {
  const { data: session } = useSession()
  const isActive = orden.faseActual === FaseOT.REPARACION
  const rep = orden.reparacion
  const yaFinalizada = !!rep?.finalizadaEn

  const [notas, setNotas] = useState(rep?.notas ?? '')
  const [saving, setSaving] = useState(false)
  const [finalizing, setFinalizing] = useState(false)

  const save = async (finalizada = false) => {
    finalizada ? setFinalizing(true) : setSaving(true)
    try {
      await fetch(`/api/ordenes/${orden.id}/reparacion`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify({ notas, finalizada }),
      })
      onUpdate()
    } finally {
      finalizada ? setFinalizing(false) : setSaving(false)
    }
  }

  return (
    <Card className="bg-surface border-surface-2">
      <CardContent className="pt-5 pb-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-accent">
            Fase 3 · Reparación
          </h2>
          {yaFinalizada && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <CheckCircle className="h-3.5 w-3.5" /> Finalizada
            </span>
          )}
        </div>

        {/* Info diagnóstico */}
        {orden.diagnostico && (
          <div className="rounded-lg bg-surface-2 p-3 text-sm space-y-1">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Síntoma del cliente
            </p>
            <p className="text-white">{orden.diagnostico.sintomaCliente}</p>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mt-2">
              Diagnóstico
            </p>
            <p className="text-white">{orden.diagnostico.diagnosticoTecnico}</p>
          </div>
        )}

        {/* Notas de reparación */}
        <div className="space-y-1.5">
          <Label className="text-muted-foreground">Notas de reparación</Label>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            disabled={!isActive || yaFinalizada}
            rows={4}
            className="w-full rounded-md border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary resize-none disabled:opacity-60"
            placeholder="Describe el trabajo realizado…"
          />
        </div>

        {isActive && !yaFinalizada && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-surface-2">
            <Button variant="outline" onClick={() => save(false)} disabled={saving || finalizing}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando…</> : 'Guardar notas'}
            </Button>
            <Button
              variant="primary"
              onClick={() => save(true)}
              disabled={saving || finalizing}
              className="bg-green-700 hover:bg-green-600"
            >
              {finalizing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Finalizando…</>
              ) : (
                'Finalizar reparación → Control de calidad'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

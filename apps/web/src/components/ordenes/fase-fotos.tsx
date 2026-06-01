'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FotoUpload } from './foto-upload'
import { FaseOT } from '@kings/shared'
import type { OrdenDetalle } from './ot-detail'


export function FaseFotos({ orden, onUpdate }: { orden: OrdenDetalle; onUpdate: () => void }) {
  const { data: session } = useSession()
  const [advancing, setAdvancing] = useState(false)
  const isActive = orden.faseActual === FaseOT.LLEGADA_FOTOS

  const avanzar = async () => {
    setAdvancing(true)
    try {
      await fetch(`/api/ordenes/${orden.id}/avanzar`, {
        method: 'PATCH',

      })
      onUpdate()
    } finally {
      setAdvancing(false)
    }
  }

  return (
    <Card className="bg-surface border-surface-2">
      <CardContent className="pt-5 pb-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-accent">
            Fase 1 · Llegada y Fotos
          </h2>
          <span className="text-xs text-muted-foreground">{orden.fotos.length} foto(s)</span>
        </div>

        <FotoUpload
          ordenId={orden.id}
          fotos={orden.fotos}
          onUpdate={onUpdate}
          readonly={!isActive}
        />

        {isActive && (
          <div className="pt-2 border-t border-surface-2">
            <Button
              variant="primary"
              onClick={avanzar}
              disabled={advancing}
              className="w-full sm:w-auto"
            >
              {advancing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Avanzando…</>
              ) : (
                'Avanzar a Diagnóstico →'
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Puedes avanzar sin fotos, pero se recomienda documentar el estado del vehículo.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

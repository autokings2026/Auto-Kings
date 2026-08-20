'use client'

import { timeAgo } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { TipoEventoOT } from '@kings/shared'

interface Evento {
  id: string
  tipo: string
  descripcion: string
  createdAt: string
  realizadoPor: { nombre: string } | null
}

const TIPO_COLOR: Partial<Record<string, string>> = {
  [TipoEventoOT.CREACION_OT]:           'bg-accent',
  [TipoEventoOT.COTIZACION_APROBADA]:   'bg-green-500',
  [TipoEventoOT.COTIZACION_RECHAZADA]:  'bg-red-500',
  [TipoEventoOT.COTIZACION_ADICIONAL_GENERADA]:  'bg-amber-500',
  [TipoEventoOT.COTIZACION_ADICIONAL_APROBADA]:  'bg-green-500',
  [TipoEventoOT.COTIZACION_ADICIONAL_RECHAZADA]: 'bg-red-500',
  [TipoEventoOT.CC_APROBADO]:           'bg-green-500',
  [TipoEventoOT.CC_RECHAZADO]:          'bg-red-500',
  [TipoEventoOT.VEHICULO_ENTREGADO]:    'bg-emerald-500',
  [TipoEventoOT.NOTA_INTERNA]:          'bg-purple-500',
  [TipoEventoOT.FOTO_SUBIDA]:           'bg-cyan-500',
  [TipoEventoOT.CAMBIO_FASE]:           'bg-secondary',
}

export function EventosTimeline({ eventos }: { eventos: Evento[] }) {
  if (eventos.length === 0) return null

  const sorted = [...eventos].reverse()

  return (
    <Card className="bg-surface border-surface-2 h-fit">
      <CardContent className="pt-5 pb-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Línea de tiempo
        </h3>
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {sorted.map((ev, i) => (
            <div key={ev.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${TIPO_COLOR[ev.tipo] ?? 'bg-surface-2'}`} />
                {i < sorted.length - 1 && (
                  <div className="w-px flex-1 bg-surface-2 mt-1" />
                )}
              </div>
              <div className="pb-3 min-w-0">
                <p className="text-xs text-white leading-snug">{ev.descripcion}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {ev.realizadoPor?.nombre ?? 'Sistema'} · {timeAgo(ev.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Car, Loader2, Gauge, Wallet, CalendarClock, ClipboardList } from 'lucide-react'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { EstadoOT } from '@kings/shared'

interface HistorialOrden {
  id: string
  numero: string
  createdAt: string
  estado: EstadoOT
  kilometraje: number
  cliente: string
  marca: string
  modelo: string
  diagnosticoTecnico: string | null
  total: number
}

interface HistorialVehiculoData {
  placa: string
  resumen: {
    totalGastado: number
    visitas: number
    ultimaVisita: string | null
    ultimoKilometraje: number | null
  }
  historial: HistorialOrden[]
}

const ESTADO_STYLE: Partial<Record<EstadoOT, string>> = {
  [EstadoOT.CANCELADA]: 'text-gray-400',
  [EstadoOT.RECHAZADA_COTIZACION]: 'text-red-400',
}

const ESTADO_LABEL: Partial<Record<EstadoOT, string>> = {
  [EstadoOT.CANCELADA]: 'Cancelada',
  [EstadoOT.RECHAZADA_COTIZACION]: 'Cotización rechazada',
}

// Historial y resumen de todas las OTs de este vehículo (agrupadas por placa),
// sin importar el cliente que las registró. Se excluyen OTs canceladas o con
// cotización rechazada del resumen (total gastado, visitas), pero se muestran
// igual en el historial completo con su estado.
export function HistorialVehiculo({ placa, ordenActualId }: { placa: string; ordenActualId: string }) {
  const [data, setData] = useState<HistorialVehiculoData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let activo = true
    setLoading(true)
    fetch(`/api/vehiculos/historial?placa=${encodeURIComponent(placa)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => { if (activo) setData(d) })
      .finally(() => { if (activo) setLoading(false) })
    return () => { activo = false }
  }, [placa])

  if (loading) {
    return (
      <div className="rounded-xl border border-surface-2 bg-surface p-4 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data || data.historial.length <= 1) return null // nada que mostrar aparte de la OT actual

  const { resumen, historial } = data

  return (
    <div className="rounded-xl border border-surface-2 bg-surface p-4 space-y-4">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <Car className="h-4 w-4 text-accent" /> Historial del vehículo
      </h3>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-2">
        <ResumenCard icon={Wallet} label="Total gastado" value={formatCurrency(resumen.totalGastado)} />
        <ResumenCard icon={ClipboardList} label="Visitas" value={String(resumen.visitas)} />
        <ResumenCard icon={CalendarClock} label="Última visita" value={formatDate(resumen.ultimaVisita)} />
        <ResumenCard icon={Gauge} label="Último kilometraje" value={resumen.ultimoKilometraje != null ? `${resumen.ultimoKilometraje.toLocaleString('es-HN')} km` : '—'} />
      </div>

      {/* Historial de OTs */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto">
        {historial.map((o) => (
          <div
            key={o.id}
            className={cn(
              'rounded-lg border px-3 py-2 text-xs',
              o.id === ordenActualId ? 'border-secondary/40 bg-secondary/5' : 'border-surface-2 bg-surface-2/40',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-white">{o.numero}</span>
              <span className="text-white font-medium">{formatCurrency(o.total)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5 text-muted-foreground">
              <span>{formatDate(o.createdAt)}{o.id === ordenActualId && ' · esta OT'}</span>
              {ESTADO_LABEL[o.estado] && (
                <span className={ESTADO_STYLE[o.estado]}>{ESTADO_LABEL[o.estado]}</span>
              )}
            </div>
            {o.diagnosticoTecnico && (
              <p className="text-muted-foreground mt-1 line-clamp-2">{o.diagnosticoTecnico}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ResumenCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2">
      <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wide">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className="text-sm font-semibold text-white mt-0.5 truncate">{value}</p>
    </div>
  )
}

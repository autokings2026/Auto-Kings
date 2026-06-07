'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, TrendingUp, X, Users, Wrench, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface TecnicoComision {
  tecnicoId: string
  tecnicoNombre: string
  rol: string
  totalOTs: number
  totalManoObra: number
  totalFacturado: number
  comisionTotal: number
  comisionPct: number
}

interface Resultado {
  data: TecnicoComision[]
  totales: {
    totalOTs: number
    totalManoObra: number
    totalFacturado: number
    comisionTotal: number
  }
  comisionPct: number
}

export default function ComisionesPage() {
  const { data: session } = useSession()
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [loading, setLoading] = useState(true)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const fetchData = useCallback(async () => {
    if (!session?.user) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (desde) params.set('desde', desde)
      if (hasta) params.set('hasta', hasta)
      const res = await fetch(`/api/reportes/comisiones?${params}`)
      if (res.ok) setResultado(await res.json())
    } finally {
      setLoading(false)
    }
  }, [session, desde, hasta])

  useEffect(() => { fetchData() }, [fetchData])

  const limpiar = () => { setDesde(''); setHasta('') }

  const periodoLabel = desde || hasta
    ? `${desde || '…'} → ${hasta || '…'}`
    : 'Todas las fechas'

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Comisiones</h1>
          <p className="text-sm text-muted-foreground">
            {resultado ? `${resultado.comisionPct}% sobre mano de obra · ${periodoLabel}` : 'Resumen por técnico'}
          </p>
        </div>
      </div>

      {/* Filtros de fecha */}
      <div className="flex flex-wrap items-end gap-3 bg-surface border border-surface-2 rounded-xl p-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={e => setDesde(e.target.value)}
            className="rounded-lg border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={e => setHasta(e.target.value)}
            className="rounded-lg border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white focus:outline-none focus:ring-secondary"
          />
        </div>
        {(desde || hasta) && (
          <Button variant="ghost" size="sm" onClick={limpiar} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" /> Limpiar
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      ) : !resultado ? null : (
        <>
          {/* Resumen general */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard
              icon={<Users className="h-4 w-4 text-blue-400" />}
              label="OTs completadas"
              value={String(resultado.totales.totalOTs)}
              color="text-blue-400"
            />
            <SummaryCard
              icon={<Wrench className="h-4 w-4 text-amber-400" />}
              label="Total mano de obra"
              value={formatCurrency(resultado.totales.totalManoObra)}
              color="text-amber-400"
            />
            <SummaryCard
              icon={<DollarSign className="h-4 w-4 text-accent" />}
              label="Total facturado"
              value={formatCurrency(resultado.totales.totalFacturado)}
              color="text-accent"
            />
            <SummaryCard
              icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
              label="Total comisiones"
              value={formatCurrency(resultado.totales.comisionTotal)}
              color="text-emerald-400"
              highlight
            />
          </div>

          {/* Cards por técnico */}
          {resultado.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
              <Users className="h-10 w-10 text-muted-foreground" />
              <p className="text-white font-medium">Sin datos</p>
              <p className="text-muted-foreground text-sm">No hay técnicos activos o no hay OTs completadas en el período.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resultado.data.map(t => (
                <TecnicoCard key={t.tecnicoId} tecnico={t} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SummaryCard({
  icon, label, value, color, highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  highlight?: boolean
}) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-surface-2 bg-surface'}`}>
      <div className="flex items-center gap-2 mb-2">{icon}<p className="text-xs text-muted-foreground truncate">{label}</p></div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function TecnicoCard({ tecnico: t }: { tecnico: TecnicoComision }) {
  const pct = t.totalManoObra > 0
    ? ((t.comisionTotal / t.totalManoObra) * 100).toFixed(0)
    : '0'

  return (
    <div className="rounded-xl border border-surface-2 bg-surface p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-white truncate">{t.tecnicoNombre}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.rol === 'EMPLEADO' ? 'Técnico' : 'Control de Calidad'}
          </p>
        </div>
        <span className="shrink-0 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
          {pct}%
        </span>
      </div>

      {/* Métricas */}
      <div className="space-y-2.5">
        <Metric label="OTs completadas" value={String(t.totalOTs)} />
        <Metric label="Total facturado" value={formatCurrency(t.totalFacturado)} />
        <Metric label="Mano de obra" value={formatCurrency(t.totalManoObra)} />
      </div>

      {/* Comisión destacada */}
      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-emerald-400/70 font-medium">Comisión ({t.comisionPct}%)</p>
          <p className="text-xl font-bold text-emerald-400 mt-0.5">{formatCurrency(t.comisionTotal)}</p>
        </div>
        <TrendingUp className="h-8 w-8 text-emerald-400/30" />
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  )
}

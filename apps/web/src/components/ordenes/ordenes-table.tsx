'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, RefreshCw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { cn, formatDate } from '@/lib/utils'
import { FaseOT, EstadoOT, LABEL_FASE } from '@kings/shared'


interface OrdenResumen {
  id: string
  numero: string
  clienteNombre: string
  clienteTelefono: string
  marcaNombre: string
  modeloNombre: string
  anio: number
  placa: string
  color: string
  faseActual: FaseOT
  estado: EstadoOT
  tecnicoNombre: string
  tieneFotos: boolean
  totalCotizacion: string | null
  cotizacionAprobada: boolean | null
  createdAt: string
}

interface OrdenesResponse {
  data: OrdenResumen[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const FASE_STYLE: Record<FaseOT, string> = {
  [FaseOT.LLEGADA_FOTOS]:   'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  [FaseOT.DIAGNOSTICO]:     'bg-blue-500/15 text-blue-300 border-blue-500/30',
  [FaseOT.REPARACION]:      'bg-amber-500/15 text-amber-300 border-amber-500/30',
  [FaseOT.CONTROL_CALIDAD]: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  [FaseOT.ENTREGA]:         'bg-green-500/15 text-green-300 border-green-500/30',
  [FaseOT.COMPLETADA]:      'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
}

const ESTADO_STYLE: Record<EstadoOT, string> = {
  [EstadoOT.ACTIVA]:                 'text-white',
  [EstadoOT.EN_ESPERA_APROBACION]:   'text-yellow-400',
  [EstadoOT.RECHAZADA_COTIZACION]:   'text-red-400',
  [EstadoOT.COMPLETADA]:             'text-green-400',
  [EstadoOT.CANCELADA]:              'text-gray-400',
}

const ESTADO_LABEL: Record<EstadoOT, string> = {
  [EstadoOT.ACTIVA]:                 'Activa',
  [EstadoOT.EN_ESPERA_APROBACION]:   'Esperando aprobación',
  [EstadoOT.RECHAZADA_COTIZACION]:   'Cotización rechazada',
  [EstadoOT.COMPLETADA]:             'Completada',
  [EstadoOT.CANCELADA]:              'Cancelada',
}

export function OrdenesTable() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData] = useState<OrdenesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [fase, setFase] = useState<FaseOT | ''>(
    (searchParams.get('fase') as FaseOT) ?? '',
  )
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [fase, debouncedSearch])

  const fetchOrdenes = useCallback(async () => {
    if (!session?.user) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '15' })
      if (fase) params.set('fase', fase)
      if (debouncedSearch) params.set('search', debouncedSearch)

      const res = await fetch(`/api/ordenes?${params}`, {

      })
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [session, fase, debouncedSearch, page])

  useEffect(() => { fetchOrdenes() }, [fetchOrdenes])

  const fases = ['' as const, ...Object.values(FaseOT)]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Fase tabs scroll */}
        <div className="flex rounded-lg border border-surface-2 overflow-x-auto shrink-0">
          {fases.map((f) => (
            <button
              key={f || 'todas'}
              onClick={() => setFase(f)}
              className={cn(
                'px-3 py-2 text-xs whitespace-nowrap transition-colors shrink-0',
                fase === f
                  ? 'bg-secondary text-white font-medium'
                  : 'text-muted-foreground hover:text-white hover:bg-surface-2',
              )}
            >
              {f ? LABEL_FASE[f] : 'Todas'}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por OT, placa o cliente…"
            className="pl-9"
          />
        </div>

        <Button variant="outline" size="sm" onClick={fetchOrdenes} className="shrink-0">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <Card className="bg-surface border-surface-2 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-secondary" />
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground text-sm">
            No hay órdenes para los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 text-left">OT</th>
                  <th className="px-4 py-3 text-left">Cliente · Vehículo</th>
                  <th className="px-4 py-3 text-left">Fase</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Técnico</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-2">
                {data.data.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => router.push(`/ordenes/${o.id}`)}
                    className="hover:bg-surface-2/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-accent font-medium whitespace-nowrap">
                      {o.numero}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{o.clienteNombre}</div>
                      <div className="text-muted-foreground text-xs">
                        {o.marcaNombre} {o.modeloNombre} {o.anio} · {o.placa}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                        FASE_STYLE[o.faseActual],
                      )}>
                        {LABEL_FASE[o.faseActual]}
                      </span>
                    </td>
                    <td className={cn('px-4 py-3 text-xs', ESTADO_STYLE[o.estado])}>
                      {ESTADO_LABEL[o.estado]}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {o.tecnicoNombre}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(o.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{data.total} órdenes · página {data.page} de {data.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

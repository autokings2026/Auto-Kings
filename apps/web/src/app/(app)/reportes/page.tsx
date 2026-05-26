'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2, BarChart2, FileDown, ChevronRight, Star, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate, formatCurrency } from '@/lib/utils'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface OTReporte {
  id: string
  numero: string
  placa: string
  vehiculo: string
  clienteNombre: string
  tecnicoNombre: string
  totalFacturado: number | null
  fechaIngreso: string
  fechaEntrega: string | null
  encuestaPromedio: number | null
}

interface Paginado {
  data: OTReporte[]
  total: number
  page: number
  totalPages: number
}

export default function ReportesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [resultado, setResultado] = useState<Paginado | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const fetchReportes = useCallback(async () => {
    if (!session?.user) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' })
      if (desde) params.set('desde', desde)
      if (hasta) params.set('hasta', hasta)
      const res = await fetch(`${API}/reportes/ordenes?${params}`, {
        headers: { Authorization: `Bearer ${session.user.accessToken}` },
      })
      if (res.ok) setResultado(await res.json())
    } finally { setLoading(false) }
  }, [session, page, desde, hasta])

  useEffect(() => { fetchReportes() }, [fetchReportes])

  const limpiarFiltros = () => { setDesde(''); setHasta(''); setPage(1) }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <BarChart2 className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Reportes</h1>
            <p className="text-muted-foreground text-sm">
              {resultado ? `${resultado.total} órdenes completadas` : 'Órdenes completadas'}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3 bg-surface border border-surface-2 rounded-xl p-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={e => { setDesde(e.target.value); setPage(1) }}
            className="rounded-lg border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={e => { setHasta(e.target.value); setPage(1) }}
            className="rounded-lg border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
        {(desde || hasta) && (
          <Button variant="ghost" size="sm" onClick={limpiarFiltros} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" /> Limpiar
          </Button>
        )}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      ) : !resultado || resultado.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 text-center">
          <Search className="h-10 w-10 text-muted-foreground" />
          <p className="text-white font-medium">Sin resultados</p>
          <p className="text-muted-foreground text-sm">No hay órdenes completadas en el período seleccionado.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-surface-2 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-2 text-xs text-muted-foreground">
                <th className="px-4 py-3 text-left">OT / Vehículo</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Cliente</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Técnico</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Entrega</th>
                <th className="px-4 py-3 text-right hidden sm:table-cell">Total</th>
                <th className="px-4 py-3 text-center hidden lg:table-cell">Encuesta</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-2">
              {resultado.data.map(ot => (
                <tr
                  key={ot.id}
                  onClick={() => router.push(`/reportes/${ot.id}`)}
                  className="hover:bg-surface-2 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-mono font-bold text-white text-xs">{ot.numero}</p>
                    <p className="text-muted-foreground text-xs truncate max-w-[160px]">{ot.vehiculo} · {ot.placa}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-300">{ot.clienteNombre}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{ot.tecnicoNombre}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">{formatDate(ot.fechaEntrega)}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-right font-medium text-white">
                    {ot.totalFacturado !== null ? formatCurrency(ot.totalFacturado) : '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-center">
                    {ot.encuestaPromedio !== null ? (
                      <span className="flex items-center justify-center gap-1 text-amber-400 text-xs font-bold">
                        <Star className="h-3 w-3 fill-amber-400" />{ot.encuestaPromedio}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginación */}
          {resultado.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-2 bg-surface-2/30">
              <p className="text-xs text-muted-foreground">
                Página {resultado.page} de {resultado.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={page === resultado.totalPages} onClick={() => setPage(p => p + 1)}>
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

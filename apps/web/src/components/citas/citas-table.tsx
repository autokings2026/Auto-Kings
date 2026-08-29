'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Search, RefreshCw, ChevronLeft, ChevronRight, ArrowRight, Loader2, Lock, UserPlus, CarFront } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatDate } from '@/lib/utils'
import { EstadoCita } from '@kings/shared'
import { RecepcionVehiculoModal } from './recepcion-vehiculo-modal'
import { NuevaCitaModal } from './nueva-cita-modal'

type Rango = 'hoy' | 'semana' | 'mes' | 'todas'

interface Cita {
  id: string
  clienteNombre: string
  clienteTelefono: string
  clienteEmail: string | null
  marcaNombre: string
  modeloNombre: string
  anio: number
  placa: string
  fecha: string
  hora: string
  comentarios: string | null
  estado: EstadoCita
  ordenTrabajo: { id: string; numero: string; tecnico: { nombre: string } } | null
  createdAt: string
}

interface CitasResponse {
  data: Cita[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ── Badge ─────────────────────────────────────────────────────────────────────

const ESTADO_STYLE: Record<EstadoCita, string> = {
  [EstadoCita.PENDIENTE]: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  [EstadoCita.CONFIRMADA]: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  [EstadoCita.CONVERTIDA]: 'bg-green-500/15 text-green-400 border-green-500/30',
  [EstadoCita.CANCELADA]: 'bg-red-500/15 text-red-400 border-red-500/30',
  [EstadoCita.NO_ASISTIO]: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

const ESTADO_LABEL: Record<EstadoCita, string> = {
  [EstadoCita.PENDIENTE]: 'Pendiente',
  [EstadoCita.CONFIRMADA]: 'Confirmada',
  [EstadoCita.CONVERTIDA]: 'Convertida a OT',
  [EstadoCita.CANCELADA]: 'Cancelada',
  [EstadoCita.NO_ASISTIO]: 'No asistió',
}

function EstadoBadge({ estado }: { estado: EstadoCita }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', ESTADO_STYLE[estado])}>
      {ESTADO_LABEL[estado]}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CitasTable() {
  const { data: session } = useSession()
  const [data, setData] = useState<CitasResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [rango, setRango] = useState<Rango>('semana')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [estado, setEstado] = useState<EstadoCita | ''>('')
  const [page, setPage] = useState(1)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [recepcionModal, setRecepcionModal] = useState<{ citaId: string; clienteNombre: string; vehiculo: string } | null>(null)
  const [nuevaCitaModal, setNuevaCitaModal] = useState(false)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const fetchCitas = useCallback(async () => {
    if (!session?.user) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ rango, page: String(page), pageSize: '15' })
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (estado) params.set('estado', estado)

      const res = await fetch(`/api/citas?${params}`, {

      })
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [session, rango, page, debouncedSearch, estado])

  useEffect(() => {
    setPage(1)
  }, [rango, debouncedSearch, estado])

  useEffect(() => {
    fetchCitas()
  }, [fetchCitas])

  const cancelar = async (id: string) => {
    if (!session?.user) return
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/citas/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: EstadoCita.CANCELADA }),
      })
      if (!res.ok) return
      await fetchCitas()
    } finally {
      setUpdatingId(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Rango tabs */}
        <div className="flex rounded-lg border border-surface-2 overflow-hidden shrink-0">
          {(['hoy', 'semana', 'mes', 'todas'] as Rango[]).map((r) => (
            <button
              key={r}
              onClick={() => setRango(r)}
              className={cn(
                'px-4 py-2 text-sm capitalize transition-colors',
                rango === r
                  ? 'bg-secondary text-white font-medium'
                  : 'text-muted-foreground hover:text-white hover:bg-surface-2',
              )}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, placa o teléfono…"
            className="pl-9"
          />
        </div>

        {/* Estado filter */}
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value as EstadoCita | '')}
          className="h-10 rounded-md border border-surface-2 bg-surface-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary"
        >
          <option value="">Todos los estados</option>
          {Object.values(EstadoCita).map((e) => (
            <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
          ))}
        </select>

        <Button variant="outline" size="sm" onClick={fetchCitas} className="shrink-0">
          <RefreshCw className="h-4 w-4" />
        </Button>

        <Button variant="primary" size="sm" onClick={() => setNuevaCitaModal(true)} className="shrink-0 gap-1.5">
          <UserPlus className="h-4 w-4" />
          Cliente sin cita
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
            No hay citas para los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Vehículo</th>
                  <th className="px-4 py-3 text-left">Fecha / Hora</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Estado</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-2">
                {data.data.map((cita) => (
                  <tr key={cita.id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{cita.clienteNombre}</div>
                      <div className="text-muted-foreground text-xs">{cita.clienteTelefono}</div>
                      {/* Vehículo visible solo en móvil */}
                      <div className="sm:hidden text-xs text-accent mt-0.5">
                        {cita.marcaNombre} {cita.modeloNombre} {cita.anio} · <span className="text-muted-foreground">{cita.placa}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="text-white">{cita.marcaNombre} {cita.modeloNombre}</div>
                      <div className="text-muted-foreground text-xs">{cita.anio} · {cita.placa}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {/* cita.fecha es solo fecha ("YYYY-MM-DD"), sin hora — Date la interpreta
                          como medianoche UTC. Sin fijar el mediodía, Intl.DateTimeFormat la
                          renderiza en la zona horaria del navegador y en Honduras (UTC-6) siempre
                          cae un día atrás. */}
                      <div className="text-white">{formatDate(`${cita.fecha}T12:00:00`)}</div>
                      <div className="text-muted-foreground text-xs">{cita.hora}</div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <EstadoBadge estado={cita.estado} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {updatingId === cita.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : cita.ordenTrabajo ? (
                          /* Cita bloqueada — ya tiene OT asignada */
                          <div className="flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-accent leading-tight">
                                {cita.ordenTrabajo.numero}
                              </p>
                              <p className="text-[11px] text-muted-foreground leading-tight">
                                {cita.ordenTrabajo.tecnico.nombre}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <>
                            {(cita.estado === EstadoCita.PENDIENTE || cita.estado === EstadoCita.CONFIRMADA) && (
                              <button
                                onClick={() => setRecepcionModal({
                                  citaId: cita.id,
                                  clienteNombre: cita.clienteNombre,
                                  vehiculo: `${cita.marcaNombre} ${cita.modeloNombre} ${cita.anio}`,
                                })}
                                className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium"
                              >
                                <CarFront className="h-3.5 w-3.5" /> Recibir Vehículo
                              </button>
                            )}
                            {(cita.estado === EstadoCita.PENDIENTE || cita.estado === EstadoCita.CONFIRMADA) && (
                              <button
                                onClick={() => cancelar(cita.id)}
                                className="text-xs text-red-400 hover:text-red-300 underline"
                              >
                                Cancelar
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{data.total} citas · página {data.page} de {data.totalPages}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      {recepcionModal && (
        <RecepcionVehiculoModal
          citaId={recepcionModal.citaId}
          clienteNombre={recepcionModal.clienteNombre}
          vehiculo={recepcionModal.vehiculo}
          onClose={() => { setRecepcionModal(null); fetchCitas() }}
        />
      )}
      {nuevaCitaModal && (
        <NuevaCitaModal
          onClose={() => setNuevaCitaModal(false)}
          onCreated={() => { setNuevaCitaModal(false); fetchCitas() }}
        />
      )}
    </div>
  )
}

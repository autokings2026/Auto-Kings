'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Search, RefreshCw, ChevronLeft, ChevronRight, Loader2, CalendarClock, History, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'

interface ClienteResumen {
  id: string
  nombre: string
  telefono: string
  email: string | null
  citasPorHacer: number
  citasHechas: number
  ultimaCita: string | null
}

interface ClientesResponse {
  data: ClienteResumen[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function ClientesTable() {
  const { data: session } = useSession()
  const router = useRouter()

  const [data, setData] = useState<ClientesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [debouncedSearch])

  const fetchClientes = useCallback(async () => {
    if (!session?.user) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '15' })
      if (debouncedSearch) params.set('search', debouncedSearch)

      const res = await fetch(`/api/clientes/directorio?${params}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [session, debouncedSearch, page])

  useEffect(() => { fetchClientes() }, [fetchClientes])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono o email…"
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={fetchClientes} className="shrink-0">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground text-sm">
          {search ? 'No se encontraron clientes.' : 'Todavía no hay clientes registrados.'}
        </div>
      ) : (
        <div className="space-y-2">
          {data.data.map((c) => (
            <button
              key={c.id}
              onClick={() => router.push(`/clientes/${c.id}`)}
              className="w-full flex items-center justify-between gap-3 rounded-xl border border-surface-2 bg-surface hover:border-secondary/40 hover:bg-surface-2/50 transition-colors px-4 py-3 text-left"
            >
              <div className="min-w-0">
                <p className="font-medium text-white truncate">{c.nombre}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.telefono}</span>
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email ?? '—'}</span>
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1 text-xs">
                {c.citasPorHacer > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/15 text-blue-400 px-2.5 py-0.5 font-medium whitespace-nowrap">
                    <CalendarClock className="h-3 w-3" /> {c.citasPorHacer} por hacer
                  </span>
                ) : (
                  <span className="text-muted-foreground">Sin reservas próximas</span>
                )}
                <span className="flex items-center gap-1 text-muted-foreground whitespace-nowrap">
                  <History className="h-3 w-3" /> {c.citasHechas} hechas
                  {c.ultimaCita && <> · {formatDate(c.ultimaCita)}</>}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{data.total} clientes · página {data.page} de {data.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= data.totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Search, Car, Loader2, Gauge, Wallet, CalendarClock, ClipboardList, ExternalLink, User,
} from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { EstadoOT } from '@kings/shared'

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface VehiculoResultado {
  placa: string
  cliente: string
  marca: string
  modelo: string
  ultimaVisita: string
}

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

interface HistorialData {
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

// ── Componente principal ───────────────────────────────────────────────────────

export default function HistorialVehiculosPage() {
  const [q, setQ] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultados, setResultados] = useState<VehiculoResultado[]>([])
  const [seleccionado, setSeleccionado] = useState<VehiculoResultado | null>(null)
  const [data, setData] = useState<HistorialData | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  useEffect(() => {
    if (!q.trim()) { setResultados([]); return }
    const t = setTimeout(async () => {
      setBuscando(true)
      try {
        const res = await fetch(`/api/vehiculos/buscar?q=${encodeURIComponent(q.trim())}`)
        if (res.ok) setResultados(await res.json())
      } finally {
        setBuscando(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  const seleccionar = async (v: VehiculoResultado) => {
    setSeleccionado(v)
    setCargandoDetalle(true)
    setData(null)
    try {
      const res = await fetch(`/api/vehiculos/historial?placa=${encodeURIComponent(v.placa)}`)
      if (res.ok) setData(await res.json())
    } finally {
      setCargandoDetalle(false)
    }
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <Car className="h-5 w-5 sm:h-6 sm:w-6 text-accent shrink-0" />
          <span className="truncate">Historial de Vehículos</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Busca por placa o por nombre del cliente para ver todas sus órdenes de trabajo.
        </p>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setSeleccionado(null); setData(null) }}
          placeholder="Buscar por placa o cliente…"
          className="w-full h-11 rounded-lg bg-surface-2 border border-surface-2 text-sm text-white pl-9 pr-9 outline-none focus:ring-1 focus:ring-secondary placeholder:text-muted-foreground"
        />
        {buscando && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Resultados de búsqueda */}
      {!seleccionado && q.trim() && (
        <div className="space-y-1.5">
          {resultados.length === 0 && !buscando && (
            <p className="text-sm text-muted-foreground text-center py-8">Sin resultados para &quot;{q}&quot;.</p>
          )}
          {resultados.map((v) => (
            <button
              key={v.placa}
              onClick={() => seleccionar(v)}
              className="w-full flex items-center justify-between gap-3 rounded-xl border border-surface-2 bg-surface hover:border-secondary/40 hover:bg-surface-2/50 transition-colors px-4 py-3 text-left"
            >
              <div className="min-w-0">
                <p className="font-mono font-semibold text-white">{v.placa}</p>
                <p className="text-xs text-muted-foreground truncate">{v.marca} {v.modelo} · {v.cliente}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{formatDate(v.ultimaVisita)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Sin búsqueda todavía */}
      {!seleccionado && !q.trim() && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Escribe una placa o el nombre de un cliente para empezar.</p>
        </div>
      )}

      {/* Detalle del vehículo seleccionado */}
      {seleccionado && (
        <div className="space-y-4">
          <button onClick={() => { setSeleccionado(null); setData(null) }} className="text-xs text-accent hover:underline">
            ← Nueva búsqueda
          </button>

          <div className="rounded-xl border border-surface-2 bg-surface p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-mono text-lg font-bold text-white">{seleccionado.placa}</p>
                <p className="text-sm text-muted-foreground">{seleccionado.marca} {seleccionado.modelo}</p>
              </div>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" /> {seleccionado.cliente}
              </p>
            </div>
          </div>

          {cargandoDetalle ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data ? (
            <>
              {/* Resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <ResumenCard icon={Wallet} label="Total gastado" value={formatCurrency(data.resumen.totalGastado)} />
                <ResumenCard icon={ClipboardList} label="Visitas" value={String(data.resumen.visitas)} />
                <ResumenCard icon={CalendarClock} label="Última visita" value={formatDate(data.resumen.ultimaVisita)} />
                <ResumenCard icon={Gauge} label="Último kilometraje" value={data.resumen.ultimoKilometraje != null ? `${data.resumen.ultimoKilometraje.toLocaleString('es-HN')} km` : '—'} />
              </div>

              {/* Historial completo */}
              <div className="space-y-2">
                {data.historial.map((o) => (
                  <Link
                    key={o.id}
                    href={`/ordenes/${o.id}`}
                    className="block rounded-xl border border-surface-2 bg-surface hover:border-secondary/40 hover:bg-surface-2/50 transition-colors px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm text-white flex items-center gap-1.5">
                        {o.numero} <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </span>
                      <span className="text-white font-semibold">{formatCurrency(o.total)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{formatDate(o.createdAt)} · {o.kilometraje.toLocaleString('es-HN')} km</span>
                      {ESTADO_LABEL[o.estado] && (
                        <span className={cn('font-medium', ESTADO_STYLE[o.estado])}>{ESTADO_LABEL[o.estado]}</span>
                      )}
                    </div>
                    {o.diagnosticoTecnico && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{o.diagnosticoTecnico}</p>
                    )}
                  </Link>
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

function ResumenCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wide">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className="text-sm font-semibold text-white mt-0.5 truncate">{value}</p>
    </div>
  )
}

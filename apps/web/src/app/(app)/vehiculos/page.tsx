'use client'

import { useEffect, useMemo, useState } from 'react'
import { Car, Plus, Search, Eye, EyeOff, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface ModeloItem {
  id: string
  nombre: string
  activo: boolean
}

interface MarcaItem {
  id: string
  nombre: string
  activa: boolean
  modelos: ModeloItem[]
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function VehiculosPage() {
  const [marcas, setMarcas] = useState<MarcaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set())

  const [nuevaMarca, setNuevaMarca] = useState('')
  const [creandoMarca, setCreandoMarca] = useState(false)
  const [errorMarca, setErrorMarca] = useState('')

  const [togglingMarcaId, setTogglingMarcaId] = useState<string | null>(null)
  const [togglingModeloId, setTogglingModeloId] = useState<string | null>(null)

  const [nuevoModeloPorMarca, setNuevoModeloPorMarca] = useState<Record<string, string>>({})
  const [creandoModeloMarcaId, setCreandoModeloMarcaId] = useState<string | null>(null)
  const [errorModeloPorMarca, setErrorModeloPorMarca] = useState<Record<string, string>>({})

  const cargar = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/vehiculos')
    if (res.ok) setMarcas(await res.json())
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const marcasFiltradas = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return marcas
    return marcas.filter((m) => m.nombre.toLowerCase().includes(q))
  }, [marcas, search])

  const toggleExpandida = (id: string) =>
    setExpandidas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const crearMarca = async () => {
    const nombre = nuevaMarca.trim()
    if (!nombre) return
    setCreandoMarca(true)
    setErrorMarca('')
    try {
      const res = await fetch('/api/admin/vehiculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre }),
      })
      if (!res.ok) {
        const e = await res.json()
        setErrorMarca(e.message ?? 'Error al crear la marca')
        return
      }
      setNuevaMarca('')
      await cargar()
    } finally {
      setCreandoMarca(false)
    }
  }

  const toggleMarcaActiva = async (m: MarcaItem) => {
    setTogglingMarcaId(m.id)
    try {
      await fetch(`/api/admin/vehiculos/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: !m.activa }),
      })
      await cargar()
    } finally {
      setTogglingMarcaId(null)
    }
  }

  const toggleModeloActivo = async (marcaId: string, mo: ModeloItem) => {
    setTogglingModeloId(mo.id)
    try {
      await fetch(`/api/admin/vehiculos/${marcaId}/modelos/${mo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !mo.activo }),
      })
      await cargar()
    } finally {
      setTogglingModeloId(null)
    }
  }

  const crearModelo = async (marcaId: string) => {
    const nombre = (nuevoModeloPorMarca[marcaId] ?? '').trim()
    if (!nombre) return
    setCreandoModeloMarcaId(marcaId)
    setErrorModeloPorMarca((prev) => ({ ...prev, [marcaId]: '' }))
    try {
      const res = await fetch(`/api/admin/vehiculos/${marcaId}/modelos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre }),
      })
      if (!res.ok) {
        const e = await res.json()
        setErrorModeloPorMarca((prev) => ({ ...prev, [marcaId]: e.message ?? 'Error al crear el modelo' }))
        return
      }
      setNuevoModeloPorMarca((prev) => ({ ...prev, [marcaId]: '' }))
      await cargar()
    } finally {
      setCreandoModeloMarcaId(null)
    }
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Car className="h-5 w-5 sm:h-6 sm:w-6 text-accent shrink-0" />
            <span className="truncate">Catálogo de Vehículos</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {marcas.length} marca{marcas.length !== 1 ? 's' : ''} registrada{marcas.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Agregar marca */}
      <div className="bg-surface border border-surface-2 rounded-xl p-4 space-y-2">
        <label className="text-xs text-muted-foreground">Agregar marca nueva</label>
        <div className="flex gap-2">
          <input
            value={nuevaMarca}
            onChange={(e) => setNuevaMarca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && crearMarca()}
            placeholder="Ej: Toyota"
            className={inputCls}
          />
          <button
            onClick={crearMarca}
            disabled={creandoMarca || !nuevaMarca.trim()}
            className="shrink-0 flex items-center gap-2 bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 transition-colors"
          >
            {creandoMarca ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span className="hidden sm:inline">Agregar</span>
          </button>
        </div>
        {errorMarca && <p className="text-xs text-red-400">{errorMarca}</p>}
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar marca…"
          className={cn(inputCls, 'pl-9')}
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : marcasFiltradas.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Car className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{search ? 'No se encontraron marcas.' : 'No hay marcas registradas.'}</p>
          {!search && <p className="text-xs mt-1">Agrega la primera marca con el formulario de arriba.</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {marcasFiltradas.map((m) => (
            <MarcaRow
              key={m.id}
              marca={m}
              expandida={expandidas.has(m.id)}
              onToggleExpandir={() => toggleExpandida(m.id)}
              onToggleActiva={() => toggleMarcaActiva(m)}
              togglingMarca={togglingMarcaId === m.id}
              onToggleModelo={(mo) => toggleModeloActivo(m.id, mo)}
              togglingModeloId={togglingModeloId}
              nuevoModelo={nuevoModeloPorMarca[m.id] ?? ''}
              onChangeNuevoModelo={(v) => setNuevoModeloPorMarca((prev) => ({ ...prev, [m.id]: v }))}
              onCrearModelo={() => crearModelo(m.id)}
              creandoModelo={creandoModeloMarcaId === m.id}
              errorModelo={errorModeloPorMarca[m.id] ?? ''}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Fila de marca ──────────────────────────────────────────────────────────────

function MarcaRow({
  marca, expandida, onToggleExpandir, onToggleActiva, togglingMarca,
  onToggleModelo, togglingModeloId, nuevoModelo, onChangeNuevoModelo,
  onCrearModelo, creandoModelo, errorModelo,
}: {
  marca: MarcaItem
  expandida: boolean
  onToggleExpandir: () => void
  onToggleActiva: () => void
  togglingMarca: boolean
  onToggleModelo: (mo: ModeloItem) => void
  togglingModeloId: string | null
  nuevoModelo: string
  onChangeNuevoModelo: (v: string) => void
  onCrearModelo: () => void
  creandoModelo: boolean
  errorModelo: string
}) {
  return (
    <div className={cn(
      'bg-surface border border-surface-2 rounded-xl overflow-hidden transition-opacity',
      !marca.activa && 'opacity-60',
    )}>
      {/* Encabezado — clic expande, botón aparte para visibilidad */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-3">
        <button
          onClick={onToggleExpandir}
          className="flex flex-1 min-w-0 items-center gap-2 text-left"
        >
          {expandida ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{marca.nombre}</p>
            <p className="text-xs text-muted-foreground">
              {marca.modelos.length} modelo{marca.modelos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </button>
        <button
          onClick={onToggleActiva}
          disabled={togglingMarca}
          className={cn(
            'shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors',
            marca.activa
              ? 'text-green-400 hover:bg-green-400/10'
              : 'text-muted-foreground hover:bg-surface-2',
          )}
        >
          {togglingMarca ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : marca.activa ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">{marca.activa ? 'Visible' : 'Oculta'}</span>
        </button>
      </div>

      {/* Modelos — solo si está expandida */}
      {expandida && (
        <div className="border-t border-surface-2 px-3 sm:px-4 py-3 space-y-3 bg-surface-2/30">
          <div className="flex flex-wrap gap-2">
            {marca.modelos.length === 0 && (
              <p className="text-xs text-muted-foreground">Sin modelos todavía.</p>
            )}
            {marca.modelos.map((mo) => (
              <button
                key={mo.id}
                onClick={() => onToggleModelo(mo)}
                disabled={togglingModeloId === mo.id}
                title={mo.activo ? 'Clic para ocultar' : 'Clic para mostrar'}
                className={cn(
                  'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                  mo.activo
                    ? 'border-secondary/40 text-foreground hover:bg-secondary/10'
                    : 'border-surface-2 text-muted-foreground/60 line-through hover:bg-surface-2',
                )}
              >
                {togglingModeloId === mo.id && <Loader2 className="h-3 w-3 animate-spin" />}
                {mo.nombre}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={nuevoModelo}
              onChange={(e) => onChangeNuevoModelo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onCrearModelo()}
              placeholder="Agregar modelo…"
              className={inputClsSm}
            />
            <button
              onClick={onCrearModelo}
              disabled={creandoModelo || !nuevoModelo.trim()}
              className="shrink-0 flex items-center gap-1.5 text-xs bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-white font-medium rounded-lg px-3 transition-colors"
            >
              {creandoModelo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Agregar
            </button>
          </div>
          {errorModelo && <p className="text-xs text-red-400">{errorModelo}</p>}
        </div>
      )}
    </div>
  )
}

// ── Helpers UI ─────────────────────────────────────────────────────────────────

const inputCls = 'w-full h-10 rounded-lg bg-surface-2 border border-surface-2 text-sm text-white px-3 outline-none focus:ring-1 focus:ring-secondary placeholder:text-muted-foreground'
const inputClsSm = 'w-full h-9 rounded-lg bg-surface border border-surface-2 text-xs text-white px-3 outline-none focus:ring-1 focus:ring-secondary placeholder:text-muted-foreground'

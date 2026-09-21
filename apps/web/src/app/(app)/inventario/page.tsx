'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Package, Plus, Search, Loader2, AlertTriangle, Pencil, ArrowDownToLine,
  SlidersHorizontal, X, Check, EyeOff, Eye,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface InventarioItem {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  precioVenta: string
  precioCosto: string | null
  stockActual: string
  stockMinimo: string
  unidad: string
  proveedor: string | null
  activo: boolean
}

function bajoMinimo(item: InventarioItem) {
  return Number(item.stockActual) <= Number(item.stockMinimo)
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function InventarioPage() {
  const [items, setItems] = useState<InventarioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [soloBajoMinimo, setSoloBajoMinimo] = useState(false)
  const [creando, setCreando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [movimientoId, setMovimientoId] = useState<string | null>(null)

  const cargar = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/inventario?soloActivos=false')
      if (res.ok) setItems(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((i) => {
      if (soloBajoMinimo && !bajoMinimo(i)) return false
      if (!q) return true
      return i.nombre.toLowerCase().includes(q) || i.codigo.toLowerCase().includes(q)
    })
  }, [items, search, soloBajoMinimo])

  const countBajoMinimo = useMemo(() => items.filter((i) => i.activo && bajoMinimo(i)).length, [items])

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-accent shrink-0" />
            <span className="truncate">Inventario</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {items.filter((i) => i.activo).length} parte{items.length !== 1 ? 's' : ''} activa{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setCreando((v) => !v)}
          className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white text-sm font-medium rounded-lg px-4 h-10 transition-colors"
        >
          {creando ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {creando ? 'Cancelar' : 'Agregar parte'}
        </button>
      </div>

      {/* Alerta de bajo mínimo */}
      {countBajoMinimo > 0 && !soloBajoMinimo && (
        <button
          onClick={() => setSoloBajoMinimo(true)}
          className="w-full flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 rounded-lg px-3 py-2.5 transition-colors text-left"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {countBajoMinimo} parte{countBajoMinimo !== 1 ? 's' : ''} en o bajo el punto de reorden — clic para verlas.
        </button>
      )}

      {/* Crear */}
      {creando && (
        <InventarioForm
          onCancel={() => setCreando(false)}
          onSaved={() => { setCreando(false); cargar() }}
        />
      )}

      {/* Buscador + filtro */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o código…"
            className={cn(inputCls, 'pl-9')}
          />
        </div>
        <button
          onClick={() => setSoloBajoMinimo((v) => !v)}
          className={cn(
            'shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 rounded-lg border transition-colors',
            soloBajoMinimo
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
              : 'border-surface-2 text-muted-foreground hover:text-foreground',
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Bajo mínimo</span>
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{search || soloBajoMinimo ? 'No se encontraron partes.' : 'No hay partes registradas.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map((item) => (
            <InventarioRow
              key={item.id}
              item={item}
              editando={editandoId === item.id}
              onToggleEditar={() => setEditandoId((v) => (v === item.id ? null : item.id))}
              registrandoMovimiento={movimientoId === item.id}
              onToggleMovimiento={() => setMovimientoId((v) => (v === item.id ? null : item.id))}
              onSaved={() => { setEditandoId(null); setMovimientoId(null); cargar() }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Fila de parte ──────────────────────────────────────────────────────────────

function InventarioRow({
  item, editando, onToggleEditar, registrandoMovimiento, onToggleMovimiento, onSaved,
}: {
  item: InventarioItem
  editando: boolean
  onToggleEditar: () => void
  registrandoMovimiento: boolean
  onToggleMovimiento: () => void
  onSaved: () => void
}) {
  const [togglingActivo, setTogglingActivo] = useState(false)
  const critico = bajoMinimo(item)

  const toggleActivo = async () => {
    setTogglingActivo(true)
    try {
      await fetch(`/api/inventario/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !item.activo }),
      })
      onSaved()
    } finally {
      setTogglingActivo(false)
    }
  }

  if (editando) {
    return (
      <div className="bg-surface border border-secondary/40 rounded-xl p-4">
        <InventarioForm item={item} onCancel={onToggleEditar} onSaved={onSaved} />
      </div>
    )
  }

  return (
    <div className={cn(
      'bg-surface border border-surface-2 rounded-xl overflow-hidden transition-opacity',
      !item.activo && 'opacity-50',
    )}>
      <div className="flex items-center gap-3 px-3 sm:px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground truncate">{item.nombre}</p>
            {critico && item.activo && (
              <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                <AlertTriangle className="h-2.5 w-2.5" /> Bajo mínimo
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-mono">{item.codigo}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-medium text-white">{formatCurrency(item.precioVenta)}</p>
          <p className={cn('text-xs', critico ? 'text-amber-400' : 'text-muted-foreground')}>
            Stock: {Number(item.stockActual)} / mín. {Number(item.stockMinimo)} {item.unidad}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleMovimiento}
            title="Registrar entrada o ajuste"
            className="p-2 text-muted-foreground hover:text-secondary hover:bg-surface-2 rounded-lg"
          >
            <ArrowDownToLine className="h-4 w-4" />
          </button>
          <button
            onClick={onToggleEditar}
            title="Editar"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded-lg"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={toggleActivo}
            disabled={togglingActivo}
            title={item.activo ? 'Desactivar' : 'Activar'}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded-lg"
          >
            {togglingActivo ? <Loader2 className="h-4 w-4 animate-spin" /> : item.activo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {registrandoMovimiento && (
        <div className="border-t border-surface-2 px-3 sm:px-4 py-3 bg-surface-2/30">
          <MovimientoForm inventarioId={item.id} onCancel={onToggleMovimiento} onSaved={onSaved} />
        </div>
      )}
    </div>
  )
}

// ── Formulario crear/editar ─────────────────────────────────────────────────────

function InventarioForm({
  item, onCancel, onSaved,
}: {
  item?: InventarioItem
  onCancel: () => void
  onSaved: () => void
}) {
  const esEdicion = !!item
  const [codigo, setCodigo] = useState(item?.codigo ?? '')
  const [nombre, setNombre] = useState(item?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(item?.descripcion ?? '')
  const [precioVenta, setPrecioVenta] = useState(item?.precioVenta ?? '')
  const [precioCosto, setPrecioCosto] = useState(item?.precioCosto ?? '')
  const [stockMinimo, setStockMinimo] = useState(item?.stockMinimo ?? '0')
  const [unidad, setUnidad] = useState(item?.unidad ?? 'unidad')
  const [proveedor, setProveedor] = useState(item?.proveedor ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const guardar = async () => {
    if (!esEdicion && !codigo.trim()) { setError('El código es requerido'); return }
    if (!nombre.trim()) { setError('El nombre es requerido'); return }
    if (!precioVenta || Number(precioVenta) < 0) { setError('El precio de venta es requerido'); return }
    setSaving(true); setError('')
    try {
      const url = esEdicion ? `/api/inventario/${item!.id}` : '/api/inventario'
      const res = await fetch(url, {
        method: esEdicion ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(esEdicion ? {} : { codigo: codigo.trim() }),
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          precioVenta: Number(precioVenta),
          precioCosto: precioCosto ? Number(precioCosto) : undefined,
          stockMinimo: Number(stockMinimo || 0),
          unidad: unidad.trim() || 'unidad',
          proveedor: proveedor.trim() || undefined,
        }),
      })
      if (!res.ok) { const e = await res.json(); setError(e.message ?? 'Error al guardar'); return }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cn(!esEdicion && 'bg-surface border border-surface-2 rounded-xl p-4', 'space-y-3')}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {!esEdicion && (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Código (SKU) *</label>
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} className={inputCls} placeholder="Ej: FRENO-001" />
          </div>
        )}
        <div className="space-y-1 col-span-2 sm:col-span-1">
          <label className="text-xs text-muted-foreground">Nombre *</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputCls} placeholder="Ej: Pastillas de freno" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Unidad</label>
          <input value={unidad} onChange={(e) => setUnidad(e.target.value)} className={inputCls} placeholder="unidad, litro, juego…" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Precio de venta (L.) *</label>
          <input value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} type="number" min="0" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Precio de costo (L.)</label>
          <input value={precioCosto ?? ''} onChange={(e) => setPrecioCosto(e.target.value)} type="number" min="0" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Punto de reorden</label>
          <input value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} type="number" min="0" className={inputCls} />
        </div>
        <div className="space-y-1 col-span-2 sm:col-span-1">
          <label className="text-xs text-muted-foreground">Proveedor</label>
          <input value={proveedor ?? ''} onChange={(e) => setProveedor(e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1 col-span-2 sm:col-span-3">
          <label className="text-xs text-muted-foreground">Descripción</label>
          <input value={descripcion ?? ''} onChange={(e) => setDescripcion(e.target.value)} className={inputCls} />
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={guardar}
          disabled={saving}
          className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 h-9 transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Guardar
        </button>
        <button onClick={onCancel} disabled={saving} className="text-sm text-muted-foreground hover:text-foreground px-3 h-9">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Formulario de movimiento manual (entrada / ajuste) ──────────────────────────

function MovimientoForm({
  inventarioId, onCancel, onSaved,
}: {
  inventarioId: string
  onCancel: () => void
  onSaved: () => void
}) {
  const [tipo, setTipo] = useState<'ENTRADA' | 'AJUSTE'>('ENTRADA')
  const [cantidad, setCantidad] = useState('')
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const registrar = async () => {
    const n = Number(cantidad)
    if (!cantidad || n === 0) { setError('Ingresa una cantidad distinta de cero'); return }
    if (tipo === 'ENTRADA' && n < 0) { setError('La cantidad de una entrada debe ser positiva'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/inventario/${inventarioId}/movimientos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, cantidad: n, nota: nota.trim() || undefined }),
      })
      if (!res.ok) { const e = await res.json(); setError(e.message ?? 'Error al registrar'); return }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => setTipo('ENTRADA')}
          className={cn(
            'flex-1 text-xs font-medium py-2 rounded-lg border transition-colors',
            tipo === 'ENTRADA' ? 'border-secondary bg-secondary/15 text-secondary' : 'border-surface-2 text-muted-foreground',
          )}
        >
          Entrada (compra, devolución)
        </button>
        <button
          onClick={() => setTipo('AJUSTE')}
          className={cn(
            'flex-1 text-xs font-medium py-2 rounded-lg border transition-colors',
            tipo === 'AJUSTE' ? 'border-secondary bg-secondary/15 text-secondary' : 'border-surface-2 text-muted-foreground',
          )}
        >
          Ajuste (conteo físico)
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          type="number"
          placeholder={tipo === 'AJUSTE' ? 'Cantidad (puede ser negativa)' : 'Cantidad'}
          className={inputCls}
        />
        <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota (opcional)" className={inputCls} />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={registrar}
          disabled={saving}
          className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-white text-xs font-medium rounded-lg px-3 h-8 transition-colors"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Registrar
        </button>
        <button onClick={onCancel} disabled={saving} className="text-xs text-muted-foreground hover:text-foreground px-2 h-8">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Helpers UI ─────────────────────────────────────────────────────────────────

const inputCls = 'w-full h-9 rounded-lg bg-surface-2 border border-surface-2 text-sm text-white px-3 outline-none focus:ring-1 focus:ring-secondary placeholder:text-muted-foreground'

'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export interface InventarioPickerResult {
  id: string
  codigo: string
  nombre: string
  precioVenta: string
  stockActual: string
  unidad: string
}

// Autocompletado de partes del catálogo de inventario. Al seleccionar una,
// el caller recibe el ítem completo (precioVenta se copia como snapshot
// congelado — no cambia si luego cambia el precio del catálogo).
export function InventarioPicker({ onSelect }: { onSelect: (item: InventarioPickerResult) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resultados, setResultados] = useState<InventarioPickerResult[]>([])
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!q.trim()) { setResultados([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/inventario?picker=true&q=${encodeURIComponent(q.trim())}`)
        if (res.ok) setResultados(await res.json())
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar parte en inventario…"
          className="w-full h-9 text-xs rounded-lg border border-surface-2 bg-surface-2 pl-8 pr-7 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-secondary"
        />
        {loading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>
      {open && resultados.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-surface-2 bg-surface shadow-xl">
          {resultados.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { onSelect(item); setQ(''); setResultados([]); setOpen(false) }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-surface-2 border-b border-surface-2 last:border-0"
            >
              <span className="min-w-0">
                <span className="block text-white truncate">{item.nombre}</span>
                <span className="block text-muted-foreground">{item.codigo} · stock {Number(item.stockActual)} {item.unidad}</span>
              </span>
              <span className="shrink-0 text-accent font-medium">{formatCurrency(item.precioVenta)}</span>
            </button>
          ))}
        </div>
      )}
      {open && q.trim() && !loading && resultados.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-surface-2 bg-surface shadow-xl px-3 py-2 text-xs text-muted-foreground">
          Sin resultados para &quot;{q}&quot;
        </div>
      )}
    </div>
  )
}

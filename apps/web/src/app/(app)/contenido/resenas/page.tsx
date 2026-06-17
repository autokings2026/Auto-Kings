'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, XCircle, Clock, Trash2, Star } from 'lucide-react'

interface Resena {
  id: string
  nombre: string
  vehiculoMarca: string | null
  vehiculoModelo: string | null
  vehiculoAnio: number | null
  calificacion: number
  comentario: string
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'
  createdAt: string
}

const ESTADO_CONFIG = {
  PENDIENTE: { label: 'Pendiente', class: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: Clock },
  APROBADA: { label: 'Aprobada', class: 'bg-green-500/10 text-green-400 border-green-500/20', icon: CheckCircle2 },
  RECHAZADA: { label: 'Rechazada', class: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
}

const FILTROS = ['TODAS', 'PENDIENTE', 'APROBADA', 'RECHAZADA'] as const

export default function AdminResenasPage() {
  const [resenas, setResenas] = useState<Resena[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<typeof FILTROS[number]>('PENDIENTE')
  const [actualizando, setActualizando] = useState<string | null>(null)

  const cargar = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/resenas')
      .then(r => r.json())
      .then(data => { setResenas(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const cambiarEstado = async (id: string, estado: 'APROBADA' | 'RECHAZADA') => {
    setActualizando(id)
    await fetch(`/api/admin/resenas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    setResenas(prev => prev.map(r => r.id === id ? { ...r, estado } : r))
    setActualizando(null)
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta reseña?')) return
    await fetch(`/api/admin/resenas/${id}`, { method: 'DELETE' })
    setResenas(prev => prev.filter(r => r.id !== id))
  }

  const filtradas = filtro === 'TODAS' ? resenas : resenas.filter(r => r.estado === filtro)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Reseñas de Clientes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Aprueba o rechaza las reseñas antes de publicarlas en la landing page.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTROS.map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtro === f
                ? 'bg-secondary text-white'
                : 'border border-border text-muted-foreground hover:text-foreground hover:bg-surface-2'
            }`}
          >
            {f === 'TODAS' ? 'Todas' : ESTADO_CONFIG[f].label}
            <span className="ml-2 text-xs opacity-60">
              ({f === 'TODAS' ? resenas.length : resenas.filter(r => r.estado === f).length})
            </span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      )}

      {!loading && filtradas.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="text-muted-foreground text-sm">No hay reseñas en esta categoría.</p>
        </div>
      )}

      {!loading && filtradas.length > 0 && (
        <div className="space-y-3">
          {filtradas.map(r => {
            const cfg = ESTADO_CONFIG[r.estado]
            return (
              <div key={r.id} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-foreground text-sm">{r.nombre}</p>
                      {[r.vehiculoMarca, r.vehiculoModelo, r.vehiculoAnio].filter(Boolean).length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          — {[r.vehiculoMarca, r.vehiculoModelo, r.vehiculoAnio].filter(Boolean).join(' ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${i < r.calificacion ? 'text-yellow-400 fill-yellow-400' : 'text-border'}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{r.comentario}&rdquo;</p>
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      {new Date(r.createdAt).toLocaleDateString('es-HN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.class}`}>
                      <cfg.icon className="h-3 w-3" />
                      {cfg.label}
                    </span>

                    <div className="flex items-center gap-2">
                      {r.estado !== 'APROBADA' && (
                        <button
                          onClick={() => cambiarEstado(r.id, 'APROBADA')}
                          disabled={actualizando === r.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Aprobar
                        </button>
                      )}
                      {r.estado !== 'RECHAZADA' && (
                        <button
                          onClick={() => cambiarEstado(r.id, 'RECHAZADA')}
                          disabled={actualizando === r.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Rechazar
                        </button>
                      )}
                      <button
                        onClick={() => eliminar(r.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

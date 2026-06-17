'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Trash2, Upload, Eye, EyeOff, Loader2, Plus } from 'lucide-react'

interface GaleriaItem {
  id: string
  url: string
  descripcion: string | null
  categoria: string | null
  activo: boolean
  orden: number
}

const CATEGORIAS = ['FRENOS', 'MOTOR', 'DIAGNOSTICO', 'ELECTRICO', 'MANTENIMIENTO', 'OTRO'] as const
type Categoria = typeof CATEGORIAS[number]

const CATEGORIA_LABEL: Record<Categoria, string> = {
  FRENOS: 'Frenos', MOTOR: 'Motor', DIAGNOSTICO: 'Diagnóstico',
  ELECTRICO: 'Eléctrico', MANTENIMIENTO: 'Mantenimiento', OTRO: 'Otro',
}

export default function AdminGaleriaPage() {
  const [items, setItems] = useState<GaleriaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [desc, setDesc] = useState('')
  const [cat, setCat] = useState<Categoria>('OTRO')
  const [actualizando, setActualizando] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const cargar = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/galeria')
      .then(r => r.json())
      .then(data => { setItems(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', preset ?? 'kings_unsigned')
    formData.append('folder', 'kings-auto/galeria')

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message ?? 'Error al subir')

      const saveRes = await fetch('/api/admin/galeria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: data.secure_url,
          publicId: data.public_id,
          descripcion: desc || undefined,
          categoria: cat,
        }),
      })
      const saved = await saveRes.json()
      setItems(prev => [saved, ...prev])
      setDesc('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      alert('Error al subir imagen. Intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const toggleActivo = async (item: GaleriaItem) => {
    setActualizando(item.id)
    const res = await fetch(`/api/admin/galeria/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !item.activo }),
    })
    const updated = await res.json()
    setItems(prev => prev.map(i => i.id === item.id ? updated : i))
    setActualizando(null)
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta foto de la galería?')) return
    await fetch(`/api/admin/galeria/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Galería de Trabajos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sube fotos que aparecerán en la landing page. Solo las marcadas como visibles se muestran.
        </p>
      </div>

      {/* Upload */}
      <div className="rounded-xl border border-border bg-surface p-6 mb-8">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-secondary" />
          Agregar Foto
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Categoría</label>
            <select
              value={cat}
              onChange={e => setCat(e.target.value as Categoria)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-2 text-foreground text-sm focus:outline-none focus:border-secondary/50"
            >
              {CATEGORIAS.map(c => (
                <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Descripción (opcional)</label>
            <input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Ej: Cambio de discos de freno"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-2 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-secondary/50"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Imagen</label>
            <label className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
              uploading
                ? 'border-border text-muted-foreground opacity-50 cursor-not-allowed'
                : 'border-secondary/30 text-secondary hover:bg-secondary/10'
            }`}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="text-muted-foreground text-sm">No hay fotos en la galería. Sube la primera.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map(item => (
            <div
              key={item.id}
              className={`relative rounded-xl overflow-hidden group border transition-colors ${
                item.activo ? 'border-border' : 'border-dashed border-border/40 opacity-60'
              }`}
            >
              <div className="aspect-square relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.descripcion ?? ''}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Overlay con acciones */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <button
                  onClick={() => toggleActivo(item)}
                  disabled={actualizando === item.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    item.activo
                      ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30'
                      : 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  {actualizando === item.id
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : item.activo ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />
                  }
                  {item.activo ? 'Ocultar' : 'Mostrar'}
                </button>
                <button
                  onClick={() => eliminar(item.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-xs font-medium transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Eliminar
                </button>
              </div>

              {/* Badge categoría */}
              {item.categoria && (
                <div className="absolute top-2 left-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/60 text-white/80">
                    {CATEGORIA_LABEL[item.categoria as Categoria] ?? item.categoria}
                  </span>
                </div>
              )}

              {/* Badge oculto */}
              {!item.activo && (
                <div className="absolute top-2 right-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-yellow-500/80 text-black">
                    Oculto
                  </span>
                </div>
              )}

              {/* Descripción guardada */}
              {item.descripcion && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-[10px] text-white/90 line-clamp-2">{item.descripcion}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

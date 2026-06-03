'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Upload, X, Loader2, ImageIcon, CheckCircle, Tag } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!

interface TipoFoto {
  id: string
  nombre: string
}

interface FotoIngreso {
  id: string
  url: string
  publicId: string
  createdAt: string
  tipoFoto?: { id: string; nombre: string } | null
}

interface FotoUploadProps {
  ordenId: string
  fotos: FotoIngreso[]
  onUpdate: (fotos: FotoIngreso[]) => void
  readonly?: boolean
}

interface UploadItem {
  id: string
  file: File
  preview: string
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
  tipoFotoId?: string | null
}

export function FotoUpload({ ordenId, fotos, onUpdate, readonly = false }: FotoUploadProps) {
  const { data: session } = useSession()
  const [queue, setQueue] = useState<UploadItem[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [tipos, setTipos] = useState<TipoFoto[]>([])
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>('')

  // ── Cargar tipos desde la API ─────────────────────────────────────────────

  useEffect(() => {
    if (readonly) return
    fetch('/api/tipos-foto')
      .then((r) => r.json())
      .then((data: TipoFoto[]) => setTipos(data))
      .catch(() => null)
  }, [readonly])

  // ── Upload a Cloudinary ──────────────────────────────────────────────────

  const uploadOne = useCallback(
    async (item: UploadItem) => {
      setQueue((q) =>
        q.map((i) => (i.id === item.id ? { ...i, status: 'uploading', progress: 10 } : i)),
      )

      try {
        const formData = new FormData()
        formData.append('file', item.file)
        formData.append('upload_preset', UPLOAD_PRESET)
        formData.append('folder', `kings-auto/ordenes/${ordenId}`)

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          { method: 'POST', body: formData },
        )

        if (!cloudRes.ok) throw new Error('Error al subir a Cloudinary')
        const cloudData = await cloudRes.json()

        setQueue((q) =>
          q.map((i) => (i.id === item.id ? { ...i, progress: 70 } : i)),
        )

        const apiRes = await fetch(`/api/ordenes/${ordenId}/fotos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: cloudData.secure_url as string,
            publicId: cloudData.public_id as string,
            tipoFotoId: item.tipoFotoId ?? null,
          }),
        })

        if (!apiRes.ok) throw new Error('Error al guardar foto en el servidor')
        const nueva: FotoIngreso = await apiRes.json()

        setQueue((q) =>
          q.map((i) => (i.id === item.id ? { ...i, status: 'done', progress: 100 } : i)),
        )

        onUpdate([...fotos, nueva])

        setTimeout(() => {
          setQueue((q) => q.filter((i) => i.id !== item.id))
        }, 2000)
      } catch (err) {
        setQueue((q) =>
          q.map((i) =>
            i.id === item.id
              ? { ...i, status: 'error', error: (err as Error).message }
              : i,
          ),
        )
      }
    },
    [ordenId, fotos, onUpdate, session],
  )

  // ── Procesar archivos seleccionados ───────────────────────────────────────

  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files || readonly) return
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
      const newItems: UploadItem[] = []

      for (const file of Array.from(files)) {
        if (!allowed.includes(file.type) && !file.name.match(/\.(heic|heif)$/i)) continue
        if (file.size > 10 * 1024 * 1024) continue

        const item: UploadItem = {
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview: URL.createObjectURL(file),
          progress: 0,
          status: 'pending',
          tipoFotoId: tipoSeleccionado || null,
        }
        newItems.push(item)
      }

      if (newItems.length === 0) return
      setQueue((q) => [...q, ...newItems])
      newItems.forEach((item) => uploadOne(item))
    },
    [readonly, uploadOne, tipoSeleccionado],
  )

  // ── Eliminar foto ─────────────────────────────────────────────────────────

  const deleteFoto = async (fotoId: string) => {
    setDeletingId(fotoId)
    try {
      await fetch(`/api/ordenes/${ordenId}/fotos/${fotoId}`, { method: 'DELETE' })
      onUpdate(fotos.filter((f) => f.id !== fotoId))
    } finally {
      setDeletingId(null)
    }
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      processFiles(e.dataTransfer.files)
    },
    [processFiles],
  )

  const totalFotos = fotos.length + queue.filter((q) => q.status !== 'error').length

  return (
    <div className="space-y-4">
      {/* Selector de tipo + zona de drop */}
      {!readonly && (
        <div className="space-y-3">
          {/* Dropdown de tipo */}
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={tipoSeleccionado} onValueChange={setTipoSeleccionado}>
              <SelectTrigger className="flex-1 bg-surface-2 border-surface-2 text-sm h-9">
                <SelectValue placeholder="Selecciona el tipo de foto…" />
              </SelectTrigger>
              <SelectContent className="bg-surface border-surface-2">
                {tipos.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-sm">
                    {t.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Zona de drop */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors',
              dragging
                ? 'border-secondary bg-secondary/10'
                : 'border-surface-2 hover:border-secondary/50 hover:bg-surface-2/50',
            )}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium text-white">
                Arrastra fotos aquí o haz click para seleccionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, WebP · Máx. 10 MB por foto
              </p>
              {tipoSeleccionado && tipos.length > 0 && (
                <p className="text-xs text-accent mt-1">
                  Tipo: {tipos.find((t) => t.id === tipoSeleccionado)?.nombre}
                </p>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => processFiles(e.target.files)}
            />
          </div>
        </div>
      )}

      {/* Contador */}
      {totalFotos > 0 && (
        <p className="text-xs text-muted-foreground">
          {totalFotos} foto{totalFotos !== 1 ? 's' : ''}
        </p>
      )}

      {/* Grid de fotos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {/* Fotos guardadas */}
        {fotos.map((foto) => (
          <div key={foto.id} className="group relative aspect-square rounded-lg overflow-hidden bg-surface-2">
            <Image
              src={foto.url}
              alt={foto.tipoFoto?.nombre ?? 'Foto de ingreso'}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            />
            {/* Etiqueta del tipo */}
            {foto.tipoFoto && (
              <div className="absolute bottom-0 inset-x-0 bg-black/70 px-1.5 py-1">
                <p className="text-white text-[10px] leading-tight truncate text-center">
                  {foto.tipoFoto.nombre}
                </p>
              </div>
            )}
            {!readonly && (
              <button
                onClick={() => deleteFoto(foto.id)}
                disabled={deletingId === foto.id}
                className="absolute top-1.5 right-1.5 rounded-full bg-black/70 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                {deletingId === foto.id ? (
                  <Loader2 className="h-3 w-3 animate-spin text-white" />
                ) : (
                  <X className="h-3 w-3 text-white" />
                )}
              </button>
            )}
          </div>
        ))}

        {/* Fotos en cola (subiendo) */}
        {queue.map((item) => (
          <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-surface-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.preview} alt="preview" className="w-full h-full object-cover" />

            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1.5">
              {item.status === 'uploading' && (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                  <div className="w-3/4 bg-white/20 rounded-full h-1">
                    <div
                      className="bg-secondary h-1 rounded-full transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <span className="text-white text-xs">{item.progress}%</span>
                </>
              )}
              {item.status === 'done' && (
                <CheckCircle className="h-8 w-8 text-green-400" />
              )}
              {item.status === 'error' && (
                <>
                  <X className="h-6 w-6 text-red-400" />
                  <span className="text-red-300 text-xs text-center px-1">{item.error}</span>
                </>
              )}
            </div>
          </div>
        ))}

        {/* Placeholder vacío */}
        {totalFotos === 0 && readonly && (
          <div className="aspect-square rounded-lg bg-surface-2 flex items-center justify-center col-span-2 sm:col-span-3 md:col-span-4">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Sin fotos registradas</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

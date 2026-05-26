'use client'

import { useCallback, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Upload, X, Loader2, ImageIcon, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface FotoIngreso {
  id: string
  url: string
  publicId: string
  createdAt: string
}

interface FotoUploadProps {
  ordenId: string
  fotos: FotoIngreso[]
  onUpdate: (fotos: FotoIngreso[]) => void
  readonly?: boolean
}

interface UploadItem {
  id: string          // id local para tracking
  file: File
  preview: string
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

export function FotoUpload({ ordenId, fotos, onUpdate, readonly = false }: FotoUploadProps) {
  const { data: session } = useSession()
  const [queue, setQueue] = useState<UploadItem[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  // ── Upload a Cloudinary ──────────────────────────────────────────────────

  const uploadOne = useCallback(
    async (item: UploadItem) => {
      setQueue((q) =>
        q.map((i) => (i.id === item.id ? { ...i, status: 'uploading', progress: 10 } : i)),
      )

      try {
        // 1. Subir a Cloudinary
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

        // 2. Guardar en el API
        const apiRes = await fetch(`${API}/ordenes/${ordenId}/fotos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.user?.accessToken}`,
          },
          body: JSON.stringify({
            url: cloudData.secure_url as string,
            publicId: cloudData.public_id as string,
          }),
        })

        if (!apiRes.ok) throw new Error('Error al guardar foto en el servidor')
        const nueva: FotoIngreso = await apiRes.json()

        setQueue((q) =>
          q.map((i) => (i.id === item.id ? { ...i, status: 'done', progress: 100 } : i)),
        )

        onUpdate([...fotos, nueva])

        // Limpiar del queue después de 2s
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
        if (file.size > 10 * 1024 * 1024) continue // max 10 MB

        const item: UploadItem = {
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview: URL.createObjectURL(file),
          progress: 0,
          status: 'pending',
        }
        newItems.push(item)
      }

      if (newItems.length === 0) return
      setQueue((q) => [...q, ...newItems])

      // Subir en paralelo
      newItems.forEach((item) => uploadOne(item))
    },
    [readonly, uploadOne],
  )

  // ── Eliminar foto ─────────────────────────────────────────────────────────

  const deleteFoto = async (fotoId: string) => {
    setDeletingId(fotoId)
    try {
      await fetch(`${API}/ordenes/${ordenId}/fotos/${fotoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
      })
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
      {/* Zona de drop */}
      {!readonly && (
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
              alt="Foto de ingreso"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            />
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
            {/* Preview */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.preview}
              alt="preview"
              className="w-full h-full object-cover"
            />

            {/* Overlay */}
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

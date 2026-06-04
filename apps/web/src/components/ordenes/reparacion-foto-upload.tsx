'use client'

import { useCallback, useRef, useState } from 'react'
import { Upload, X, Loader2, ImageIcon, CheckCircle, Camera } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!

export interface FotoRep {
  id: string
  url: string
  publicId: string
  createdAt: string
}

interface UploadItem {
  id: string
  file: File
  preview: string
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

interface Props {
  ordenId: string
  fotos: FotoRep[]
  onUpdate: (fotos: FotoRep[]) => void
  readonly?: boolean
}

export function ReparacionFotoUpload({ ordenId, fotos, onUpdate, readonly = false }: Props) {
  const [queue, setQueue]         = useState<UploadItem[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dragging, setDragging]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadOne = useCallback(async (item: UploadItem) => {
    setQueue(q => q.map(i => i.id === item.id ? { ...i, status: 'uploading', progress: 10 } : i))

    try {
      const fd = new FormData()
      fd.append('file', item.file)
      fd.append('upload_preset', UPLOAD_PRESET)
      fd.append('folder', `kings-auto/reparaciones/${ordenId}`)

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: fd },
      )
      if (!cloudRes.ok) throw new Error('Error al subir imagen')
      const cloud = await cloudRes.json()

      setQueue(q => q.map(i => i.id === item.id ? { ...i, progress: 75 } : i))

      const apiRes = await fetch(`/api/ordenes/${ordenId}/reparacion/fotos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cloud.secure_url, publicId: cloud.public_id }),
      })
      if (!apiRes.ok) throw new Error('Error al guardar foto')
      const nueva: FotoRep = await apiRes.json()

      setQueue(q => q.map(i => i.id === item.id ? { ...i, status: 'done', progress: 100 } : i))
      onUpdate([...fotos, nueva])
      setTimeout(() => setQueue(q => q.filter(i => i.id !== item.id)), 1800)
    } catch (err) {
      setQueue(q =>
        q.map(i => i.id === item.id ? { ...i, status: 'error', error: (err as Error).message } : i),
      )
    }
  }, [ordenId, fotos, onUpdate])

  const processFiles = useCallback((files: FileList | null) => {
    if (!files || readonly) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    const items: UploadItem[] = []

    for (const file of Array.from(files)) {
      if (!allowed.includes(file.type) && !file.name.match(/\.(heic|heif)$/i)) continue
      if (file.size > 10 * 1024 * 1024) continue
      items.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: 'pending',
      })
    }

    if (!items.length) return
    setQueue(q => [...q, ...items])
    items.forEach(uploadOne)
  }, [readonly, uploadOne])

  const deleteFoto = async (fotoId: string) => {
    setDeletingId(fotoId)
    try {
      await fetch(`/api/ordenes/${ordenId}/reparacion/fotos/${fotoId}`, { method: 'DELETE' })
      onUpdate(fotos.filter(f => f.id !== fotoId))
    } finally {
      setDeletingId(null)
    }
  }

  const totalFotos = fotos.length + queue.filter(q => q.status !== 'error').length

  return (
    <div className="space-y-3">
      {!readonly && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex items-center justify-center gap-3 rounded-xl border-2 border-dashed py-5 cursor-pointer transition-colors',
            dragging
              ? 'border-secondary bg-secondary/10'
              : 'border-surface-2 hover:border-secondary/50 hover:bg-surface-2/50',
          )}
        >
          <Camera className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-white">Agregar fotos de la reparación</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP · Máx. 10 MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => processFiles(e.target.files)}
          />
        </div>
      )}

      {totalFotos > 0 && (
        <p className="text-xs text-muted-foreground">{totalFotos} foto{totalFotos !== 1 ? 's' : ''} de reparación</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {fotos.map(foto => (
          <div key={foto.id} className="group relative aspect-square rounded-lg overflow-hidden bg-surface-2">
            <Image
              src={foto.url}
              alt="Foto de reparación"
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
                {deletingId === foto.id
                  ? <Loader2 className="h-3 w-3 animate-spin text-white" />
                  : <X className="h-3 w-3 text-white" />}
              </button>
            )}
          </div>
        ))}

        {queue.map(item => (
          <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-surface-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.preview} alt="preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1.5">
              {item.status === 'uploading' && (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  <div className="w-3/4 bg-white/20 rounded-full h-1">
                    <div className="bg-secondary h-1 rounded-full transition-all" style={{ width: `${item.progress}%` }} />
                  </div>
                </>
              )}
              {item.status === 'done' && <CheckCircle className="h-7 w-7 text-green-400" />}
              {item.status === 'error' && (
                <>
                  <X className="h-5 w-5 text-red-400" />
                  <span className="text-red-300 text-xs text-center px-1">{item.error}</span>
                </>
              )}
            </div>
          </div>
        ))}

        {totalFotos === 0 && readonly && (
          <div className="aspect-square rounded-lg bg-surface-2 flex items-center justify-center col-span-2 sm:col-span-3 md:col-span-4">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="h-7 w-7 mx-auto mb-2" />
              <p className="text-sm">Sin fotos de reparación</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

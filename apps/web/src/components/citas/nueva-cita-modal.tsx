'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  nombre: z.string().min(2, 'Nombre muy corto'),
  telefono: z.string().min(8, 'Número inválido (mínimo 8 dígitos)'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  marcaId: z.string().min(1, 'Selecciona la marca'),
  modeloId: z.string().min(1, 'Selecciona el modelo'),
  anio: z.coerce.number().min(2000).max(2026),
  placa: z.string().min(2, 'Placa inválida'),
  hora: z.string().regex(/^\d{2}:\d{2}$/, 'Selecciona una hora'),
  comentarios: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Marca { id: string; nombre: string }
interface Modelo { id: string; nombre: string }

function horaActual(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

interface Props {
  onClose: () => void
  onCreated: () => void
}

export function NuevaCitaModal({ onClose, onCreated }: Props) {
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [loadingMarcas, setLoadingMarcas] = useState(true)
  const [loadingModelos, setLoadingModelos] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { hora: horaActual() } })

  const marcaId = watch('marcaId')

  useEffect(() => {
    fetch('/api/marcas')
      .then(r => r.json())
      .then((data: Marca[]) => setMarcas(data))
      .catch(() => {})
      .finally(() => setLoadingMarcas(false))
  }, [])

  useEffect(() => {
    if (!marcaId) { setModelos([]); return }
    setLoadingModelos(true)
    setValue('modeloId', '')
    fetch(`/api/marcas/${marcaId}/modelos`)
      .then(r => r.json())
      .then((data: Modelo[]) => setModelos(data))
      .catch(() => setModelos([]))
      .finally(() => setLoadingModelos(false))
  }, [marcaId, setValue])

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      telefono: `+504${data.telefono.replace(/\D/g, '')}`,
      email: data.email || undefined,
    }
    try {
      const res = await fetch('/api/citas/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        setError('root', { message: err.message ?? 'Error al registrar la cita' })
        return
      }
      onCreated()
    } catch {
      setError('root', { message: 'No se pudo conectar al servidor. Intenta de nuevo.' })
    }
  }

  const today = new Date().toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-surface border border-surface-2 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-2">
          <div>
            <h2 className="font-semibold text-white">Agendar cliente sin cita</h2>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">Hoy · {today}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Nombre completo *</Label>
              <Input {...register('nombre')} placeholder="Juan Pérez" />
              {errors.nombre && <p className="text-xs text-red-400">{errors.nombre.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Teléfono *</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-surface-2 bg-surface text-muted-foreground text-sm font-medium shrink-0">
                  +504
                </span>
                <Input
                  {...register('telefono')}
                  placeholder="9999-9999"
                  className="rounded-l-none"
                  onKeyPress={(e) => { if (!/[\d-]/.test(e.key)) e.preventDefault() }}
                />
              </div>
              {errors.telefono && <p className="text-xs text-red-400">{errors.telefono.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Correo electrónico (opcional)</Label>
            <Input {...register('email')} type="email" placeholder="juan@ejemplo.com" />
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Marca *</Label>
              <select
                {...register('marcaId')}
                disabled={loadingMarcas}
                className="w-full h-10 rounded-md border border-surface-2 bg-surface-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50"
              >
                <option value="">{loadingMarcas ? 'Cargando…' : 'Seleccionar'}</option>
                {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
              {errors.marcaId && <p className="text-xs text-red-400">{errors.marcaId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Modelo *</Label>
              <select
                {...register('modeloId')}
                disabled={!marcaId || loadingModelos}
                className="w-full h-10 rounded-md border border-surface-2 bg-surface-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50"
              >
                <option value="">{loadingModelos ? 'Cargando…' : !marcaId ? 'Elige marca primero' : 'Seleccionar'}</option>
                {modelos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
              {errors.modeloId && <p className="text-xs text-red-400">{errors.modeloId.message}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Año *</Label>
              <Input {...register('anio')} type="number" min={2000} max={2026} placeholder="2020" />
              {errors.anio && <p className="text-xs text-red-400">{errors.anio.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Placa *</Label>
              <Input {...register('placa')} placeholder="AAA-1234" className="uppercase" />
              {errors.placa && <p className="text-xs text-red-400">{errors.placa.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Hora de llegada *</Label>
              <Input {...register('hora')} type="time" />
              {errors.hora && <p className="text-xs text-red-400">{errors.hora.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Comentarios (opcional)</Label>
            <textarea
              {...register('comentarios')}
              rows={2}
              placeholder="Describe brevemente el motivo de la visita…"
              className="w-full rounded-md border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
            />
          </div>

          {errors.root && (
            <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errors.root.message}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2 border-t border-surface-2 -mx-5 px-5 pb-1 mt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registrando…</> : 'Registrar cita'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

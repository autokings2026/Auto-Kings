'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'


// ── Schema ────────────────────────────────────────────────────────────────────

const ANIO_MAX = new Date().getFullYear() + 1

const schema = z.object({
  nombre: z.string().min(2, 'Nombre muy corto'),
  telefono: z.string().min(8, 'Número inválido (mínimo 8 dígitos)'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  marcaId: z.string().min(1, 'Selecciona la marca'),
  modeloId: z.string().min(1, 'Selecciona el modelo'),
  anio: z.coerce.number().min(2000).max(ANIO_MAX),
  placa: z.string().min(2, 'Placa inválida'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Selecciona una fecha'),
  hora: z.string().regex(/^\d{2}:\d{2}$/, 'Selecciona una hora'),
  comentarios: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Marca { id: string; nombre: string }
interface Modelo { id: string; nombre: string }
interface Slot { hora: string; disponible: boolean; citasActuales: number; maxCitas: number }

// ── Calendar Picker ───────────────────────────────────────────────────────────

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

function CalendarPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (date: string) => void
}) {
  const todayDate = new Date()
  // OJO: NO usar toISOString() aquí — convierte a UTC, y en Honduras (UTC-6)
  // desde las 6pm en adelante la fecha en UTC ya es "mañana", lo que marcaba
  // el día de HOY como pasado/deshabilitado en el calendario por las tardes.
  const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`

  const [view, setView] = useState(() => {
    const base = value ? new Date(value + 'T12:00:00') : todayDate
    return { year: base.getFullYear(), month: base.getMonth() }
  })

  const { year, month } = view
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const toStr = (day: number) => {
    const m = String(month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${year}-${m}-${d}`
  }

  const prevMonth = () =>
    setView((v) => { const d = new Date(v.year, v.month - 1); return { year: d.getFullYear(), month: d.getMonth() } })
  const nextMonth = () =>
    setView((v) => { const d = new Date(v.year, v.month + 1); return { year: d.getFullYear(), month: d.getMonth() } })

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="rounded-lg border border-surface-2 bg-surface-2 p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1.5 rounded hover:bg-surface text-muted-foreground hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-white capitalize">
          {MESES[month]} {year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 rounded hover:bg-surface text-muted-foreground hover:text-white transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) =>
          day === null ? (
            <div key={`empty-${i}`} />
          ) : (
            <button
              key={day}
              type="button"
              disabled={toStr(day) < todayStr}
              onClick={() => onChange(toStr(day))}
              className={cn(
                'h-8 w-full rounded text-sm font-medium transition-colors',
                value === toStr(day)
                  ? 'bg-secondary text-white shadow-sm'
                  : toStr(day) === todayStr
                  ? 'border border-secondary/50 text-secondary hover:bg-secondary/20'
                  : toStr(day) < todayStr
                  ? 'text-muted-foreground/25 cursor-not-allowed'
                  : 'text-white hover:bg-secondary/30',
              )}
            >
              {day}
            </button>
          ),
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function BookingForm() {
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingMarcas, setLoadingMarcas] = useState(true)
  const [loadingModelos, setLoadingModelos] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [success, setSuccess] = useState<null | {
    nombre: string; fecha: string; hora: string; vehiculo: string; placa: string
  }>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const marcaId = watch('marcaId')
  const fecha = watch('fecha')
  const hora = watch('hora')

  // Load marcas on mount
  useEffect(() => {
    fetch(`/api/marcas`)
      .then((r) => r.json())
      .then((data: Marca[]) => setMarcas(data))
      .catch(() => {})
      .finally(() => setLoadingMarcas(false))
  }, [])

  // Load modelos when marca changes
  useEffect(() => {
    if (!marcaId) { setModelos([]); return }
    setLoadingModelos(true)
    setValue('modeloId', '')
    fetch(`/api/marcas/${marcaId}/modelos`)
      .then((r) => r.json())
      .then((data: Modelo[]) => setModelos(data))
      .catch(() => setModelos([]))
      .finally(() => setLoadingModelos(false))
  }, [marcaId, setValue])

  // Load slots when fecha changes
  useEffect(() => {
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { setSlots([]); return }
    setLoadingSlots(true)
    setValue('hora', '')
    fetch(`/api/citas/slots?fecha=${fecha}`)
      .then((r) => r.json())
      .then((data: Slot[]) => setSlots(data))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [fecha, setValue])

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      telefono: `+504${data.telefono.replace(/\D/g, '')}`,
      email: data.email || undefined,
    }
    try {
      const res = await fetch(`/api/citas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        setError('root', { message: err.message ?? 'Error al registrar la cita' })
        return
      }
      const result = await res.json()
      setSuccess(result.detalle)
    } catch {
      setError('root', { message: 'No se pudo conectar al servidor. Intenta de nuevo.' })
    }
  }

  // ── Success ────────────────────────────────────────────────────────────────

  if (success) {
    return (
      <Card className="bg-surface border-surface-2">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white">¡Cita registrada!</h2>
          <p className="text-muted-foreground">
            Recibirás un correo de confirmación si proporcionaste tu email.
          </p>
          <div className="bg-surface-2 rounded-lg p-4 text-left space-y-2 max-w-sm mx-auto">
            <Row label="Nombre" value={success.nombre} />
            <Row label="Fecha" value={success.fecha} />
            <Row label="Hora" value={success.hora} />
            <Row label="Vehículo" value={success.vehiculo} />
            <Row label="Placa" value={success.placa} />
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reservar otra cita
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Datos del cliente */}
      <Section title="Tus datos">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nombre completo *" error={errors.nombre?.message}>
            <Input {...register('nombre')} placeholder="Juan Pérez" />
          </Field>

          {/* Teléfono con prefijo +504 */}
          <Field label="Teléfono *" error={errors.telefono?.message}>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-surface-2 bg-surface text-muted-foreground text-sm font-medium shrink-0">
                +504
              </span>
              <Input
                {...register('telefono')}
                placeholder="9999-9999"
                className="rounded-l-none"
                onKeyPress={(e) => {
                  if (!/[\d\-]/.test(e.key)) e.preventDefault()
                }}
              />
            </div>
          </Field>
        </div>

        <Field label="Correo electrónico (opcional)" error={errors.email?.message}>
          <Input {...register('email')} type="email" placeholder="juan@ejemplo.com" />
        </Field>
      </Section>

      {/* Datos del vehículo */}
      <Section title="Tu vehículo">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Marca *" error={errors.marcaId?.message}>
            <select
              {...register('marcaId')}
              className="w-full h-10 rounded-md border border-surface-2 bg-surface-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50"
              disabled={loadingMarcas}
            >
              <option value="">{loadingMarcas ? 'Cargando…' : 'Seleccionar'}</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </Field>

          <Field label="Modelo *" error={errors.modeloId?.message}>
            <select
              {...register('modeloId')}
              className="w-full h-10 rounded-md border border-surface-2 bg-surface-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50"
              disabled={!marcaId || loadingModelos}
            >
              <option value="">
                {loadingModelos ? 'Cargando…' : !marcaId ? 'Elige marca primero' : 'Seleccionar'}
              </option>
              {modelos.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Año *" error={errors.anio?.message}>
            <Input {...register('anio')} type="number" min={2000} max={ANIO_MAX} placeholder="2020" />
          </Field>
          <Field label="Placa *" error={errors.placa?.message}>
            <Input {...register('placa')} placeholder="AAA-1234" className="uppercase" />
          </Field>
        </div>
      </Section>

      {/* Fecha y hora */}
      <Section title="Fecha y hora">
        <Field label="Selecciona la fecha *" error={errors.fecha?.message}>
          <CalendarPicker
            value={fecha ?? ''}
            onChange={(d) => setValue('fecha', d, { shouldValidate: true })}
          />
        </Field>

        {loadingSlots && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Consultando disponibilidad…
          </div>
        )}

        {!loadingSlots && fecha && slots.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-amber-400">
            <AlertCircle className="h-4 w-4" />
            No hay horarios disponibles para esa fecha.
          </div>
        )}

        {!loadingSlots && slots.length > 0 && (
          <Field label="Horario disponible *" error={errors.hora?.message}>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((s) => (
                <button
                  key={s.hora}
                  type="button"
                  disabled={!s.disponible}
                  onClick={() => setValue('hora', s.hora, { shouldValidate: true })}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-md border py-2.5 px-3 text-sm transition-all',
                    hora === s.hora
                      ? 'border-secondary bg-secondary/20 text-secondary font-semibold'
                      : s.disponible
                      ? 'border-surface-2 bg-surface-2 text-white hover:border-secondary/50'
                      : 'border-surface-2 bg-surface-2/40 text-muted-foreground/40 cursor-not-allowed line-through',
                  )}
                >
                  <Clock className="h-3 w-3 shrink-0" />
                  {s.hora}
                </button>
              ))}
            </div>
          </Field>
        )}
      </Section>

      {/* Comentarios */}
      <Section title="Comentarios (opcional)">
        <textarea
          {...register('comentarios')}
          rows={3}
          placeholder="Describe brevemente el problema de tu vehículo…"
          className="w-full rounded-md border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
        />
      </Section>

      {errors.root && (
        <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errors.root.message}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        className="w-full h-11 text-base"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Registrando cita…
          </>
        ) : (
          'Confirmar cita'
        )}
      </Button>
    </form>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="bg-surface border-surface-2">
      <CardContent className="pt-5 pb-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-accent">{title}</h2>
        {children}
      </CardContent>
    </Card>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  )
}

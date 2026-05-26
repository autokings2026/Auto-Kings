'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Loader2, MessagesSquare, Save, Check,
  CalendarDays, Wrench, DollarSign, Car, Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type TipoPlantilla =
  | 'CONFIRMAR_CITA'
  | 'COTIZACION_LISTA'
  | 'DIAGNOSTICO_LISTO'
  | 'VEHICULO_LISTO'
  | 'ENCUESTA_SATISFACCION'

interface Plantilla {
  id: string
  tipo: TipoPlantilla
  nombre: string
  contenido: string
  activa: boolean
}

// ── Metadata de cada paso (estático, no viene de la BD) ─────────────────────
const STEPS: {
  tipo: TipoPlantilla
  label: string
  descripcion: string
  icon: React.ElementType
  variables: string[]
  accentClass: string
  dotClass: string
  stepNum: number
}[] = [
  {
    tipo: 'CONFIRMAR_CITA',
    label: 'Confirmación de Cita',
    descripcion: 'Se envía al cliente al agendar o confirmar una cita en el taller.',
    icon: CalendarDays,
    variables: ['nombre_cliente', 'fecha_cita', 'hora_cita', 'marca', 'modelo', 'placa'],
    accentClass: 'border-blue-500/30 bg-blue-500/5',
    dotClass: 'bg-blue-500',
    stepNum: 1,
  },
  {
    tipo: 'COTIZACION_LISTA',
    label: 'Cotización lista',
    descripcion: 'Se envía con el link de aprobación del presupuesto para que el cliente lo revise.',
    icon: DollarSign,
    variables: ['nombre_cliente', 'placa', 'marca', 'modelo', 'total_cotizacion', 'link_cotizacion'],
    accentClass: 'border-purple-500/30 bg-purple-500/5',
    dotClass: 'bg-purple-500',
    stepNum: 2,
  },
  {
    tipo: 'DIAGNOSTICO_LISTO',
    label: 'Diagnóstico listo',
    descripcion: 'Se envía cuando el técnico termina el diagnóstico y se necesita notificar al cliente.',
    icon: Wrench,
    variables: ['nombre_cliente', 'placa', 'marca', 'modelo'],
    accentClass: 'border-orange-500/30 bg-orange-500/5',
    dotClass: 'bg-orange-500',
    stepNum: 3,
  },
  {
    tipo: 'VEHICULO_LISTO',
    label: 'Vehículo listo para retiro',
    descripcion: 'Se envía cuando el vehículo pasó el control de calidad y está listo para ser retirado.',
    icon: Car,
    variables: ['nombre_cliente', 'placa', 'marca', 'modelo'],
    accentClass: 'border-green-500/30 bg-green-500/5',
    dotClass: 'bg-green-500',
    stepNum: 4,
  },
  {
    tipo: 'ENCUESTA_SATISFACCION',
    label: 'Encuesta de satisfacción',
    descripcion: 'Se envía después de la entrega con el link a la encuesta de satisfacción del cliente.',
    icon: Star,
    variables: ['nombre_cliente', 'placa', 'link_encuesta'],
    accentClass: 'border-amber-500/30 bg-amber-500/5',
    dotClass: 'bg-amber-500',
    stepNum: 5,
  },
]

// Contenido por defecto si la plantilla aún no existe en la BD
const DEFAULT_CONTENT: Record<TipoPlantilla, string> = {
  CONFIRMAR_CITA:
    'Hola {{nombre_cliente}}, le confirmamos su cita el {{fecha_cita}} a las {{hora_cita}} para su {{marca}} {{modelo}} (placa {{placa}}). ¡Lo esperamos en el taller!',
  COTIZACION_LISTA:
    'Hola {{nombre_cliente}}, hemos terminado el diagnóstico de su {{marca}} {{modelo}} ({{placa}}). El costo estimado es de {{total_cotizacion}}. Revise y apruebe su cotización aquí: {{link_cotizacion}}',
  DIAGNOSTICO_LISTO:
    'Hola {{nombre_cliente}}, el diagnóstico de su {{marca}} {{modelo}} ({{placa}}) ya está listo. Nos comunicaremos para informarle los detalles.',
  VEHICULO_LISTO:
    'Hola {{nombre_cliente}}, su vehículo {{marca}} {{modelo}} ({{placa}}) ya está listo para ser retirado en nuestro taller. ¡Lo esperamos!',
  ENCUESTA_SATISFACCION:
    'Hola {{nombre_cliente}}, gracias por confiar en nosotros con su {{marca}} {{modelo}} ({{placa}}). Nos gustaría conocer su opinión: {{link_encuesta}}',
}

// ── Toggle component ────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200',
        checked ? 'bg-green-500' : 'bg-gray-600',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

// ── Página principal ────────────────────────────────────────────────────────
export default function MensajesPage() {
  const { data: session } = useSession()
  const [plantillas, setPlantillas] = useState<Record<string, Plantilla>>({})
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [activa, setActiva] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [savedRecently, setSavedRecently] = useState<Set<string>>(new Set())
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})

  const headers = useCallback(
    () => ({ Authorization: `Bearer ${session?.user?.accessToken ?? ''}`, 'Content-Type': 'application/json' }),
    [session?.user?.accessToken],
  )

  useEffect(() => {
    if (!session?.user) return
    fetch(`${API}/inbox/plantillas`, { headers: headers() })
      .then(r => r.ok ? r.json() : [])
      .then((data: Plantilla[]) => {
        const map: Record<string, Plantilla> = {}
        const draftMap: Record<string, string> = {}
        const activaMap: Record<string, boolean> = {}
        for (const p of data) {
          map[p.tipo] = p
          draftMap[p.tipo] = p.contenido
          activaMap[p.tipo] = p.activa
        }
        // Fill gaps with defaults for types not yet in BD
        for (const s of STEPS) {
          if (!draftMap[s.tipo]) draftMap[s.tipo] = DEFAULT_CONTENT[s.tipo]
          if (activaMap[s.tipo] === undefined) activaMap[s.tipo] = true
        }
        setPlantillas(map)
        setDraft(draftMap)
        setActiva(activaMap)
      })
      .finally(() => setLoading(false))
  }, [session, headers])

  const insertVariable = (tipo: string, variable: string) => {
    const el = textareaRefs.current[tipo]
    const varText = `{{${variable}}}`
    if (!el) {
      setDraft(prev => ({ ...prev, [tipo]: (prev[tipo] ?? '') + varText }))
      return
    }
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const next = el.value.substring(0, start) + varText + el.value.substring(end)
    setDraft(prev => ({ ...prev, [tipo]: next }))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + varText.length, start + varText.length)
    })
  }

  const handleSave = async (step: typeof STEPS[number]) => {
    if (!session?.user) return
    setSaving(step.tipo)
    try {
      const res = await fetch(`${API}/inbox/plantillas/${step.tipo}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({
          nombre: step.label,
          contenido: draft[step.tipo] ?? '',
          activa: activa[step.tipo] ?? true,
        }),
      })
      if (res.ok) {
        const updated: Plantilla = await res.json()
        setPlantillas(prev => ({ ...prev, [step.tipo]: updated }))
        setSavedRecently(prev => new Set(prev).add(step.tipo))
        setTimeout(() => setSavedRecently(prev => {
          const next = new Set(prev); next.delete(step.tipo); return next
        }), 2000)
      }
    } finally {
      setSaving(null)
    }
  }

  const handleToggle = async (step: typeof STEPS[number], value: boolean) => {
    setActiva(prev => ({ ...prev, [step.tipo]: value }))
    if (!session?.user) return
    await fetch(`${API}/inbox/plantillas/${step.tipo}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({
        nombre: step.label,
        contenido: draft[step.tipo] ?? DEFAULT_CONTENT[step.tipo],
        activa: value,
      }),
    })
  }

  const isDirty = (tipo: string) => {
    const saved = plantillas[tipo]?.contenido
    return saved !== undefined && saved !== draft[tipo]
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-secondary" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center">
          <MessagesSquare className="h-5 w-5 text-secondary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Mensajes</h1>
          <p className="text-sm text-muted-foreground">
            Plantillas de WhatsApp para cada etapa del flujo de trabajo
          </p>
        </div>
      </div>

      {/* Línea de tiempo + tarjetas */}
      <div className="relative">
        {/* Línea vertical */}
        <div className="absolute left-[19px] top-6 bottom-6 w-px bg-border" />

        <div className="space-y-5">
          {STEPS.map((step) => {
            const Icon = step.icon
            const isSaving = saving === step.tipo
            const isSaved = savedRecently.has(step.tipo)
            const isActive = activa[step.tipo] ?? true
            const dirty = isDirty(step.tipo)

            return (
              <div key={step.tipo} className="flex gap-4">
                {/* Indicador de paso */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={cn('h-10 w-10 rounded-full flex items-center justify-center z-10', step.dotClass)}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </div>

                {/* Tarjeta */}
                <div className={cn('flex-1 rounded-xl border p-5 space-y-4', step.accentClass, !isActive && 'opacity-60')}>
                  {/* Header de la tarjeta */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">PASO {step.stepNum}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-white mt-0.5">{step.label}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.descripcion}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">{isActive ? 'Activo' : 'Inactivo'}</span>
                      <Toggle checked={isActive} onChange={(v) => handleToggle(step, v)} />
                    </div>
                  </div>

                  {/* Textarea */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Mensaje</label>
                    <textarea
                      ref={el => { textareaRefs.current[step.tipo] = el }}
                      value={draft[step.tipo] ?? ''}
                      onChange={e => setDraft(prev => ({ ...prev, [step.tipo]: e.target.value }))}
                      rows={4}
                      className="w-full rounded-lg border border-surface-2 bg-surface-2/50 px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary resize-none font-mono leading-relaxed"
                      placeholder="Escribe el mensaje que se enviará al cliente..."
                    />
                  </div>

                  {/* Variables */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Variables disponibles — haz clic para insertar en el mensaje:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {step.variables.map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => insertVariable(step.tipo, v)}
                          className="rounded-md border border-surface-2 bg-surface-2 px-2 py-0.5 text-xs text-accent hover:bg-surface-2/80 hover:border-secondary/40 transition-colors font-mono"
                        >
                          {`{{${v}}}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1">
                    {dirty ? (
                      <p className="text-xs text-amber-400">Cambios sin guardar</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {plantillas[step.tipo] ? 'Guardado en la base de datos' : 'Usando contenido por defecto'}
                      </p>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleSave(step)}
                      disabled={isSaving}
                      className={cn(
                        'gap-1.5',
                        isSaved && 'bg-green-600 hover:bg-green-600',
                      )}
                    >
                      {isSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isSaved ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      {isSaved ? 'Guardado' : 'Guardar'}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

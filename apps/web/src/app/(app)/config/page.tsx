'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Loader2, Settings, Save, Check, Upload, X, Building2,
  Clock, Calendar, Bell, Image as ImageIcon, Percent, AlertTriangle, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const CLOUD_NAME  = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME   ?? ''
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? ''

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

interface Horario { dia: number; activo: boolean; apertura: string; cierre: string }

interface Config {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  direccion: string | null
  logoUrl: string | null
  horariosAtencion: Horario[]
  duracionSlotMinutos: number
  maxCitasPorSlot: number
  alertaAmarillaMinutos: number
  alertaRojaMinutos: number
  comisionTecnicoPct: number
}

const DEFAULT_HORARIOS: Horario[] = DIAS.map((_, i) => ({
  dia: i,
  activo: i >= 1 && i <= 6,
  apertura: '08:00',
  cierre: '18:00',
}))

function SectionCard({ icon, title, children }: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-surface-2 bg-surface p-5 space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-surface-2">
        <div className="text-secondary">{icon}</div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground font-medium">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary'

const PALABRA_RESET = 'LIMPIAR'

export default function ConfigPage() {
  const { data: session } = useSession()
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Reset modal
  const [resetModal, setResetModal] = useState(false)
  const [resetWord, setResetWord] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetDone, setResetDone] = useState(false)

  // form state
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [direccion, setDireccion] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [horarios, setHorarios] = useState<Horario[]>(DEFAULT_HORARIOS)
  const [duracionSlot, setDuracionSlot] = useState(60)
  const [maxCitas, setMaxCitas] = useState(3)
  const [alertaAmarilla, setAlertaAmarilla] = useState(60)
  const [alertaRoja, setAlertaRoja] = useState(120)
  const [comisionPct, setComisionPct] = useState(8)

  const headers = useCallback(
    () => ({ 'Content-Type': 'application/json' }),
    [],
  )

  useEffect(() => {
    if (!session?.user) return
    fetch(`/api/config/taller`, { headers: headers() })
      .then(r => r.ok ? r.json() : null)
      .then((data: Config | null) => {
        if (!data) return
        setConfig(data)
        setNombre(data.nombre ?? '')
        setTelefono(data.telefono ?? '')
        setEmail(data.email ?? '')
        setDireccion(data.direccion ?? '')
        setLogoUrl(data.logoUrl)
        setHorarios(Array.isArray(data.horariosAtencion) && data.horariosAtencion.length === 7
          ? data.horariosAtencion
          : DEFAULT_HORARIOS)
        setDuracionSlot(data.duracionSlotMinutos ?? 60)
        setMaxCitas(data.maxCitasPorSlot ?? 3)
        setAlertaAmarilla(data.alertaAmarillaMinutos ?? 60)
        setAlertaRoja(data.alertaRojaMinutos ?? 120)
        setComisionPct(data.comisionTecnicoPct ?? 8)
      })
      .finally(() => setLoading(false))
  }, [session, headers])

  const uploadLogo = async (file: File) => {
    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', UPLOAD_PRESET)
      fd.append('folder', 'kings-auto/logo')
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST', body: fd,
      })
      const data = await res.json()
      if (data.secure_url) setLogoUrl(data.secure_url)
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSave = async () => {
    if (!session?.user) return
    setSaving(true)
    try {
      const res = await fetch(`/api/config/taller`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({
          nombre,
          telefono: telefono || null,
          email: email || null,
          direccion: direccion || null,
          logoUrl,
          horariosAtencion: horarios,
          duracionSlotMinutos: duracionSlot,
          maxCitasPorSlot: maxCitas,
          alertaAmarillaMinutos: alertaAmarilla,
          alertaRojaMinutos: alertaRoja,
          comisionTecnicoPct: comisionPct,
        }),
      })
      if (res.ok) {
        setConfig(await res.json())
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } finally {
      setSaving(false)
    }
  }

  const updateHorario = (dia: number, field: keyof Horario, value: string | boolean) => {
    setHorarios(prev => prev.map(h => h.dia === dia ? { ...h, [field]: value } : h))
  }

  const handleReset = async () => {
    setResetting(true)
    setResetError('')
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmacion: resetWord }),
      })
      if (!res.ok) {
        const e = await res.json()
        setResetError(e.message ?? 'Error al limpiar')
        return
      }
      setResetDone(true)
      setResetModal(false)
      setResetWord('')
    } finally {
      setResetting(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-secondary" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center">
            <Settings className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Configuración</h1>
            <p className="text-sm text-muted-foreground">Ajustes generales del centro de servicio</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className={cn('gap-2', saved && 'bg-green-600 hover:bg-green-600')}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Guardado' : 'Guardar cambios'}
        </Button>
      </div>

      {/* Grid principal: izquierda ancha + derecha lateral */}
      <div className="grid xl:grid-cols-[1fr_340px] gap-6 items-start">

        {/* ── Columna izquierda ── */}
        <div className="space-y-6">

          {/* Información del centro de servicio */}
          <SectionCard icon={<Building2 className="h-4 w-4" />} title="Información del centro de servicio">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nombre del centro de servicio">
                <input className={inputCls} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Kings Auto Diagnósticos" />
              </Field>
              <Field label="Teléfono">
                <input className={inputCls} value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+504 9999-9999" />
              </Field>
              <Field label="Email">
                <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contacto@taller.com" />
              </Field>
              <Field label="Dirección">
                <input className={inputCls} value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Calle, ciudad" />
              </Field>
            </div>
          </SectionCard>

          {/* Horarios */}
          <SectionCard icon={<Clock className="h-4 w-4" />} title="Horarios de atención">
            <div className="space-y-2">
              {horarios.map(h => (
                <div key={h.dia} className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-colors', h.activo ? 'border-surface-2 bg-surface-2/40' : 'border-surface-2/50 bg-surface-2/10 opacity-50')}>
                  <button
                    type="button"
                    onClick={() => updateHorario(h.dia, 'activo', !h.activo)}
                    className={cn('relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors', h.activo ? 'bg-green-500' : 'bg-gray-600')}
                  >
                    <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', h.activo ? 'translate-x-[18px]' : 'translate-x-0.5')} />
                  </button>
                  <span className="text-sm font-medium text-white w-24 flex-shrink-0">{DIAS[h.dia]}</span>
                  {h.activo ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={h.apertura}
                        onChange={e => updateHorario(h.dia, 'apertura', e.target.value)}
                        className="rounded-md border border-surface-2 bg-surface-2 px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-secondary"
                      />
                      <span className="text-muted-foreground text-xs">a</span>
                      <input
                        type="time"
                        value={h.cierre}
                        onChange={e => updateHorario(h.dia, 'cierre', e.target.value)}
                        className="rounded-md border border-surface-2 bg-surface-2 px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-secondary"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Cerrado</span>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* ── Columna derecha ── */}
        <div className="space-y-6">

          {/* Logo */}
          <SectionCard icon={<ImageIcon className="h-4 w-4" />} title="Logo del centro de servicio">
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="h-28 w-28 rounded-2xl border border-surface-2 bg-surface-2 flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">Se muestra en los reportes PDF generados.</p>
              <div className="flex gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="gap-1.5"
                >
                  {uploadingLogo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {uploadingLogo ? 'Subiendo…' : 'Cambiar logo'}
                </Button>
                {logoUrl && (
                  <Button size="sm" variant="ghost" onClick={() => setLogoUrl(null)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Citas */}
          <SectionCard icon={<Calendar className="h-4 w-4" />} title="Configuración de citas">
            <div className="space-y-4">
              <Field label="Duración de cada cita (minutos)">
                <div className="flex items-center gap-2">
                  <input type="number" min={15} max={480} step={15} value={duracionSlot}
                    onChange={e => setDuracionSlot(Number(e.target.value))}
                    className="w-24 rounded-lg border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                  <span className="text-xs text-muted-foreground">min por slot</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Define el intervalo de slots en la agenda.</p>
              </Field>
              <Field label="Máximo de citas por slot">
                <div className="flex items-center gap-2">
                  <input type="number" min={1} max={20} value={maxCitas}
                    onChange={e => setMaxCitas(Number(e.target.value))}
                    className="w-24 rounded-lg border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                  <span className="text-xs text-muted-foreground">vehículos</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Citas simultáneas en el mismo horario.</p>
              </Field>
            </div>
          </SectionCard>

          {/* Alertas */}
          <SectionCard icon={<Bell className="h-4 w-4" />} title="Alertas de mensajes">
            <p className="text-xs text-muted-foreground -mt-1">Minutos sin respuesta antes de mostrar alerta.</p>
            <div className="space-y-4 mt-1">
              <Field label="Alerta amarilla">
                <div className="flex items-center gap-2">
                  <input type="number" min={1} value={alertaAmarilla}
                    onChange={e => setAlertaAmarilla(Number(e.target.value))}
                    className="w-24 rounded-lg border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                  <span className="h-3 w-3 rounded-full bg-amber-400 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
              </Field>
              <Field label="Alerta roja">
                <div className="flex items-center gap-2">
                  <input type="number" min={1} value={alertaRoja}
                    onChange={e => setAlertaRoja(Number(e.target.value))}
                    className="w-24 rounded-lg border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                  <span className="h-3 w-3 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
              </Field>
            </div>
          </SectionCard>

          {/* Comisión técnicos */}
          <SectionCard icon={<Percent className="h-4 w-4" />} title="Comisión para técnicos">
            <p className="text-xs text-muted-foreground -mt-1">
              Porcentaje que recibe el técnico sobre el total de mano de obra por cada vehículo reparado.
            </p>
            <div className="mt-2">
              <Field label="Porcentaje de comisión">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={comisionPct}
                    onChange={e => setComisionPct(Number(e.target.value))}
                    className="w-24 rounded-lg border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">sobre mano de obra</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Actualmente: {comisionPct}% — aplica a todas las OTs completadas desde este momento.
                </p>
              </Field>
            </div>
          </SectionCard>

        </div>
      </div>

      {/* ── Zona de peligro ── */}
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-red-400">Zona de peligro</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Elimina todos los datos operativos (citas, órdenes de trabajo, clientes, reportes y mensajes).
          La configuración del centro de servicio, catálogo de vehículos, usuarios y plantillas se conservan.
        </p>
        {resetDone && (
          <p className="text-sm text-green-400 font-medium">Base de datos limpiada correctamente.</p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setResetModal(true); setResetWord(''); setResetError(''); setResetDone(false) }}
          className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Limpiar datos
        </Button>
      </div>

      {/* ── Modal de confirmación de reset ── */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface border border-red-500/30 rounded-xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-red-500/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <h2 className="font-semibold text-white">Limpiar base de datos</h2>
              </div>
              <button onClick={() => setResetModal(false)} className="text-muted-foreground hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 space-y-1.5">
                  <p className="font-semibold text-red-400 uppercase tracking-wide">Se eliminará</p>
                  {['Citas', 'Órdenes de trabajo', 'Diagnósticos y cotizaciones', 'Fotos subidas', 'Historial de mensajes', 'Registros de clientes'].map(i => (
                    <p key={i} className="text-red-300/80 flex items-center gap-1.5">
                      <span className="text-red-500">✕</span> {i}
                    </p>
                  ))}
                </div>
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 space-y-1.5">
                  <p className="font-semibold text-green-400 uppercase tracking-wide">Se conserva</p>
                  {['Configuración del taller', 'Catálogo de vehículos', 'Usuarios del sistema', 'Plantillas de WhatsApp', 'Porcentaje de comisión'].map(i => (
                    <p key={i} className="text-green-300/80 flex items-center gap-1.5">
                      <span className="text-green-500">✓</span> {i}
                    </p>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Escribe <span className="font-bold text-white">{PALABRA_RESET}</span> para confirmar
                </label>
                <input
                  value={resetWord}
                  onChange={e => setResetWord(e.target.value.toUpperCase())}
                  placeholder={PALABRA_RESET}
                  className="w-full rounded-lg border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500 font-mono tracking-widest"
                />
                {resetError && <p className="text-xs text-red-400">{resetError}</p>}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-2">
              <Button variant="outline" onClick={() => setResetModal(false)}>Cancelar</Button>
              <button
                onClick={handleReset}
                disabled={resetWord !== PALABRA_RESET || resetting}
                className="flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 text-sm font-medium transition-colors"
              >
                {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {resetting ? 'Limpiando…' : 'Limpiar base de datos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

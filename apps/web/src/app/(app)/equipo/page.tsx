'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Users, Plus, Pencil, Power, Eye, EyeOff, Loader2,
  Phone, Mail, Calendar, AlertCircle, ShieldCheck, Wrench, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RolUsuario, LABEL_ROL } from '@kings/shared'

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface Miembro {
  id: string
  nombre: string
  email: string
  rol: RolUsuario
  activo: boolean
  telefono?: string | null
  fechaIngreso?: string | null
  contactoEmergenciaNombre?: string | null
  contactoEmergenciaTelefono?: string | null
  createdAt: string
}

type FormData = {
  nombre: string
  email: string
  password: string
  rol: RolUsuario.EMPLEADO | RolUsuario.CONTROL_CALIDAD
  telefono: string
  fechaIngreso: string
  contactoEmergenciaNombre: string
  contactoEmergenciaTelefono: string
}

const EMPTY_FORM: FormData = {
  nombre: '',
  email: '',
  password: '',
  rol: RolUsuario.EMPLEADO,
  telefono: '',
  fechaIngreso: '',
  contactoEmergenciaNombre: '',
  contactoEmergenciaTelefono: '',
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function EquipoPage() {
  const { data: session } = useSession()
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null)
  const [selected, setSelected] = useState<Miembro | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const cargar = async () => {
    setLoading(true)
    const res = await fetch('/api/usuarios')
    if (res.ok) setMiembros(await res.json())
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const abrirCrear = () => {
    setSelected(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowPass(false)
    setModal('crear')
  }

  const abrirEditar = (m: Miembro) => {
    setSelected(m)
    setForm({
      nombre: m.nombre,
      email: m.email,
      password: '',
      rol: m.rol as RolUsuario.EMPLEADO | RolUsuario.CONTROL_CALIDAD,
      telefono: m.telefono ?? '',
      fechaIngreso: m.fechaIngreso ? m.fechaIngreso.split('T')[0] : '',
      contactoEmergenciaNombre: m.contactoEmergenciaNombre ?? '',
      contactoEmergenciaTelefono: m.contactoEmergenciaTelefono ?? '',
    })
    setError('')
    setShowPass(false)
    setModal('editar')
  }

  const guardar = async () => {
    setSaving(true)
    setError('')
    try {
      const payload: Record<string, unknown> = {
        nombre: form.nombre,
        email: form.email,
        rol: form.rol,
        telefono: form.telefono || null,
        fechaIngreso: form.fechaIngreso || null,
        contactoEmergenciaNombre: form.contactoEmergenciaNombre || null,
        contactoEmergenciaTelefono: form.contactoEmergenciaTelefono || null,
      }
      if (form.password) payload['password'] = form.password
      if (modal === 'crear') payload['password'] = form.password

      const url = modal === 'crear' ? '/api/usuarios' : `/api/usuarios/${selected!.id}`
      const method = modal === 'crear' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.message ?? 'Error al guardar')
        return
      }

      await cargar()
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  const toggleActivo = async (m: Miembro) => {
    setTogglingId(m.id)
    await fetch(`/api/usuarios/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !m.activo }),
    })
    await cargar()
    setTogglingId(null)
  }

  const activos = miembros.filter(m => m.activo)
  const inactivos = miembros.filter(m => !m.activo)

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header — compacto en móvil */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-accent shrink-0" />
            <span className="truncate">Equipo de Trabajo</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {activos.length} miembro{activos.length !== 1 ? 's' : ''} activo{activos.length !== 1 ? 's' : ''}
          </p>
        </div>
        {/* En móvil solo el ícono, en desktop texto completo */}
        <button
          onClick={abrirCrear}
          className="shrink-0 flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white text-sm font-medium rounded-lg px-3 py-2 sm:px-4 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo miembro</span>
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <MiembrosGrid
            miembros={activos}
            titulo="Activos"
            onEditar={abrirEditar}
            onToggle={toggleActivo}
            togglingId={togglingId}
            sessionId={session?.user?.id}
          />
          {inactivos.length > 0 && (
            <MiembrosGrid
              miembros={inactivos}
              titulo="Inactivos"
              onEditar={abrirEditar}
              onToggle={toggleActivo}
              togglingId={togglingId}
              sessionId={session?.user?.id}
            />
          )}
          {activos.length === 0 && inactivos.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No hay miembros registrados.</p>
              <p className="text-xs mt-1">Agrega el primer miembro con el botón superior.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal — bottom sheet en móvil, centrado en desktop */}
      {modal && (
        <ModalMiembro
          modo={modal}
          form={form}
          setForm={setForm}
          onGuardar={guardar}
          onCerrar={() => setModal(null)}
          saving={saving}
          error={error}
          showPass={showPass}
          setShowPass={setShowPass}
        />
      )}
    </div>
  )
}

// ── Grid de miembros ───────────────────────────────────────────────────────────

function MiembrosGrid({
  miembros, titulo, onEditar, onToggle, togglingId, sessionId,
}: {
  miembros: Miembro[]
  titulo: string
  onEditar: (m: Miembro) => void
  onToggle: (m: Miembro) => void
  togglingId: string | null
  sessionId?: string
}) {
  if (miembros.length === 0) return null
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{titulo}</h2>
      {/* 1 col mobile → 2 col sm → 3 col lg */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {miembros.map(m => (
          <TarjetaMiembro
            key={m.id}
            miembro={m}
            onEditar={onEditar}
            onToggle={onToggle}
            toggling={togglingId === m.id}
            esYo={sessionId === m.id}
          />
        ))}
      </div>
    </div>
  )
}

// ── Tarjeta ────────────────────────────────────────────────────────────────────

function TarjetaMiembro({
  miembro: m, onEditar, onToggle, toggling, esYo,
}: {
  miembro: Miembro
  onEditar: (m: Miembro) => void
  onToggle: (m: Miembro) => void
  toggling: boolean
  esYo: boolean
}) {
  const RolIcon = m.rol === RolUsuario.CONTROL_CALIDAD ? ShieldCheck : Wrench
  const rolColor = m.rol === RolUsuario.CONTROL_CALIDAD ? 'text-cyan-400' : 'text-blue-400'

  return (
    <div className={cn(
      'bg-surface border border-surface-2 rounded-xl p-4 flex flex-col gap-3 transition-opacity',
      !m.activo && 'opacity-50',
    )}>
      {/* Nombre + rol + badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground leading-tight truncate">{m.nombre}</p>
          <div className={cn('flex items-center gap-1 text-xs mt-1', rolColor)}>
            <RolIcon className="h-3 w-3 shrink-0" />
            {LABEL_ROL[m.rol]}
          </div>
        </div>
        {esYo && (
          <span className="shrink-0 text-[10px] bg-primary/20 text-accent border border-primary/30 rounded-full px-2 py-0.5 mt-0.5">
            Tú
          </span>
        )}
      </div>

      {/* Datos — flex-1 para que los botones queden siempre abajo */}
      <div className="flex-1 space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 min-w-0">
          <Mail className="h-3 w-3 shrink-0" />
          <span className="truncate">{m.email}</span>
        </div>
        {m.telefono && (
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 shrink-0" />
            <a href={`tel:${m.telefono}`} className="hover:text-foreground transition-colors">
              {m.telefono}
            </a>
          </div>
        )}
        {m.fechaIngreso && (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 shrink-0" />
            Desde {new Date(m.fechaIngreso).toLocaleDateString('es-HN', {
              year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
            })}
          </div>
        )}
        {m.contactoEmergenciaNombre && (
          <div className="flex items-start gap-2">
            <AlertCircle className="h-3 w-3 shrink-0 text-yellow-500 mt-0.5" />
            <span className="leading-snug">
              {m.contactoEmergenciaNombre}
              {m.contactoEmergenciaTelefono ? (
                <><br /><a href={`tel:${m.contactoEmergenciaTelefono}`} className="hover:text-foreground">{m.contactoEmergenciaTelefono}</a></>
              ) : null}
            </span>
          </div>
        )}
      </div>

      {/* Acciones — altura mínima para toque cómodo */}
      <div className="flex gap-1 pt-2 border-t border-surface-2">
        <button
          onClick={() => onEditar(m)}
          className="flex flex-1 items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground active:bg-surface-2 transition-colors px-2 py-2.5 rounded-lg hover:bg-surface-2"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>
        {!esYo && (
          <button
            onClick={() => onToggle(m)}
            disabled={toggling}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 text-xs transition-colors px-2 py-2.5 rounded-lg',
              m.activo
                ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:bg-destructive/20'
                : 'text-green-400 hover:text-green-300 hover:bg-green-400/10 active:bg-green-400/20',
            )}
          >
            {toggling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
            {m.activo ? 'Desactivar' : 'Activar'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Modal — bottom sheet en móvil, centrado en desktop ────────────────────────

function ModalMiembro({
  modo, form, setForm, onGuardar, onCerrar, saving, error, showPass, setShowPass,
}: {
  modo: 'crear' | 'editar'
  form: FormData
  setForm: (f: FormData) => void
  onGuardar: () => void
  onCerrar: () => void
  saving: boolean
  error: string
  showPass: boolean
  setShowPass: (v: boolean) => void
}) {
  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar() }}
    >
      {/*
        Móvil: panel desde abajo, bordes redondeados arriba, altura máxima 92vh
        Desktop: modal centrado, max-w-lg, bordes redondeados en todos los lados
      */}
      <div className="bg-surface border border-surface-2 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        {/* Handle visual (solo móvil) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-surface-2" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-surface-2 shrink-0">
          <h2 className="text-base font-semibold text-foreground">
            {modo === 'crear' ? 'Nuevo miembro' : 'Editar miembro'}
          </h2>
          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 space-y-5">
          <Section label="Datos personales">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nombre completo *" className="sm:col-span-2">
                <input
                  value={form.nombre}
                  onChange={set('nombre')}
                  placeholder="Carlos Méndez"
                  className={inputCls}
                />
              </Field>
              <Field label="Correo electrónico *" className="sm:col-span-2">
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="carlos@kingsauto.hn"
                  className={inputCls}
                  inputMode="email"
                  autoCapitalize="none"
                />
              </Field>
              <Field label="Teléfono">
                <input
                  value={form.telefono}
                  onChange={set('telefono')}
                  placeholder="9999-9999"
                  className={inputCls}
                  inputMode="tel"
                />
              </Field>
              <Field label="Fecha de ingreso">
                <input
                  type="date"
                  value={form.fechaIngreso}
                  onChange={set('fechaIngreso')}
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>

          <Section label="Rol en el sistema">
            <Field label="Rol *">
              <select value={form.rol} onChange={set('rol')} className={inputCls}>
                <option value={RolUsuario.EMPLEADO}>Técnico</option>
                <option value={RolUsuario.CONTROL_CALIDAD}>Control de Calidad</option>
              </select>
            </Field>
          </Section>

          <Section label={modo === 'crear' ? 'Credenciales de acceso' : 'Cambiar contraseña (opcional)'}>
            <Field label={modo === 'crear' ? 'Contraseña *' : 'Nueva contraseña'}>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder={modo === 'crear' ? 'Mínimo 8 caracteres' : 'Dejar en blanco para no cambiar'}
                  className={cn(inputCls, 'pr-10')}
                  autoComplete={modo === 'crear' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
          </Section>

          <Section label="Contacto de emergencia">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nombre">
                <input
                  value={form.contactoEmergenciaNombre}
                  onChange={set('contactoEmergenciaNombre')}
                  placeholder="María Méndez (mamá)"
                  className={inputCls}
                />
              </Field>
              <Field label="Teléfono">
                <input
                  value={form.contactoEmergenciaTelefono}
                  onChange={set('contactoEmergenciaTelefono')}
                  placeholder="9888-7777"
                  className={inputCls}
                  inputMode="tel"
                />
              </Field>
            </div>
          </Section>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer — fijo en la parte inferior */}
        <div className="flex gap-3 px-4 sm:px-6 py-4 border-t border-surface-2 shrink-0 bg-surface">
          <button
            onClick={onCerrar}
            disabled={saving}
            className="flex-1 h-11 rounded-xl border border-surface-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onGuardar}
            disabled={saving}
            className="flex-1 h-11 rounded-xl bg-secondary hover:bg-secondary/90 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {modo === 'crear' ? 'Crear miembro' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Helpers UI ─────────────────────────────────────────────────────────────────

const inputCls = 'w-full h-10 rounded-lg bg-surface-2 border border-surface-2 text-sm text-white px-3 outline-none focus:ring-1 focus:ring-secondary placeholder:text-muted-foreground'

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

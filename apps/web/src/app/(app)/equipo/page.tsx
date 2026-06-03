'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Users, Plus, Pencil, Power, Eye, EyeOff, Loader2,
  Phone, Mail, Calendar, UserCheck, AlertCircle, ShieldCheck, Wrench,
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

      const url = modal === 'crear' ? '/api/usuarios' : `/api/usuarios/${selected!.id}`
      const method = modal === 'crear' ? 'POST' : 'PUT'

      if (modal === 'crear') payload['password'] = form.password

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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-accent" />
            Equipo de Trabajo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activos.length} miembro{activos.length !== 1 ? 's' : ''} activo{activos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" onClick={abrirCrear} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo miembro
        </Button>
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
        </div>
      )}

      {/* Modal */}
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      'bg-surface border border-surface-2 rounded-xl p-4 space-y-3 transition-opacity',
      !m.activo && 'opacity-50',
    )}>
      {/* Nombre + rol */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">{m.nombre}</p>
          <div className={cn('flex items-center gap-1 text-xs mt-0.5', rolColor)}>
            <RolIcon className="h-3 w-3 shrink-0" />
            {LABEL_ROL[m.rol]}
          </div>
        </div>
        {esYo && (
          <span className="shrink-0 text-[10px] bg-primary/20 text-accent border border-primary/30 rounded-full px-2 py-0.5">
            Tú
          </span>
        )}
      </div>

      {/* Datos */}
      <div className="space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 truncate">
          <Mail className="h-3 w-3 shrink-0" />
          <span className="truncate">{m.email}</span>
        </div>
        {m.telefono && (
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 shrink-0" />
            {m.telefono}
          </div>
        )}
        {m.fechaIngreso && (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 shrink-0" />
            Desde {new Date(m.fechaIngreso).toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
          </div>
        )}
        {m.contactoEmergenciaNombre && (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3 w-3 shrink-0 text-yellow-500" />
            <span className="truncate">
              {m.contactoEmergenciaNombre}
              {m.contactoEmergenciaTelefono ? ` · ${m.contactoEmergenciaTelefono}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-2 pt-1 border-t border-surface-2">
        <button
          onClick={() => onEditar(m)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-surface-2"
        >
          <Pencil className="h-3 w-3" />
          Editar
        </button>
        {!esYo && (
          <button
            onClick={() => onToggle(m)}
            disabled={toggling}
            className={cn(
              'flex items-center gap-1.5 text-xs transition-colors px-2 py-1 rounded ml-auto',
              m.activo
                ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                : 'text-green-400 hover:text-green-300 hover:bg-green-400/10',
            )}
          >
            {toggling ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Power className="h-3 w-3" />
            )}
            {m.activo ? 'Desactivar' : 'Activar'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Modal crear / editar ───────────────────────────────────────────────────────

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-surface-2 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-2">
          <h2 className="text-base font-semibold text-foreground">
            {modo === 'crear' ? 'Nuevo miembro' : 'Editar miembro'}
          </h2>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground transition-colors">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Datos personales */}
          <Section label="Datos personales">
            <Field label="Nombre completo *">
              <input
                value={form.nombre}
                onChange={set('nombre')}
                placeholder="Carlos Méndez"
                className={inputCls}
              />
            </Field>
            <Field label="Correo electrónico *">
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="carlos@kingsauto.hn"
                className={inputCls}
              />
            </Field>
            <Field label="Teléfono">
              <input
                value={form.telefono}
                onChange={set('telefono')}
                placeholder="9999-9999"
                className={inputCls}
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
          </Section>

          {/* Rol */}
          <Section label="Rol en el sistema">
            <Field label="Rol *">
              <select
                value={form.rol}
                onChange={set('rol')}
                className={inputCls}
              >
                <option value={RolUsuario.EMPLEADO}>Técnico</option>
                <option value={RolUsuario.CONTROL_CALIDAD}>Control de Calidad</option>
              </select>
            </Field>
          </Section>

          {/* Credenciales */}
          <Section label={modo === 'crear' ? 'Credenciales de acceso' : 'Cambiar contraseña (opcional)'}>
            <Field label={modo === 'crear' ? 'Contraseña *' : 'Nueva contraseña'}>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder={modo === 'crear' ? 'Mínimo 8 caracteres' : 'Dejar en blanco para no cambiar'}
                  className={cn(inputCls, 'pr-10')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
          </Section>

          {/* Contacto de emergencia */}
          <Section label="Contacto de emergencia">
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
              />
            </Field>
          </Section>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-surface-2">
          <Button variant="outline" onClick={onCerrar} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onGuardar} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {modo === 'crear' ? 'Crear miembro' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Helpers UI ─────────────────────────────────────────────────────────────────

const inputCls = 'w-full h-9 rounded-md bg-surface-2 border border-surface-2 text-sm text-white px-3 outline-none focus:ring-1 focus:ring-secondary placeholder:text-muted-foreground'

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

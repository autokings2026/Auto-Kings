'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  X, Loader2, MessageCircle, Copy, Check, CheckCircle, XCircle, AlertCircle, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TipoCombustible, LABEL_COMBUSTIBLE } from '@kings/shared'
import { FotoUpload } from '@/components/ordenes/foto-upload'
import { ChecklistFields } from '@/components/ordenes/checklist-fields'

interface Usuario { id: string; nombre: string; email: string }
interface FotoIngreso {
  id: string; url: string; publicId: string; createdAt: string
  tipoFoto?: { id: string; nombre: string } | null
}

interface Props {
  citaId: string
  clienteNombre: string
  vehiculo: string
  onClose: () => void
}

export function RecepcionVehiculoModal({ citaId, clienteNombre, vehiculo, onClose }: Props) {
  const { data: session } = useSession()
  const router = useRouter()

  const [otId, setOtId] = useState<string | null>(null)
  const [fotos, setFotos] = useState<FotoIngreso[]>([])
  const [error, setError] = useState('')

  // ── Paso 1: datos del vehículo ────────────────────────────────────────────
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(true)
  const [tecnicoId, setTecnicoId] = useState('')
  const [color, setColor] = useState('')
  const [combustible, setCombustible] = useState<TipoCombustible>(TipoCombustible.GASOLINA)
  const [kilometraje, setKilometraje] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!session?.user) return
    setLoadingUsuarios(true)
    fetch('/api/usuarios')
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((raw: unknown) => {
        const list: Usuario[] = Array.isArray(raw) ? raw : (raw as { data: Usuario[] })?.data ?? []
        setUsuarios(list)
        if (list.length > 0) setTecnicoId(list[0]!.id)
      })
      .catch(e => setError(`No se pudieron cargar los técnicos: ${e.message}`))
      .finally(() => setLoadingUsuarios(false))
  }, [session])

  const crearOT = async () => {
    if (!tecnicoId || !color || !kilometraje) { setError('Completa todos los campos'); return }
    setCreating(true); setError('')
    try {
      const res = await fetch('/api/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citaId, tecnicoId, color, combustible, kilometraje: Number(kilometraje) }),
      })
      if (!res.ok) { const e = await res.json(); setError(e.message); return }
      const ot = await res.json()
      setOtId(ot.id)
    } finally { setCreating(false) }
  }

  // ── Paso 2: checklist + fotos + envío al cliente ──────────────────────────
  const [testigos, setTestigos] = useState<string[]>([])
  const [testigoOtro, setTestigoOtro] = useState('')
  const [anormalidades, setAnormalidades] = useState<string[]>([])
  const [anormalidadOtro, setAnormalidadOtro] = useState('')
  const [obsRecepcion, setObsRecepcion] = useState('')
  const [obsAdicionales, setObsAdicionales] = useState('')
  const [savingChecklist, setSavingChecklist] = useState(false)
  const [checklistSaved, setChecklistSaved] = useState(false)

  const [sendingWa, setSendingWa] = useState(false)
  const [waLink, setWaLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [registrando, setRegistrando] = useState(false)
  const [aceptado, setAceptado] = useState<boolean | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const guardarChecklist = async () => {
    if (!otId) return
    setSavingChecklist(true); setError('')
    try {
      const res = await fetch(`/api/ordenes/${otId}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testigos,
          testigoOtro: testigoOtro || undefined,
          anormalidades,
          anormalidadOtro: anormalidadOtro || undefined,
          observacionesRecepcion: obsRecepcion || undefined,
          observacionesAdicionales: obsAdicionales || undefined,
        }),
      })
      if (!res.ok) { const e = await res.json(); setError(e.message); return }
      const chk = await res.json()
      setToken(chk.tokenAprobacion)
      setChecklistSaved(true)
    } finally { setSavingChecklist(false) }
  }

  const enviarWhatsapp = async () => {
    if (!otId) return
    setSendingWa(true); setError('')
    try {
      const res = await fetch(`/api/ordenes/${otId}/whatsapp/checklist`)
      if (!res.ok) { const e = await res.json(); setError(e.message); return }
      const { waLink: link } = await res.json()
      setWaLink(link)
    } finally { setSendingWa(false) }
  }

  const copyLink = () => {
    if (!token) return
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    navigator.clipboard.writeText(`${appUrl}/checklist/${token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const registrarAceptacion = async (val: boolean) => {
    if (!otId) return
    setRegistrando(true)
    try {
      await fetch(`/api/ordenes/${otId}/checklist/aceptacion`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aceptado: val }),
      })
      setAceptado(val)
    } finally { setRegistrando(false) }
  }

  const finalizar = () => {
    onClose()
    if (otId) router.push(`/ordenes/${otId}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-surface border border-surface-2 rounded-xl w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-2 sticky top-0 bg-surface z-10">
          <div>
            <h2 className="font-semibold text-white">Recibir Vehículo</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{clienteNombre} · {vehiculo}</p>
          </div>
          <button onClick={finalizar} className="text-muted-foreground hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Paso 1 — datos del vehículo */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">1. Datos del vehículo</p>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Técnico asignado *</Label>
              <select
                value={tecnicoId}
                onChange={e => setTecnicoId(e.target.value)}
                disabled={loadingUsuarios || !!otId}
                className="w-full h-10 rounded-md border border-surface-2 bg-surface-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50"
              >
                {loadingUsuarios
                  ? <option value="">Cargando técnicos…</option>
                  : usuarios.length === 0
                    ? <option value="">No hay técnicos disponibles</option>
                    : usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)
                }
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Color *</Label>
                <Input value={color} onChange={e => setColor(e.target.value)} disabled={!!otId} placeholder="Ej: Blanco" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Kilometraje *</Label>
                <Input value={kilometraje} onChange={e => setKilometraje(e.target.value)} disabled={!!otId} type="number" min="0" placeholder="Ej: 45000" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Combustible</Label>
              <select
                value={combustible}
                onChange={e => setCombustible(e.target.value as TipoCombustible)}
                disabled={!!otId}
                className="w-full h-10 rounded-md border border-surface-2 bg-surface-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50"
              >
                {Object.values(TipoCombustible).map(c => <option key={c} value={c}>{LABEL_COMBUSTIBLE[c]}</option>)}
              </select>
            </div>

            {!otId && (
              <Button variant="primary" onClick={crearOT} disabled={creating} className="w-full sm:w-auto">
                {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando…</> : <>Continuar <ArrowRight className="h-4 w-4 ml-1" /></>}
              </Button>
            )}
          </div>

          {/* Paso 2 — inspección: fotos + checklist */}
          {otId && (
            <div className="space-y-5 pt-4 border-t border-surface-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">2. Inspección del vehículo</p>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Fotos de ingreso</Label>
                <FotoUpload ordenId={otId} fotos={fotos} onUpdate={setFotos} />
              </div>

              <ChecklistFields
                state={{
                  testigos, setTestigos, testigoOtro, setTestigoOtro,
                  anormalidades, setAnormalidades, anormalidadOtro, setAnormalidadOtro,
                  obsRecepcion, setObsRecepcion, obsAdicionales, setObsAdicionales,
                }}
                readonly={aceptado !== null}
              />

              {aceptado === null && (
                <Button variant="primary" onClick={guardarChecklist} disabled={savingChecklist} className="w-full sm:w-auto">
                  {savingChecklist ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando…</> : checklistSaved ? 'Actualizar checklist' : 'Guardar checklist'}
                </Button>
              )}

              {/* Envío al cliente — un solo mensaje con todo */}
              {checklistSaved && aceptado === null && (
                <div className="rounded-lg border border-surface-2 bg-surface-2/40 p-4 space-y-3">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Enviar recepción al cliente (fotos + checklist en un solo mensaje)
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {waLink ? (
                      <a href={waLink} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="border-green-600/50 text-green-400 hover:bg-green-600/10">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Abrir WhatsApp ↗
                        </Button>
                      </a>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={enviarWhatsapp}
                        disabled={sendingWa}
                        className="border-green-600/50 text-green-400 hover:bg-green-600/10"
                      >
                        {sendingWa ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-2" />}
                        Enviar por WhatsApp
                      </Button>
                    )}
                    <Button variant="outline" onClick={copyLink}>
                      {copied ? <Check className="h-4 w-4 mr-2 text-green-400" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copied ? 'Link copiado' : 'Copiar link cliente'}
                    </Button>
                  </div>

                  <div className="pt-2 border-t border-surface-2">
                    <p className="text-xs text-muted-foreground mb-2">Si el cliente está presente y acepta de palabra, registra la respuesta directamente:</p>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        onClick={() => registrarAceptacion(true)}
                        disabled={registrando}
                        className="bg-green-600 hover:bg-green-500 text-white"
                      >
                        {registrando ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-1" />Cliente aceptó en persona</>}
                      </Button>
                      <Button variant="destructive" onClick={() => registrarAceptacion(false)} disabled={registrando}>
                        <XCircle className="h-4 w-4 mr-1" />Cliente rechazó
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {aceptado !== null && (
                <div className={`flex items-center gap-2 text-sm font-medium ${aceptado ? 'text-green-400' : 'text-red-400'}`}>
                  {aceptado ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {aceptado ? 'Cliente aceptó — puede avanzar a Diagnóstico desde la OT' : 'Cliente rechazó — resuelve la diferencia antes de continuar'}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        {otId && (
          <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-2 sticky bottom-0 bg-surface">
            <Button variant="primary" onClick={finalizar}>
              Ir a la Orden de Trabajo <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

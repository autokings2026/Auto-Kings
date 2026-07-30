'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, CheckCircle, XCircle, MessageCircle, Copy, Check, AlertCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { FotoUpload } from './foto-upload'
import { FaseOT, TESTIGOS_TABLERO, ANORMALIDADES_REPORTADAS } from '@kings/shared'
import type { OrdenDetalle } from './ot-detail'

function toggle(list: string[], item: string): string[] {
  return list.includes(item) ? list.filter(i => i !== item) : [...list, item]
}

function CheckboxGrid({
  items, selected, onToggle, readonly,
}: {
  items: string[]
  selected: string[]
  onToggle: (item: string) => void
  readonly: boolean
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
      {items.map(item => (
        <label
          key={item}
          className={`flex items-center gap-2 text-sm px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors ${
            selected.includes(item)
              ? 'border-accent/40 bg-accent/10 text-white'
              : 'border-surface-2 bg-surface-2/40 text-muted-foreground hover:text-foreground'
          } ${readonly ? 'cursor-not-allowed opacity-70' : ''}`}
        >
          <input
            type="checkbox"
            checked={selected.includes(item)}
            onChange={() => !readonly && onToggle(item)}
            disabled={readonly}
            className="accent-secondary h-3.5 w-3.5 shrink-0"
          />
          {item}
        </label>
      ))}
    </div>
  )
}

export function FaseFotos({ orden, onUpdate }: { orden: OrdenDetalle; onUpdate: () => void }) {
  const { data: session } = useSession()
  const isActive = orden.faseActual === FaseOT.LLEGADA_FOTOS
  const chk = orden.checklistRecepcion

  const [advancing, setAdvancing] = useState(false)

  // Formulario checklist
  const [testigos, setTestigos] = useState<string[]>(chk?.testigos ?? [])
  const [testigoOtro, setTestigoOtro] = useState(chk?.testigoOtro ?? '')
  const [anormalidades, setAnormalidades] = useState<string[]>(chk?.anormalidades ?? [])
  const [anormalidadOtro, setAnormalidadOtro] = useState(chk?.anormalidadOtro ?? '')
  const [obsRecepcion, setObsRecepcion] = useState(chk?.observacionesRecepcion ?? '')
  const [obsAdicionales, setObsAdicionales] = useState(chk?.observacionesAdicionales ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [sendingWa, setSendingWa] = useState(false)
  const [waLink, setWaLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [registrando, setRegistrando] = useState(false)

  const checklistLocked = chk?.aceptado !== undefined && chk?.aceptado !== null
  const readonly = !isActive || checklistLocked

  const guardarChecklist = async () => {
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/ordenes/${orden.id}/checklist`, {
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
      onUpdate()
    } finally { setSaving(false) }
  }

  const enviarWhatsapp = async () => {
    setSendingWa(true)
    try {
      const res = await fetch(`/api/ordenes/${orden.id}/whatsapp/checklist`)
      if (!res.ok) { const e = await res.json(); setError(e.message); return }
      const { waLink: link } = await res.json()
      setWaLink(link)
      onUpdate()
    } finally { setSendingWa(false) }
  }

  const copyLink = () => {
    if (!chk?.tokenAprobacion) return
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    navigator.clipboard.writeText(`${appUrl}/checklist/${chk.tokenAprobacion}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const registrarAceptacion = async (aceptado: boolean) => {
    setRegistrando(true)
    try {
      await fetch(`/api/ordenes/${orden.id}/checklist/aceptacion`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aceptado }),
      })
      onUpdate()
    } finally { setRegistrando(false) }
  }

  const avanzar = async () => {
    setAdvancing(true)
    try {
      const res = await fetch(`/api/ordenes/${orden.id}/avanzar`, { method: 'PATCH' })
      if (!res.ok) { const e = await res.json(); setError(e.message); return }
      onUpdate()
    } finally { setAdvancing(false) }
  }

  return (
    <div className="space-y-4">
      {/* Fotos */}
      <div className="rounded-xl border border-surface-2 bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-accent">
            Fase 1 · Llegada y Fotos
          </h2>
          <span className="text-xs text-muted-foreground">{orden.fotos.length} foto(s)</span>
        </div>
        <FotoUpload
          ordenId={orden.id}
          fotos={orden.fotos}
          onUpdate={onUpdate}
          readonly={!isActive}
        />
      </div>

      {/* Checklist de recepción */}
      <div className="rounded-xl border border-surface-2 bg-surface p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-accent">
            Checklist de Recepción
          </h2>
          {checklistLocked && (
            <span className={`flex items-center gap-1.5 text-xs font-medium ${chk?.aceptado ? 'text-green-400' : 'text-red-400'}`}>
              {chk?.aceptado ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {chk?.aceptado ? 'Aceptado por el cliente' : 'Rechazado por el cliente'}
            </span>
          )}
        </div>

        {/* Testigos del tablero */}
        <div className="space-y-2">
          <Label className="text-muted-foreground">Testigos del tablero encendidos</Label>
          <CheckboxGrid items={TESTIGOS_TABLERO} selected={testigos} onToggle={(i) => setTestigos(t => toggle(t, i))} readonly={readonly} />
          <input
            value={testigoOtro}
            onChange={e => setTestigoOtro(e.target.value)}
            disabled={readonly}
            placeholder="Otro testigo…"
            className="w-full h-9 text-sm rounded-lg border border-surface-2 bg-surface-2 px-3 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-secondary disabled:opacity-60"
          />
        </div>

        {/* Anormalidades */}
        <div className="space-y-2">
          <Label className="text-muted-foreground">Anormalidades reportadas por el cliente</Label>
          <CheckboxGrid items={ANORMALIDADES_REPORTADAS} selected={anormalidades} onToggle={(i) => setAnormalidades(a => toggle(a, i))} readonly={readonly} />
          <input
            value={anormalidadOtro}
            onChange={e => setAnormalidadOtro(e.target.value)}
            disabled={readonly}
            placeholder="Otra anormalidad…"
            className="w-full h-9 text-sm rounded-lg border border-surface-2 bg-surface-2 px-3 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-secondary disabled:opacity-60"
          />
        </div>

        {/* Observaciones */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Observaciones de recepción</Label>
            <textarea
              value={obsRecepcion}
              onChange={e => setObsRecepcion(e.target.value)}
              disabled={readonly}
              rows={3}
              className="w-full rounded-md border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary resize-none disabled:opacity-60"
              placeholder="Estado general, golpes, rayones, faltantes…"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Observaciones adicionales</Label>
            <textarea
              value={obsAdicionales}
              onChange={e => setObsAdicionales(e.target.value)}
              disabled={readonly}
              rows={3}
              className="w-full rounded-md border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary resize-none disabled:opacity-60"
              placeholder="Cualquier otra nota relevante…"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {isActive && !checklistLocked && (
          <div className="pt-2 border-t border-surface-2 space-y-4">
            <Button variant="primary" onClick={guardarChecklist} disabled={saving} className="w-full sm:w-auto">
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando…</> : chk ? 'Actualizar checklist' : 'Guardar checklist'}
            </Button>

            {/* Enviar al cliente — visible una vez guardado */}
            {chk && (
              <div className="rounded-lg border border-surface-2 bg-surface-2/40 p-4 space-y-3">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Enviar checklist al cliente para su aceptación</p>

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
          </div>
        )}

        {chk?.aceptado === false && chk.comentarioCliente && (
          <p className="text-xs text-red-400/80">Motivo del rechazo: {chk.comentarioCliente}</p>
        )}
      </div>

      {/* Avanzar de fase */}
      {isActive && (
        <div className="rounded-xl border border-surface-2 bg-surface p-5">
          {chk?.aceptado === true ? (
            <Button variant="primary" onClick={avanzar} disabled={advancing} className="w-full sm:w-auto">
              {advancing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Avanzando…</> : 'Avanzar a Diagnóstico →'}
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4 shrink-0" />
              {!chk
                ? 'Guarda y haz aceptar el checklist de recepción al cliente para poder avanzar.'
                : chk.aceptado === false
                ? 'El checklist fue rechazado — resuelve la diferencia con el cliente antes de continuar.'
                : 'Esperando que el cliente acepte el checklist de recepción.'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

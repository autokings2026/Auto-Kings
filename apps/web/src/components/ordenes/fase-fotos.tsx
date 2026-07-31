'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, CheckCircle, XCircle, MessageCircle, Copy, Check, AlertCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FotoUpload } from './foto-upload'
import { ChecklistFields } from './checklist-fields'
import { FaseOT } from '@kings/shared'
import type { OrdenDetalle } from './ot-detail'

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

        <ChecklistFields
          state={{
            testigos, setTestigos, testigoOtro, setTestigoOtro,
            anormalidades, setAnormalidades, anormalidadOtro, setAnormalidadOtro,
            obsRecepcion, setObsRecepcion, obsAdicionales, setObsAdicionales,
          }}
          readonly={readonly}
        />

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

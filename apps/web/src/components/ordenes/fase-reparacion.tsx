'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, CheckCircle, XCircle, Plus, Trash2, MessageCircle, Copy, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { FaseOT } from '@kings/shared'
import type { OrdenDetalle } from './ot-detail'
import { ReparacionFotoUpload, type FotoRep } from './reparacion-foto-upload'


// ── Cotización adicional ────────────────────────────────────────────────────

interface ItemRow {
  descripcion: string
  tipo: 'MATERIAL' | 'PARTE' | 'MANO_OBRA'
  cantidad: string
  precioUnitario: string
}

function emptyItem(): ItemRow {
  return { descripcion: '', tipo: 'MANO_OBRA', cantidad: '1', precioUnitario: '0' }
}

function CotizacionAdicionalForm({ ordenId, onCreated }: { ordenId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [items, setItems] = useState<ItemRow[]>([emptyItem()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const updateItem = (i: number, field: keyof ItemRow, val: string) =>
    setItems(rows => rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r))

  const total = items.reduce((sum, item) => sum + Number(item.cantidad) * Number(item.precioUnitario), 0)

  const crear = async () => {
    if (!motivo.trim()) { setError('Explica por qué no se incluyó en la cotización original'); return }
    if (items.some(i => !i.descripcion.trim())) { setError('Completa la descripción de todos los ítems'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/ordenes/${ordenId}/cotizacion-adicional`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motivo: motivo.trim(),
          items: items.map((item, i) => ({
            descripcion: item.descripcion,
            tipo: item.tipo,
            cantidad: Number(item.cantidad),
            precioUnitario: Number(item.precioUnitario),
            posicion: i,
          })),
        }),
      })
      if (!res.ok) { const e = await res.json(); setError(e.message); return }
      setMotivo(''); setItems([emptyItem()]); setOpen(false)
      onCreated()
    } finally { setSaving(false) }
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="w-full sm:w-auto">
        <Plus className="h-4 w-4 mr-2" />Agregar parte no cotizada
      </Button>
    )
  }

  return (
    <div className="rounded-lg border border-surface-2 bg-surface-2/40 p-4 space-y-4">
      <div className="space-y-1.5">
        <Label className="text-muted-foreground">¿Por qué no estaba en la cotización original?</Label>
        <textarea
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
          placeholder="Ej: al desarmar se encontró que la banda de distribución también está dañada…"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-muted-foreground">Ítems</Label>
          <button
            onClick={() => setItems(i => [...i, emptyItem()])}
            className="flex items-center gap-1 text-xs text-accent hover:text-accent/80"
          >
            <Plus className="h-3 w-3" /> Agregar fila
          </button>
        </div>
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-surface-2 bg-surface p-3 space-y-2">
            <div className="flex items-center gap-2">
              <select
                value={item.tipo}
                onChange={e => updateItem(i, 'tipo', e.target.value)}
                className="flex-1 h-9 text-sm rounded-lg border border-surface-2 bg-surface-2 px-2 text-white focus:outline-none focus:ring-1 focus:ring-secondary"
              >
                <option value="MANO_OBRA">Mano de obra</option>
                <option value="MATERIAL">Material</option>
                <option value="PARTE">Parte</option>
              </select>
              {items.length > 1 && (
                <button
                  onClick={() => setItems(rows => rows.filter((_, idx) => idx !== i))}
                  className="p-1.5 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-red-400/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <input
              value={item.descripcion}
              onChange={e => updateItem(i, 'descripcion', e.target.value)}
              placeholder="Descripción…"
              className="w-full h-9 text-sm rounded-lg border border-surface-2 bg-surface-2 px-3 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-secondary"
            />
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-0.5">
                <p className="text-[10px] text-muted-foreground pl-1">Cantidad</p>
                <input
                  value={item.cantidad}
                  onChange={e => updateItem(i, 'cantidad', e.target.value)}
                  type="number"
                  min="0"
                  className="w-full h-9 text-sm text-center rounded-lg border border-surface-2 bg-surface-2 px-2 text-white focus:outline-none focus:ring-1 focus:ring-secondary"
                />
              </div>
              <div className="flex-1 space-y-0.5">
                <p className="text-[10px] text-muted-foreground pl-1">P. unitario</p>
                <input
                  value={item.precioUnitario}
                  onChange={e => updateItem(i, 'precioUnitario', e.target.value)}
                  type="number"
                  min="0"
                  className="w-full h-9 text-sm text-right rounded-lg border border-surface-2 bg-surface-2 px-2 text-white focus:outline-none focus:ring-1 focus:ring-secondary"
                />
              </div>
              <div className="flex-1 space-y-0.5 text-right">
                <p className="text-[10px] text-muted-foreground">Subtotal</p>
                <p className="h-9 flex items-center justify-end text-sm font-medium text-white pr-1">
                  {formatCurrency(Number(item.cantidad) * Number(item.precioUnitario))}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-end text-sm font-bold text-white">
          Total adicional: <span className="text-accent ml-2">{formatCurrency(total)}</span>
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <Button variant="primary" onClick={crear} disabled={saving}>
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando…</> : 'Guardar cotización adicional'}
        </Button>
        <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
      </div>
    </div>
  )
}

function CotizacionAdicionalCard({
  ordenId, cot, onUpdate,
}: {
  ordenId: string
  cot: OrdenDetalle['cotizacionesAdicionales'][number]
  onUpdate: () => void
}) {
  const [sendingWa, setSendingWa] = useState(false)
  const [waLink, setWaLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [approving, setApproving] = useState(false)

  const enviarWhatsapp = async () => {
    // Abrimos la pestaña de inmediato (dentro del gesto de click) para que el
    // navegador no la bloquee; una vez llega el link se la asignamos.
    const win = window.open('about:blank', '_blank')
    setSendingWa(true)
    try {
      const res = await fetch(`/api/ordenes/${ordenId}/cotizacion-adicional/${cot.id}/whatsapp`)
      if (!res.ok) { win?.close(); return }
      const { waLink: link } = await res.json()
      setWaLink(link)
      if (win) win.location.href = link
      else window.open(link, '_blank')
      onUpdate()
    } finally { setSendingWa(false) }
  }

  const copyLink = () => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    navigator.clipboard.writeText(`${appUrl}/cotizacion-adicional/${cot.tokenAprobacion}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const registrarRespuesta = async (aprobado: boolean) => {
    setApproving(true)
    try {
      await fetch(`/api/ordenes/${ordenId}/cotizacion-adicional/${cot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aprobado }),
      })
      onUpdate()
    } finally { setApproving(false) }
  }

  return (
    <div className="rounded-lg border border-surface-2 bg-surface-2/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-white font-medium">{cot.motivo}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Agregada por {cot.creador.nombre} · {new Date(cot.createdAt).toLocaleDateString('es-HN')}
          </p>
        </div>
        {cot.aprobado === null && (
          <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">Pendiente</span>
        )}
        {cot.aprobado === true && (
          <span className="shrink-0 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
            <CheckCircle className="h-3 w-3" /> Aprobada
          </span>
        )}
        {cot.aprobado === false && (
          <span className="shrink-0 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
            <XCircle className="h-3 w-3" /> Rechazada
          </span>
        )}
      </div>

      <div className="space-y-1">
        {cot.items.map(item => (
          <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
            <span>{item.descripcion} · {Number(item.cantidad)} × {formatCurrency(Number(item.precioUnitario))}</span>
            <span className="text-white">{formatCurrency(Number(item.subtotal))}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-surface-2">
          <span>Total</span><span className="text-accent">{formatCurrency(Number(cot.totalGeneral))}</span>
        </div>
      </div>

      {cot.aprobado === null && (
        <div className="pt-2 border-t border-surface-2 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={enviarWhatsapp}
              disabled={sendingWa}
              className="border-green-600/50 text-green-400 hover:bg-green-600/10"
            >
              {sendingWa ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <MessageCircle className="h-3.5 w-3.5 mr-1.5" />}
              Enviar por WhatsApp
            </Button>
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-xs text-green-400 hover:text-green-300 underline">
                ¿No se abrió? Abrir de nuevo
              </a>
            )}
            <Button variant="outline" size="sm" onClick={copyLink}>
              {copied ? <Check className="h-3.5 w-3.5 mr-1.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
              {copied ? 'Link copiado' : 'Copiar link'}
            </Button>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">O registra la respuesta manualmente:</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => registrarRespuesta(true)}
                disabled={approving}
                className="bg-green-600 hover:bg-green-500 text-white"
              >
                {approving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle className="h-3.5 w-3.5 mr-1" />Cliente aprobó</>}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => registrarRespuesta(false)} disabled={approving}>
                <XCircle className="h-3.5 w-3.5 mr-1" />Cliente rechazó
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Fase Reparación ──────────────────────────────────────────────────────────

export function FaseReparacion({ orden, onUpdate }: { orden: OrdenDetalle; onUpdate: () => void }) {
  const { data: session } = useSession()
  const isActive = orden.faseActual === FaseOT.REPARACION
  const rep = orden.reparacion
  const yaFinalizada = !!rep?.finalizadaEn

  const [notas, setNotas] = useState(rep?.notas ?? '')
  const [fotosRep, setFotosRep] = useState<FotoRep[]>(orden.fotosReparacion)
  const [saving, setSaving] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [finalizeError, setFinalizeError] = useState('')

  const cotizacionesPendientes = orden.cotizacionesAdicionales.filter(c => c.aprobado === null)

  const save = async (finalizada = false) => {
    finalizada ? setFinalizing(true) : setSaving(true)
    setFinalizeError('')
    try {
      const res = await fetch(`/api/ordenes/${orden.id}/reparacion`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify({ notas, finalizada }),
      })
      if (!res.ok) {
        const e = await res.json()
        if (finalizada) setFinalizeError(e.message)
        return
      }
      onUpdate()
    } finally {
      finalizada ? setFinalizing(false) : setSaving(false)
    }
  }

  return (
    <Card className="bg-surface border-surface-2">
      <CardContent className="pt-5 pb-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-accent">
            Fase 3 · Reparación
          </h2>
          {yaFinalizada && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <CheckCircle className="h-3.5 w-3.5" /> Finalizada
            </span>
          )}
        </div>

        {/* Info diagnóstico */}
        {orden.diagnostico && (
          <div className="rounded-lg bg-surface-2 p-3 text-sm space-y-1">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Síntoma del cliente
            </p>
            <p className="text-white">{orden.diagnostico.sintomaCliente}</p>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mt-2">
              Diagnóstico
            </p>
            <p className="text-white">{orden.diagnostico.diagnosticoTecnico}</p>
          </div>
        )}

        {/* Fotos de reparación */}
        <div className="space-y-1.5">
          <Label className="text-muted-foreground">Fotos de la reparación</Label>
          <ReparacionFotoUpload
            ordenId={orden.id}
            fotos={fotosRep}
            onUpdate={setFotosRep}
            readonly={!isActive || yaFinalizada}
          />
        </div>

        {/* Notas de reparación */}
        <div className="space-y-1.5">
          <Label className="text-muted-foreground">Notas de reparación</Label>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            disabled={!isActive || yaFinalizada}
            rows={4}
            className="w-full rounded-md border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary resize-none disabled:opacity-60"
            placeholder="Describe el trabajo realizado…"
          />
        </div>

        {/* Cotización adicional — partes/servicios no previstos en la cotización original */}
        {(orden.cotizacionesAdicionales.length > 0 || (isActive && !yaFinalizada)) && (
          <div className="space-y-3 pt-2 border-t border-surface-2">
            <Label className="text-muted-foreground">Cotización adicional</Label>

            {orden.cotizacionesAdicionales.map(cot => (
              <CotizacionAdicionalCard key={cot.id} ordenId={orden.id} cot={cot} onUpdate={onUpdate} />
            ))}

            {isActive && !yaFinalizada && (
              <CotizacionAdicionalForm ordenId={orden.id} onCreated={onUpdate} />
            )}

            {isActive && !yaFinalizada && cotizacionesPendientes.length > 0 && (
              <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                No podrás finalizar la reparación hasta que el cliente responda la cotización adicional pendiente.
              </div>
            )}
          </div>
        )}

        {finalizeError && <p className="text-xs text-red-400">{finalizeError}</p>}

        {isActive && !yaFinalizada && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-surface-2">
            <Button variant="outline" onClick={() => save(false)} disabled={saving || finalizing}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando…</> : 'Guardar notas'}
            </Button>
            <Button
              variant="primary"
              onClick={() => save(true)}
              disabled={saving || finalizing || cotizacionesPendientes.length > 0}
              className="bg-green-700 hover:bg-green-600"
            >
              {finalizing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Finalizando…</>
              ) : (
                'Finalizar reparación → Control de calidad'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

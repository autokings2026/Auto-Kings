'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Trash2, Loader2, CheckCircle, XCircle, MessageCircle, FileDown, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { FaseOT } from '@kings/shared'
import type { OrdenDetalle } from './ot-detail'


interface ItemRow {
  descripcion: string
  tipo: 'MATERIAL' | 'PARTE' | 'MANO_OBRA'
  cantidad: string
  precioUnitario: string
}

function emptyItem(): ItemRow {
  return { descripcion: '', tipo: 'MANO_OBRA', cantidad: '1', precioUnitario: '0' }
}

export function FaseDiagnostico({ orden, onUpdate }: { orden: OrdenDetalle; onUpdate: () => void }) {
  const { data: session } = useSession()
  const isActive = orden.faseActual === FaseOT.DIAGNOSTICO
  const diag = orden.diagnostico

  const [sintoma, setSintoma] = useState(diag?.sintomaCliente ?? '')
  const [diagnostico, setDiagnostico] = useState(diag?.diagnosticoTecnico ?? '')
  const [items, setItems] = useState<ItemRow[]>(
    diag?.items.map(i => ({
      descripcion: i.descripcion,
      tipo: i.tipo as 'MATERIAL' | 'PARTE' | 'MANO_OBRA',
      cantidad: String(i.cantidad),
      precioUnitario: String(i.precioUnitario),
    })) ?? [emptyItem()],
  )
  const [aplicarISV, setAplicarISV] = useState(diag?.aplicarISV ?? false)
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [sendingWa, setSendingWa] = useState(false)
  const [waLink, setWaLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const totales = items.reduce(
    (acc, item) => {
      const sub = Number(item.cantidad) * Number(item.precioUnitario)
      if (item.tipo === 'MATERIAL') acc.materiales += sub
      else if (item.tipo === 'PARTE') acc.partes += sub
      else acc.manoObra += sub
      return acc
    },
    { materiales: 0, partes: 0, manoObra: 0 },
  )
  const subtotal = totales.materiales + totales.partes + totales.manoObra
  const montoISV = aplicarISV ? parseFloat((subtotal * 0.15).toFixed(2)) : 0
  const totalFinal = subtotal + montoISV

  const updateItem = (i: number, field: keyof ItemRow, val: string) =>
    setItems(rows => rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r))

  const save = async () => {
    if (!sintoma || !diagnostico) { setError('Completa síntoma y diagnóstico'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/ordenes/${orden.id}/diagnostico`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify({
          sintomaCliente: sintoma,
          diagnosticoTecnico: diagnostico,
          aplicarISV,
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
      onUpdate()
    } finally { setSaving(false) }
  }

  const enviarWhatsapp = async () => {
    // Abrimos la pestaña de inmediato (dentro del gesto de click) para que el
    // navegador no la bloquee; una vez llega el link se la asignamos.
    const win = window.open('about:blank', '_blank')
    setSendingWa(true)
    try {
      const res = await fetch(`/api/ordenes/${orden.id}/whatsapp/cotizacion`)
      if (!res.ok) { const e = await res.json(); setError(e.message); win?.close(); return }
      const { waLink: link } = await res.json()
      setWaLink(link)
      if (win) win.location.href = link
      else window.open(link, '_blank')
      onUpdate()
    } finally { setSendingWa(false) }
  }

  const copyLink = () => {
    if (!diag?.tokenAprobacion) return
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    navigator.clipboard.writeText(`${appUrl}/cotizacion/${diag.tokenAprobacion}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const registrarAprobacion = async (aprobado: boolean) => {
    setApproving(true)
    try {
      await fetch(`/api/ordenes/${orden.id}/diagnostico/aprobacion`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify({ aprobado }),
      })
      onUpdate()
    } finally { setApproving(false) }
  }

  const readonly = !isActive || diag?.aprobado !== undefined && diag.aprobado !== null

  return (
    <Card className="bg-surface border-surface-2">
      <CardContent className="pt-5 pb-5 space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-accent">
          Fase 2 · Diagnóstico y Cotización
        </h2>

        {/* Síntoma del cliente */}
        <div className="space-y-1.5">
          <Label className="text-muted-foreground">Síntoma reportado por el cliente</Label>
          <textarea
            value={sintoma}
            onChange={e => setSintoma(e.target.value)}
            disabled={readonly}
            rows={2}
            className="w-full rounded-md border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary resize-none disabled:opacity-60"
            placeholder="Describe lo que reportó el cliente…"
          />
        </div>

        {/* Diagnóstico técnico */}
        <div className="space-y-1.5">
          <Label className="text-muted-foreground">Diagnóstico técnico</Label>
          <textarea
            value={diagnostico}
            onChange={e => setDiagnostico(e.target.value)}
            disabled={readonly}
            rows={3}
            className="w-full rounded-md border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary resize-none disabled:opacity-60"
            placeholder="Diagnóstico técnico detallado…"
          />
        </div>

        {/* Items cotización */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground">Items de cotización</Label>
            {!readonly && (
              <button
                onClick={() => setItems(i => [...i, emptyItem()])}
                className="flex items-center gap-1 text-xs text-accent hover:text-accent/80"
              >
                <Plus className="h-3 w-3" /> Agregar fila
              </button>
            )}
          </div>

          {/* Móvil: cards apiladas · Desktop: tabla */}
          <div className="space-y-2 sm:hidden">
            {items.map((item, i) => (
              <div key={i} className="rounded-lg border border-surface-2 bg-surface-2/40 p-3 space-y-2">
                {/* Fila 1: tipo + eliminar */}
                <div className="flex items-center gap-2">
                  <select
                    value={item.tipo}
                    onChange={e => updateItem(i, 'tipo', e.target.value)}
                    disabled={readonly}
                    className="flex-1 h-9 text-sm rounded-lg border border-surface-2 bg-surface-2 px-2 text-white disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-secondary"
                  >
                    <option value="MANO_OBRA">Mano de obra</option>
                    <option value="MATERIAL">Material</option>
                    <option value="PARTE">Parte</option>
                  </select>
                  {!readonly && (
                    <button
                      onClick={() => setItems(rows => rows.filter((_, idx) => idx !== i))}
                      className="p-1.5 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-red-400/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {/* Fila 2: descripción */}
                <input
                  value={item.descripcion}
                  onChange={e => updateItem(i, 'descripcion', e.target.value)}
                  disabled={readonly}
                  placeholder="Descripción…"
                  className="w-full h-9 text-sm rounded-lg border border-surface-2 bg-surface-2 px-3 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-secondary disabled:opacity-60"
                />
                {/* Fila 3: cant · precio · subtotal */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-0.5">
                    <p className="text-[10px] text-muted-foreground pl-1">Cantidad</p>
                    <input
                      value={item.cantidad}
                      onChange={e => updateItem(i, 'cantidad', e.target.value)}
                      disabled={readonly}
                      type="number"
                      min="0"
                      className="w-full h-9 text-sm text-center rounded-lg border border-surface-2 bg-surface-2 px-2 text-white focus:outline-none focus:ring-1 focus:ring-secondary disabled:opacity-60"
                    />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-[10px] text-muted-foreground pl-1">P. unitario</p>
                    <input
                      value={item.precioUnitario}
                      onChange={e => updateItem(i, 'precioUnitario', e.target.value)}
                      disabled={readonly}
                      type="number"
                      min="0"
                      className="w-full h-9 text-sm text-right rounded-lg border border-surface-2 bg-surface-2 px-2 text-white focus:outline-none focus:ring-1 focus:ring-secondary disabled:opacity-60"
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
          </div>

          {/* Desktop: tabla */}
          <div className="hidden sm:block rounded-lg border border-surface-2 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-2 text-xs text-muted-foreground">
                  <th className="px-3 py-2 text-left">Descripción</th>
                  <th className="px-3 py-2 text-left w-36">Tipo</th>
                  <th className="px-3 py-2 text-right w-20">Cant.</th>
                  <th className="px-3 py-2 text-right w-28">P. Unit.</th>
                  <th className="px-3 py-2 text-right w-28">Subtotal</th>
                  {!readonly && <th className="w-8" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-2">
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5">
                      <Input
                        value={item.descripcion}
                        onChange={e => updateItem(i, 'descripcion', e.target.value)}
                        disabled={readonly}
                        className="h-8 text-xs border-0 bg-transparent p-0 focus-visible:ring-0"
                        placeholder="Descripción…"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <select
                        value={item.tipo}
                        onChange={e => updateItem(i, 'tipo', e.target.value)}
                        disabled={readonly}
                        className="h-8 w-full text-xs rounded border border-surface-2 bg-surface-2 px-2 text-white disabled:opacity-60"
                      >
                        <option value="MANO_OBRA">Mano de obra</option>
                        <option value="MATERIAL">Material</option>
                      </select>
                    </td>
                    <td className="px-3 py-1.5">
                      <Input
                        value={item.cantidad}
                        onChange={e => updateItem(i, 'cantidad', e.target.value)}
                        disabled={readonly}
                        type="number"
                        min="0"
                        className="h-8 text-xs text-right border-0 bg-transparent p-0 focus-visible:ring-0"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <Input
                        value={item.precioUnitario}
                        onChange={e => updateItem(i, 'precioUnitario', e.target.value)}
                        disabled={readonly}
                        type="number"
                        min="0"
                        className="h-8 text-xs text-right border-0 bg-transparent p-0 focus-visible:ring-0"
                      />
                    </td>
                    <td className="px-3 py-1.5 text-right text-white text-xs">
                      {formatCurrency(Number(item.cantidad) * Number(item.precioUnitario))}
                    </td>
                    {!readonly && (
                      <td className="px-2 py-1.5">
                        <button
                          onClick={() => setItems(rows => rows.filter((_, idx) => idx !== i))}
                          className="text-muted-foreground hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales + toggle ISV */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            {/* Botón ISV */}
            {!readonly && (
              <button
                type="button"
                onClick={() => setAplicarISV(v => !v)}
                className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                  aplicarISV
                    ? 'bg-accent/10 border-accent/40 text-accent'
                    : 'border-surface-2 text-muted-foreground hover:text-foreground hover:border-surface-2'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${aplicarISV ? 'bg-accent border-accent' : 'border-muted-foreground'}`}>
                  {aplicarISV && <span className="text-[9px] text-black font-bold">✓</span>}
                </span>
                Aplicar ISV 15%
              </button>
            )}

            {/* Desglose */}
            <div className="text-sm space-y-1 text-right self-end">
              <div className="flex justify-between gap-8 text-muted-foreground">
                <span>Materiales</span>
                <span>{formatCurrency(totales.materiales)}</span>
              </div>
              <div className="flex justify-between gap-8 text-muted-foreground">
                <span>Partes</span>
                <span>{formatCurrency(totales.partes)}</span>
              </div>
              <div className="flex justify-between gap-8 text-muted-foreground">
                <span>Mano de obra</span>
                <span>{formatCurrency(totales.manoObra)}</span>
              </div>
              {aplicarISV && (
                <>
                  <div className="flex justify-between gap-8 text-muted-foreground border-t border-surface-2 pt-1">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between gap-8 text-accent/80">
                    <span>ISV (15%)</span>
                    <span>+ {formatCurrency(montoISV)}</span>
                  </div>
                </>
              )}
              <div className={`flex justify-between gap-8 font-bold text-white border-t border-surface-2 pt-1 ${!aplicarISV ? '' : 'mt-0.5'}`}>
                <span>Total</span>
                <span className="text-accent">{formatCurrency(totalFinal)}</span>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {/* Acciones */}
        {isActive && (
          <div className="pt-2 border-t border-surface-2 space-y-4">

            {/* Guardar */}
            {(diag?.aprobado === undefined || diag?.aprobado === null) && (
              <Button variant="primary" onClick={save} disabled={saving || readonly} className="w-full sm:w-auto">
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando…</> : 'Guardar cotización'}
              </Button>
            )}

            {/* WhatsApp + PDF + Link — visible cuando ya hay diagnóstico pendiente de aprobación */}
            {diag && diag.aprobado === null && (
              <div className="rounded-lg border border-surface-2 bg-surface-2/40 p-4 space-y-3">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Enviar cotización al cliente</p>

                <div className="flex flex-wrap items-center gap-2">
                  {/* WhatsApp — un solo clic: genera el link y abre WhatsApp de inmediato */}
                  <Button
                    variant="outline"
                    onClick={enviarWhatsapp}
                    disabled={sendingWa}
                    className="border-green-600/50 text-green-400 hover:bg-green-600/10"
                  >
                    {sendingWa
                      ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      : <MessageCircle className="h-4 w-4 mr-2" />}
                    Enviar por WhatsApp
                  </Button>
                  {waLink && (
                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-xs text-green-400 hover:text-green-300 underline">
                      ¿No se abrió? Abrir de nuevo
                    </a>
                  )}

                  {/* PDF */}
                  <a
                    href={`/api/cotizacion/pdf/${diag.tokenAprobacion}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="border-blue-600/50 text-blue-400 hover:bg-blue-600/10">
                      <FileDown className="h-4 w-4 mr-2" />
                      Descargar PDF
                    </Button>
                  </a>

                  {/* Copiar link */}
                  <Button variant="outline" onClick={copyLink}>
                    {copied ? <Check className="h-4 w-4 mr-2 text-green-400" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? 'Link copiado' : 'Copiar link cliente'}
                  </Button>
                </div>

                {/* Aprobación manual */}
                <div className="pt-2 border-t border-surface-2">
                  <p className="text-xs text-muted-foreground mb-2">O registra la respuesta manualmente:</p>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={() => registrarAprobacion(true)}
                      disabled={approving}
                      className="bg-green-600 hover:bg-green-500 text-white"
                    >
                      {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-1" />Cliente aprobó</>}
                    </Button>
                    <Button variant="destructive" onClick={() => registrarAprobacion(false)} disabled={approving}>
                      <XCircle className="h-4 w-4 mr-1" />Cliente rechazó
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Estado final */}
            {diag?.aprobado !== null && diag?.aprobado !== undefined && (
              <div className={`flex items-center gap-2 text-sm font-medium ${diag.aprobado ? 'text-green-400' : 'text-red-400'}`}>
                {diag.aprobado ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {diag.aprobado ? 'Cotización aprobada — reparación en curso' : 'Cotización rechazada por el cliente'}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

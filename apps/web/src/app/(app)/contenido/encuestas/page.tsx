'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, XCircle, Clock, Star, Phone, Gift, Loader2, MessageCircle } from 'lucide-react'

interface Encuesta {
  id: string
  ordenId: string
  ordenNumero: string
  placa: string
  vehiculo: string
  cliente: { nombre: string; telefono: string; email: string | null }
  calidad: number | null
  tiempo: number | null
  atencion: number | null
  promedio: number | null
  comentario: string | null
  respondidoEn: string | null
  estadoRevision: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'
  requiereLlamada: boolean
  notasSeguimiento: string | null
  cortesiaTipo: string | null
  codigoCortesia: string | null
  codigoEnviadoEn: string | null
  revisadoEn: string | null
  revisadoPor: string | null
}

const ESTADO_CONFIG = {
  PENDIENTE: { label: 'Pendiente', class: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: Clock },
  APROBADA: { label: 'Aprobada y publicada', class: 'bg-green-500/10 text-green-400 border-green-500/20', icon: CheckCircle2 },
  RECHAZADA: { label: 'Mal servicio', class: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
}

const FILTROS = ['PENDIENTE', 'RECHAZADA', 'APROBADA', 'TODAS'] as const

const CORTESIAS = ['Cambio de aceite gratis', 'Servicio de cortesía gratis', 'Descuento en próxima visita']

function Estrellas({ value }: { value: number | null }) {
  if (!value) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3 w-3 ${i < value ? 'text-amber-400 fill-amber-400' : 'text-border'}`} />
      ))}
    </span>
  )
}

export default function AdminEncuestasPage() {
  const [encuestas, setEncuestas] = useState<Encuesta[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<typeof FILTROS[number]>('PENDIENTE')
  const [pendientes, setPendientes] = useState(0)
  const [procesando, setProcesando] = useState<string | null>(null)
  const [rechazando, setRechazando] = useState<string | null>(null)
  const [requiereLlamada, setRequiereLlamada] = useState(false)
  const [notas, setNotas] = useState('')
  const [cortesiaSel, setCortesiaSel] = useState<Record<string, string>>({})

  const cargar = useCallback(() => {
    setLoading(true)
    const qs = filtro === 'TODAS' ? '' : `?estado=${filtro}`
    fetch(`/api/admin/encuestas${qs}`)
      .then(r => r.json())
      .then(data => { setEncuestas(data.data ?? []); setPendientes(data.pendientes ?? 0); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filtro])

  useEffect(() => { cargar() }, [cargar])

  const aprobar = async (id: string) => {
    setProcesando(id)
    try {
      const res = await fetch(`/api/admin/encuestas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'aprobar' }),
      })
      if (!res.ok) { const e = await res.json(); alert(e.message); return }
      cargar()
    } finally { setProcesando(null) }
  }

  const confirmarRechazo = async (id: string) => {
    setProcesando(id)
    try {
      const res = await fetch(`/api/admin/encuestas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'rechazar', requiereLlamada, notasSeguimiento: notas || undefined }),
      })
      if (!res.ok) { const e = await res.json(); alert(e.message); return }
      setRechazando(null)
      setRequiereLlamada(false)
      setNotas('')
      cargar()
    } finally { setProcesando(null) }
  }

  const enviarCortesia = async (id: string) => {
    const tipo = cortesiaSel[id] ?? CORTESIAS[0]!
    // Abrimos la pestaña dentro del gesto de click para evitar el bloqueo de
    // pop-ups del navegador; se redirige apenas llega el link generado.
    const win = window.open('about:blank', '_blank')
    setProcesando(id)
    try {
      const res = await fetch(`/api/admin/encuestas/${id}/cortesia?tipo=${encodeURIComponent(tipo)}`)
      if (!res.ok) { const e = await res.json(); alert(e.message); win?.close(); return }
      const { waLink } = await res.json()
      if (win) win.location.href = waLink
      else window.open(waLink, '_blank')
      cargar()
    } finally { setProcesando(null) }
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Encuestas de Satisfacción</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Revisa los comentarios de clientes. Al aprobar, se publica como reseña en la página web;
          al rechazar por mal servicio, puedes marcar seguimiento y enviar una cortesía.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTROS.map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtro === f
                ? 'bg-secondary text-white'
                : 'border border-border text-muted-foreground hover:text-foreground hover:bg-surface-2'
            }`}
          >
            {f === 'TODAS' ? 'Todas' : ESTADO_CONFIG[f].label}
            {f === 'PENDIENTE' && pendientes > 0 && (
              <span className="ml-2 text-xs opacity-80">({pendientes})</span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      )}

      {!loading && encuestas.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="text-muted-foreground text-sm">No hay encuestas en esta categoría.</p>
        </div>
      )}

      {!loading && encuestas.length > 0 && (
        <div className="space-y-3">
          {encuestas.map(e => {
            const cfg = ESTADO_CONFIG[e.estadoRevision]
            return (
              <div key={e.id} className="rounded-xl border border-border bg-surface p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-foreground text-sm">{e.cliente.nombre}</p>
                      <span className="text-xs text-muted-foreground">— {e.vehiculo} · {e.placa}</span>
                      <span className="text-xs text-muted-foreground/60 font-mono">{e.ordenNumero}</span>
                    </div>
                    <div className="flex items-center gap-4 mb-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">Calidad <Estrellas value={e.calidad} /></span>
                      <span className="flex items-center gap-1">Tiempo <Estrellas value={e.tiempo} /></span>
                      <span className="flex items-center gap-1">Atención <Estrellas value={e.atencion} /></span>
                    </div>
                    {e.comentario && (
                      <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{e.comentario}&rdquo;</p>
                    )}
                    {e.respondidoEn && (
                      <p className="text-xs text-muted-foreground/60 mt-2">
                        Respondida el {new Date(e.respondidoEn).toLocaleDateString('es-HN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>

                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${cfg.class}`}>
                    <cfg.icon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                </div>

                {/* Acciones — pendiente */}
                {e.estadoRevision === 'PENDIENTE' && rechazando !== e.id && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => aprobar(e.id)}
                      disabled={procesando === e.id || !e.comentario}
                      title={!e.comentario ? 'No hay comentario para publicar' : undefined}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {procesando === e.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Aprobar y publicar
                    </button>
                    <button
                      onClick={() => setRechazando(e.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Marcar mal servicio
                    </button>
                  </div>
                )}

                {/* Formulario de rechazo */}
                {rechazando === e.id && (
                  <div className="pt-3 border-t border-border space-y-2.5">
                    <label className="flex items-center gap-2 text-xs text-gray-300">
                      <input
                        type="checkbox"
                        checked={requiereLlamada}
                        onChange={ev => setRequiereLlamada(ev.target.checked)}
                        className="h-3.5 w-3.5"
                      />
                      Es necesario llamar al cliente para darle seguimiento
                    </label>
                    <textarea
                      value={notas}
                      onChange={ev => setNotas(ev.target.value)}
                      rows={2}
                      placeholder="Notas de seguimiento (opcional)…"
                      className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => confirmarRechazo(e.id)}
                        disabled={procesando === e.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {procesando === e.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirmar'}
                      </button>
                      <button
                        onClick={() => { setRechazando(null); setRequiereLlamada(false); setNotas('') }}
                        className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Seguimiento — rechazada */}
                {e.estadoRevision === 'RECHAZADA' && (
                  <div className="pt-3 border-t border-border space-y-2.5">
                    {e.requiereLlamada && (
                      <div className="flex items-center gap-2 text-xs text-red-300">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        Llamar a {e.cliente.nombre} · {e.cliente.telefono}
                        {e.cliente.email ? ` · ${e.cliente.email}` : ''}
                      </div>
                    )}
                    {e.notasSeguimiento && (
                      <p className="text-xs text-muted-foreground">{e.notasSeguimiento}</p>
                    )}

                    {e.codigoCortesia ? (
                      <div className="flex items-center gap-2 text-xs text-green-400">
                        <Gift className="h-3.5 w-3.5 shrink-0" />
                        Cortesía enviada: {e.cortesiaTipo} — código <span className="font-mono">{e.codigoCortesia}</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={cortesiaSel[e.id] ?? CORTESIAS[0]}
                          onChange={ev => setCortesiaSel(prev => ({ ...prev, [e.id]: ev.target.value }))}
                          className="h-8 text-xs rounded-lg border border-border bg-surface-2 px-2 text-white"
                        >
                          {CORTESIAS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button
                          onClick={() => enviarCortesia(e.id)}
                          disabled={procesando === e.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600/10 border border-green-600/30 text-green-400 hover:bg-green-600/20 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {procesando === e.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageCircle className="h-3.5 w-3.5" />}
                          Generar código y enviar por WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

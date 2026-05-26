'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  MessageSquare, Send, Loader2, ChevronRight,
  AlertTriangle, Phone, RefreshCw, PlusCircle, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TipoMensajeWA } from '@kings/shared'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Conversacion {
  clienteId: string
  nombre: string
  telefono: string
  noLeidos: number
  ultimoMensaje: {
    id: string
    texto: string
    tipo: TipoMensajeWA
    enviadoEn: string
    enviadoPor: string
  } | null
  minutosDesdeUltimo: number
  alerta: 'amarilla' | 'roja' | null
}

interface Mensaje {
  id: string
  texto: string
  tipo: TipoMensajeWA
  plantillaUsada: string | null
  leido: boolean
  enviadoEn: string
  enviadoPor: string
  ordenNumero: string | null
}

interface Hilo {
  cliente: { id: string; nombre: string; telefono: string }
  mensajes: Mensaje[]
}

interface Plantilla {
  id: string
  tipo: string
  nombre: string
  contenido: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function tiempoRelativo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1)  return 'ahora'
  if (diff < 60) return `${diff}m`
  if (diff < 1440) return `${Math.floor(diff / 60)}h`
  return `${Math.floor(diff / 1440)}d`
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const { data: session } = useSession()
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [loadingConv, setLoadingConv] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hilo, setHilo] = useState<Hilo | null>(null)
  const [loadingHilo, setLoadingHilo] = useState(false)
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const [showEntrante, setShowEntrante] = useState(false)
  const [textoEntrante, setTextoEntrante] = useState('')
  const [showPlantillas, setShowPlantillas] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const authHeader = useCallback(() => ({
    Authorization: `Bearer ${session?.user?.accessToken ?? ''}`,
  }), [session?.user?.accessToken])

  const fetchConversaciones = useCallback(async () => {
    if (!session?.user) return
    try {
      const res = await fetch(`${API}/inbox/conversaciones`, { headers: authHeader() })
      if (res.ok) setConversaciones(await res.json())
    } finally { setLoadingConv(false) }
  }, [session, authHeader])

  const fetchHilo = useCallback(async (clienteId: string) => {
    setLoadingHilo(true)
    try {
      const res = await fetch(`${API}/inbox/conversaciones/${clienteId}`, { headers: authHeader() })
      if (res.ok) {
        const data: Hilo = await res.json()
        setHilo(data)
        setConversaciones(prev => prev.map(c =>
          c.clienteId === clienteId ? { ...c, noLeidos: 0, alerta: null } : c,
        ))
      }
    } finally { setLoadingHilo(false) }
  }, [session, authHeader])

  useEffect(() => { fetchConversaciones() }, [fetchConversaciones])

  useEffect(() => {
    if (!session?.user) return
    fetch(`${API}/inbox/plantillas`, { headers: authHeader() })
      .then(r => r.ok ? r.json() : [])
      .then(setPlantillas)
  }, [session, authHeader])

  useEffect(() => {
    if (selectedId) fetchHilo(selectedId)
  }, [selectedId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [hilo?.mensajes])

  const enviar = async () => {
    if (!texto.trim() || !hilo) return
    setSending(true)
    try {
      const res = await fetch(`${API}/inbox/mensajes`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId: hilo.cliente.id, texto }),
      })
      if (res.ok) {
        const { waLink } = await res.json()
        window.open(waLink, '_blank')
        setTexto('')
        await fetchHilo(hilo.cliente.id)
        await fetchConversaciones()
      }
    } finally { setSending(false) }
  }

  const registrarEntrante = async () => {
    if (!textoEntrante.trim() || !hilo) return
    setSending(true)
    try {
      const res = await fetch(`${API}/inbox/mensajes/entrante`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId: hilo.cliente.id, texto: textoEntrante }),
      })
      if (res.ok) {
        setTextoEntrante('')
        setShowEntrante(false)
        await fetchHilo(hilo.cliente.id)
        await fetchConversaciones()
      }
    } finally { setSending(false) }
  }

  const usarPlantilla = (plantilla: Plantilla) => {
    setTexto(plantilla.contenido)
    setShowPlantillas(false)
  }

  const totalNoLeidos = conversaciones.reduce((acc, c) => acc + c.noLeidos, 0)

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              WhatsApp Inbox
              {totalNoLeidos > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-red-500 text-white text-xs font-bold px-1">
                  {totalNoLeidos}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground text-xs">{conversaciones.length} conversaciones</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchConversaciones} className="text-muted-foreground">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Split pane */}
      <div className="flex-1 flex gap-4 min-h-0">

        {/* ── Lista conversaciones ── */}
        <div className="w-80 shrink-0 flex flex-col bg-surface border border-surface-2 rounded-xl overflow-hidden">
          <div className="px-3 py-2.5 border-b border-surface-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Conversaciones
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-surface-2">
            {loadingConv ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-secondary" />
              </div>
            ) : conversaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Sin conversaciones aún</p>
              </div>
            ) : (
              conversaciones.map(conv => (
                <button
                  key={conv.clienteId}
                  onClick={() => setSelectedId(conv.clienteId)}
                  className={cn(
                    'w-full text-left px-3 py-3 flex items-start gap-3 hover:bg-surface-2 transition-colors',
                    selectedId === conv.clienteId && 'bg-surface-2',
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    'h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                    conv.alerta === 'roja'     ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    conv.alerta === 'amarilla' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                                 'bg-green-500/10 text-green-400 border border-green-500/20',
                  )}>
                    {conv.nombre.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-medium text-white truncate">{conv.nombre}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        {conv.noLeidos > 0 && (
                          <span className="h-4 w-4 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {conv.noLeidos}
                          </span>
                        )}
                        {conv.ultimoMensaje && (
                          <span className="text-[10px] text-muted-foreground">
                            {tiempoRelativo(conv.ultimoMensaje.enviadoEn)}
                          </span>
                        )}
                      </div>
                    </div>
                    {conv.ultimoMensaje && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.ultimoMensaje.tipo === TipoMensajeWA.SALIENTE ? '↗ ' : '↙ '}
                        {conv.ultimoMensaje.texto}
                      </p>
                    )}
                    {conv.alerta && (
                      <p className={cn(
                        'text-[10px] font-medium mt-0.5 flex items-center gap-1',
                        conv.alerta === 'roja' ? 'text-red-400' : 'text-yellow-400',
                      )}>
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {conv.minutosDesdeUltimo}m sin responder
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Hilo de mensajes ── */}
        <div className="flex-1 flex flex-col bg-surface border border-surface-2 rounded-xl overflow-hidden min-w-0">
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground space-y-2">
              <MessageSquare className="h-10 w-10" />
              <p className="text-sm">Selecciona una conversación</p>
            </div>
          ) : loadingHilo ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-secondary" />
            </div>
          ) : hilo ? (
            <>
              {/* Header del hilo */}
              <div className="px-4 py-3 border-b border-surface-2 flex items-center gap-3 shrink-0">
                <div className="h-8 w-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-sm font-bold text-green-400">
                  {hilo.cliente.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{hilo.cliente.nombre}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />{hilo.cliente.telefono}
                  </p>
                </div>
                <a
                  href={`https://wa.me/${hilo.cliente.telefono.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto"
                >
                  <Button variant="outline" size="sm" className="border-green-600/40 text-green-400 hover:bg-green-600/10 text-xs">
                    Abrir WhatsApp
                  </Button>
                </a>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {hilo.mensajes.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-10">Sin mensajes aún</p>
                ) : (
                  hilo.mensajes.map(m => (
                    <div
                      key={m.id}
                      className={cn('flex', m.tipo === TipoMensajeWA.SALIENTE ? 'justify-end' : 'justify-start')}
                    >
                      <div className={cn(
                        'max-w-[75%] rounded-2xl px-4 py-2.5 space-y-1',
                        m.tipo === TipoMensajeWA.SALIENTE
                          ? 'bg-green-600/20 border border-green-600/30 rounded-tr-sm'
                          : 'bg-surface-2 border border-surface-2 rounded-tl-sm',
                      )}>
                        <p className="text-sm text-white whitespace-pre-wrap break-words">{m.texto}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[10px] text-muted-foreground">
                            {m.enviadoPor} · {new Date(m.enviadoEn).toLocaleString('es-HN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                          </p>
                          {m.ordenNumero && (
                            <span className="text-[10px] text-accent border border-accent/20 rounded px-1">
                              OT {m.ordenNumero}
                            </span>
                          )}
                          {m.plantillaUsada && (
                            <span className="text-[10px] text-muted-foreground border border-surface-2 rounded px-1">
                              plantilla
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Registrar entrante */}
              {showEntrante && (
                <div className="px-4 py-3 border-t border-surface-2 bg-surface-2/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-medium">Registrar mensaje recibido del cliente</p>
                    <button onClick={() => setShowEntrante(false)}>
                      <X className="h-4 w-4 text-muted-foreground hover:text-white" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      value={textoEntrante}
                      onChange={e => setTextoEntrante(e.target.value)}
                      rows={2}
                      className="flex-1 rounded-lg border border-surface-2 bg-surface px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                      placeholder="Escribe lo que respondió el cliente…"
                    />
                    <Button onClick={registrarEntrante} disabled={sending || !textoEntrante.trim()} size="sm" className="self-end bg-blue-600 hover:bg-blue-500">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Plantillas dropdown */}
              {showPlantillas && plantillas.length > 0 && (
                <div className="px-4 py-2 border-t border-surface-2 bg-surface-2/40">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Plantillas rápidas</p>
                    <button onClick={() => setShowPlantillas(false)}>
                      <X className="h-4 w-4 text-muted-foreground hover:text-white" />
                    </button>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {plantillas.map(p => (
                      <button
                        key={p.id}
                        onClick={() => usarPlantilla(p)}
                        className="w-full text-left rounded-lg px-3 py-2 hover:bg-surface-2 transition-colors"
                      >
                        <p className="text-xs font-medium text-white">{p.nombre ?? p.tipo}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.contenido}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Composer */}
              <div className="px-4 py-3 border-t border-surface-2 space-y-2 shrink-0">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowPlantillas(p => !p); setShowEntrante(false) }}
                    className="text-muted-foreground hover:text-white shrink-0"
                    title="Plantillas"
                  >
                    <ChevronRight className={cn('h-4 w-4 transition-transform', showPlantillas && 'rotate-90')} />
                  </Button>
                  <textarea
                    value={texto}
                    onChange={e => setTexto(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
                    rows={2}
                    className="flex-1 rounded-xl border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                    placeholder="Escribe un mensaje… (Enter para enviar)"
                  />
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button
                      onClick={enviar}
                      disabled={sending || !texto.trim()}
                      size="sm"
                      className="bg-green-600 hover:bg-green-500 text-white h-8"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setShowEntrante(p => !p); setShowPlantillas(false) }}
                      className="text-muted-foreground hover:text-blue-400 h-8"
                      title="Registrar respuesta del cliente"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  Enviar abre WhatsApp Web · <button className="underline hover:text-white" onClick={() => { setShowEntrante(true); setShowPlantillas(false) }}>Registrar respuesta del cliente</button>
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

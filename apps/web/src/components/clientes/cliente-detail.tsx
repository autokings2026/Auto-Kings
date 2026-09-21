'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Phone, Mail, CalendarClock, History, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatDate } from '@/lib/utils'
import { EstadoCita } from '@kings/shared'

interface CitaResumen {
  id: string
  fecha: string
  hora: string
  marca: string
  modelo: string
  anio: number
  placa: string
  comentarios: string | null
  estado: EstadoCita
  ordenTrabajo: { id: string; numero: string } | null
}

interface ClienteDetalleData {
  id: string
  nombre: string
  telefono: string
  email: string | null
  porHacer: CitaResumen[]
  hechas: CitaResumen[]
}

const ESTADO_STYLE: Record<EstadoCita, string> = {
  [EstadoCita.PENDIENTE]: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  [EstadoCita.CONFIRMADA]: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  [EstadoCita.CONVERTIDA]: 'bg-green-500/15 text-green-400 border-green-500/30',
  [EstadoCita.CANCELADA]: 'bg-red-500/15 text-red-400 border-red-500/30',
  [EstadoCita.NO_ASISTIO]: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

const ESTADO_LABEL: Record<EstadoCita, string> = {
  [EstadoCita.PENDIENTE]: 'Pendiente',
  [EstadoCita.CONFIRMADA]: 'Confirmada',
  [EstadoCita.CONVERTIDA]: 'Convertida a OT',
  [EstadoCita.CANCELADA]: 'Cancelada',
  [EstadoCita.NO_ASISTIO]: 'No asistió',
}

export function ClienteDetail({ clienteId }: { clienteId: string }) {
  const router = useRouter()
  const [data, setData] = useState<ClienteDetalleData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCliente = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clientes/directorio/${clienteId}`)
      if (!res.ok) { router.push('/clientes'); return }
      setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [clienteId, router])

  useEffect(() => { fetchCliente() }, [fetchCliente])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    )
  }

  if (!data) return null

  const waLink = `https://wa.me/${data.telefono.replace(/\D/g, '')}`

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/clientes')} className="mb-3 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Clientes
        </Button>

        <h1 className="text-2xl font-bold text-white">{data.nombre}</h1>
        <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-green-400">
            <Phone className="h-3.5 w-3.5" /> {data.telefono}
          </a>
          {data.email && (
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> {data.email}
            </span>
          )}
        </div>
      </div>

      <CitasSection
        titulo="Reservas por hacer"
        icon={CalendarClock}
        citas={data.porHacer}
        vacio="No tiene reservas pendientes."
      />

      <CitasSection
        titulo="Historial de reservas"
        icon={History}
        citas={data.hechas}
        vacio="Todavía no tiene reservas pasadas."
      />
    </div>
  )
}

function CitasSection({
  titulo, icon: Icon, citas, vacio,
}: {
  titulo: string
  icon: React.ElementType
  citas: CitaResumen[]
  vacio: string
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-accent flex items-center gap-2">
        <Icon className="h-4 w-4" /> {titulo} ({citas.length})
      </h2>
      {citas.length === 0 ? (
        <p className="text-sm text-muted-foreground rounded-xl border border-surface-2 bg-surface px-4 py-6 text-center">
          {vacio}
        </p>
      ) : (
        <div className="space-y-2">
          {citas.map((c) => (
            <div key={c.id} className="rounded-xl border border-surface-2 bg-surface px-4 py-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-medium text-white">
                  {formatDate(`${c.fecha}T12:00:00`)} · {c.hora}
                </span>
                <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', ESTADO_STYLE[c.estado])}>
                  {ESTADO_LABEL[c.estado]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {c.marca} {c.modelo} {c.anio} · {c.placa}
              </p>
              {c.comentarios && (
                <p className="text-xs text-muted-foreground mt-1.5 italic">&quot;{c.comentarios}&quot;</p>
              )}
              {c.ordenTrabajo && (
                <Link
                  href={`/ordenes/${c.ordenTrabajo.id}`}
                  className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-1.5"
                >
                  Ver {c.ordenTrabajo.numero} <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

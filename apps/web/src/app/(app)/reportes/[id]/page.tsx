'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Loader2, ArrowLeft, FileDown, CheckCircle, XCircle,
  Camera, Wrench, ShieldCheck, Package, Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate, formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Reporte {
  id: string
  numero: string
  placa: string
  anio: number
  color: string
  combustible: string
  kilometraje: number
  fechaIngreso: string
  vehiculo: string
  marca: string
  modelo: string
  tecnico: string
  cliente: { nombre: string; telefono: string; email: string | null }
  fotos: { id: string; url: string; createdAt: string }[]
  diagnostico: {
    sintomaCliente: string
    diagnosticoTecnico: string
    items: { descripcion: string; tipo: string; cantidad: number; precioUnitario: number; subtotal: number }[]
    totalMateriales: number
    totalManoObra: number
    totalGeneral: number
  } | null
  reparacion: { tecnico: string; notas: string | null; iniciadaEn: string | null; finalizadaEn: string | null } | null
  controlesCC: { aprobado: boolean; observaciones: string | null; revisadoPor: string; revisadoEn: string }[]
  entrega: { entregadoEn: string | null; registradoPor: string } | null
  encuesta: { calidad: number | null; tiempo: number | null; atencion: number | null; comentario: string | null; respondidoEn: string | null } | null
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-surface-2 mb-4">
      <div className="text-accent">{icon}</div>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
    </div>
  )
}

function StarRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(n => (
          <Star key={n} className={cn('h-4 w-4', value && n <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-700')} />
        ))}
        <span className="ml-1 text-xs text-muted-foreground">{value ?? '—'}/5</span>
      </span>
    </div>
  )
}

export default function ReporteDetallePage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [reporte, setReporte] = useState<Reporte | null>(null)
  const [loading, setLoading] = useState(true)
  const [fotoSeleccionada, setFotoSeleccionada] = useState<string | null>(null)
  const [descargando, setDescargando] = useState(false)

  const descargarPdf = useCallback(async () => {
    if (!session?.user || !reporte) return
    setDescargando(true)
    try {
      const res = await fetch(`${API}/reportes/ordenes/${reporte.id}/pdf`, {
        headers: { Authorization: `Bearer ${session.user.accessToken}` },
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte-${reporte.numero}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally { setDescargando(false) }
  }, [session, reporte])

  useEffect(() => {
    if (!session?.user) return
    fetch(`${API}/reportes/ordenes/${params.id}`, {
      headers: { Authorization: `Bearer ${session.user.accessToken}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setReporte)
      .catch(() => router.push('/reportes'))
      .finally(() => setLoading(false))
  }, [session, params.id, router])

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-secondary" />
    </div>
  )
  if (!reporte) return null

  const enc = reporte.encuesta
  const promedioEnc = enc?.calidad && enc?.tiempo && enc?.atencion
    ? ((enc.calidad + enc.tiempo + enc.atencion) / 3).toFixed(1)
    : null

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/reportes')} className="-ml-2 mb-3">
          <ArrowLeft className="h-4 w-4 mr-1" /> Reportes
        </Button>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold font-mono text-white">{reporte.numero}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {reporte.vehiculo} · <span className="text-white font-medium">{reporte.placa}</span>
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Cliente: <span className="text-white">{reporte.cliente.nombre}</span> ·
              Técnico: <span className="text-white">{reporte.tecnico}</span> ·
              Ingreso: <span className="text-white">{formatDate(reporte.fechaIngreso)}</span>
              {reporte.entrega?.entregadoEn && (
                <> · Entrega: <span className="text-white">{formatDate(reporte.entrega.entregadoEn)}</span></>
              )}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={descargarPdf}
            disabled={descargando}
            className="border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
          >
            {descargando
              ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              : <FileDown className="h-4 w-4 mr-2" />}
            {descargando ? 'Generando…' : 'Descargar PDF'}
          </Button>
        </div>
      </div>

      {/* Datos del vehículo */}
      <div className="rounded-xl border border-surface-2 bg-surface p-5">
        <SectionHeader icon={<Package className="h-4 w-4" />} title="Datos del vehículo" />
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          {[
            { l: 'Marca / Modelo', v: `${reporte.marca} ${reporte.modelo}` },
            { l: 'Año',            v: String(reporte.anio) },
            { l: 'Placa',          v: reporte.placa },
            { l: 'Color',          v: reporte.color },
            { l: 'Combustible',    v: reporte.combustible },
            { l: 'Kilometraje',    v: `${reporte.kilometraje.toLocaleString('es-HN')} km` },
          ].map(({ l, v }) => (
            <div key={l}>
              <p className="text-xs text-muted-foreground">{l}</p>
              <p className="text-white font-medium">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fotos */}
      {reporte.fotos.length > 0 && (
        <div className="rounded-xl border border-surface-2 bg-surface p-5">
          <SectionHeader icon={<Camera className="h-4 w-4" />} title={`Fotos de ingreso (${reporte.fotos.length})`} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {reporte.fotos.map(f => (
              <button
                key={f.id}
                onClick={() => setFotoSeleccionada(f.url)}
                className="aspect-square rounded-lg overflow-hidden border border-surface-2 hover:border-accent transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt="Foto de ingreso" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Diagnóstico */}
      {reporte.diagnostico && (
        <div className="rounded-xl border border-surface-2 bg-surface p-5 space-y-4">
          <SectionHeader icon={<Wrench className="h-4 w-4" />} title="Diagnóstico y trabajos" />

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Síntoma reportado</p>
              <p className="text-sm text-gray-300">{reporte.diagnostico.sintomaCliente}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Diagnóstico técnico</p>
              <p className="text-sm text-gray-300">{reporte.diagnostico.diagnosticoTecnico}</p>
            </div>
          </div>

          {/* Tabla de items */}
          <div className="rounded-lg border border-surface-2 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-2 text-xs text-muted-foreground">
                  <th className="px-3 py-2 text-left">Descripción</th>
                  <th className="px-3 py-2 text-left w-28">Tipo</th>
                  <th className="px-3 py-2 text-right w-16">Cant.</th>
                  <th className="px-3 py-2 text-right w-28">P. Unit.</th>
                  <th className="px-3 py-2 text-right w-28">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-2">
                {reporte.diagnostico.items.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? '' : 'bg-surface-2/30'}>
                    <td className="px-3 py-2 text-white">{item.descripcion}</td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">
                      {item.tipo === 'MATERIAL' ? 'Material' : 'Mano de obra'}
                    </td>
                    <td className="px-3 py-2 text-right text-white">{item.cantidad}</td>
                    <td className="px-3 py-2 text-right text-white">{formatCurrency(item.precioUnitario)}</td>
                    <td className="px-3 py-2 text-right text-white font-medium">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-surface-2">
                <tr>
                  <td colSpan={4} className="px-3 py-1.5 text-right text-xs text-muted-foreground">Materiales</td>
                  <td className="px-3 py-1.5 text-right text-sm text-white">{formatCurrency(reporte.diagnostico.totalMateriales)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="px-3 py-1.5 text-right text-xs text-muted-foreground">Mano de obra</td>
                  <td className="px-3 py-1.5 text-right text-sm text-white">{formatCurrency(reporte.diagnostico.totalManoObra)}</td>
                </tr>
                <tr className="bg-surface-2">
                  <td colSpan={4} className="px-3 py-2 text-right text-sm font-bold text-white">Total general</td>
                  <td className="px-3 py-2 text-right text-base font-bold text-accent">{formatCurrency(reporte.diagnostico.totalGeneral)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Reparación */}
      {reporte.reparacion && (
        <div className="rounded-xl border border-surface-2 bg-surface p-5">
          <SectionHeader icon={<Wrench className="h-4 w-4" />} title="Reparación" />
          <div className="grid sm:grid-cols-2 gap-3 text-sm mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Técnico</p>
              <p className="text-white">{reporte.reparacion.tecnico}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Período</p>
              <p className="text-white">
                {formatDate(reporte.reparacion.iniciadaEn)} → {formatDate(reporte.reparacion.finalizadaEn)}
              </p>
            </div>
          </div>
          {reporte.reparacion.notas && (
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 px-4 py-3">
              <p className="text-xs text-amber-400 font-medium mb-1">Notas del técnico</p>
              <p className="text-sm text-gray-300">{reporte.reparacion.notas}</p>
            </div>
          )}
        </div>
      )}

      {/* Control de Calidad */}
      {reporte.controlesCC.length > 0 && (
        <div className="rounded-xl border border-surface-2 bg-surface p-5">
          <SectionHeader icon={<ShieldCheck className="h-4 w-4" />} title="Control de calidad" />
          <div className="space-y-2">
            {reporte.controlesCC.map((cc, i) => (
              <div key={i} className={cn('rounded-lg p-3 border flex items-start gap-3', cc.aprobado ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5')}>
                {cc.aprobado
                  ? <CheckCircle className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                  : <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
                <div>
                  <p className={cn('text-sm font-medium', cc.aprobado ? 'text-green-300' : 'text-red-300')}>
                    {cc.aprobado ? 'Aprobado' : 'Rechazado'} · {cc.revisadoPor} · {formatDate(cc.revisadoEn)}
                  </p>
                  {cc.observaciones && <p className="text-xs text-muted-foreground mt-0.5">{cc.observaciones}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Encuesta */}
      {enc?.respondidoEn && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <SectionHeader icon={<Star className="h-4 w-4" />} title="Encuesta de satisfacción" />
          <div className="space-y-3">
            <StarRow label="Calidad del trabajo" value={enc.calidad} />
            <StarRow label="Tiempo de entrega"   value={enc.tiempo} />
            <StarRow label="Atención al cliente" value={enc.atencion} />
            {promedioEnc && (
              <div className="flex justify-between items-center pt-2 border-t border-amber-500/20">
                <span className="text-sm font-semibold text-white">Promedio general</span>
                <span className="text-amber-400 font-bold text-lg">★ {promedioEnc} / 5</span>
              </div>
            )}
            {enc.comentario && (
              <blockquote className="border-l-2 border-amber-500/40 pl-3 text-sm text-gray-300 italic">
                "{enc.comentario}"
              </blockquote>
            )}
            <p className="text-xs text-muted-foreground">Respondida el {formatDate(enc.respondidoEn)}</p>
          </div>
        </div>
      )}

      {/* Lightbox fotos */}
      {fotoSeleccionada && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setFotoSeleccionada(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotoSeleccionada}
            alt="Foto ampliada"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, Package, CheckCircle, Copy, Check, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { FaseOT } from '@kings/shared'
import type { OrdenDetalle } from './ot-detail'

const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''

export function FaseEntrega({ orden, onUpdate }: { orden: OrdenDetalle; onUpdate: () => void }) {
  const { data: session } = useSession()
  const isActive = orden.faseActual === FaseOT.ENTREGA
  const entrega = orden.entrega
  const yaEntregado = !!entrega?.entregadoEn

  const [registering, setRegistering] = useState(false)
  const [copied, setCopied] = useState(false)

  const encuestaLink = orden.encuesta
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/encuesta/${orden.encuesta.token}`
    : null

  const copyEncuesta = () => {
    if (!encuestaLink) return
    navigator.clipboard.writeText(encuestaLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const registrarEntrega = async () => {
    setRegistering(true)
    try {
      await fetch(`/api/ordenes/${orden.id}/entrega`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify({}),
      })
      onUpdate()
    } finally { setRegistering(false) }
  }

  const waText = encodeURIComponent(
    `Hola ${orden.cliente.nombre}, su vehículo ${orden.marca.nombre} ${orden.modelo.nombre} (${orden.placa}) ya está listo para ser retirado en nuestro taller. ¡Lo esperamos! 🚗 — Kings Auto Diagnósticos`,
  )
  const waLink = `https://wa.me/${orden.cliente.telefono.replace(/\D/g, '')}?text=${waText}`

  return (
    <Card className="bg-surface border-surface-2">
      <CardContent className="pt-5 pb-5 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-accent">
            Fase 5 · Entrega
          </h2>
          {yaEntregado && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <CheckCircle className="h-3.5 w-3.5" /> Entregado
            </span>
          )}
        </div>

        {/* Info cliente */}
        <div className="rounded-lg bg-surface-2 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cliente</span>
            <span className="text-white font-medium">{orden.cliente.nombre}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Teléfono</span>
            <span className="text-white">{orden.cliente.telefono}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vehículo</span>
            <span className="text-white">
              {orden.marca.nombre} {orden.modelo.nombre} {orden.anio} · {orden.placa}
            </span>
          </div>
          {entrega?.entregadoEn && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Entregado</span>
              <span className="text-white">{formatDate(entrega.entregadoEn)}</span>
            </div>
          )}
        </div>

        {isActive && !yaEntregado && (
          <div className="space-y-3 pt-2 border-t border-surface-2">
            {/* Notificar por WhatsApp */}
            <a href={waLink} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full border-green-600/50 text-green-400 hover:bg-green-600/10">
                <Package className="h-4 w-4 mr-2" />
                Notificar al cliente por WhatsApp
              </Button>
            </a>

            {/* Registrar entrega */}
            <Button
              variant="primary"
              onClick={registrarEntrega}
              disabled={registering}
              className="w-full"
            >
              {registering ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registrando…</>
              ) : (
                'Registrar entrega → Completar OT'
              )}
            </Button>
          </div>
        )}

        {/* Link encuesta — visible cuando ya fue entregado */}
        {yaEntregado && encuestaLink && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
              <Star className="h-4 w-4" /> Encuesta de satisfacción
            </div>
            <p className="text-xs text-gray-400">
              Comparte este link con el cliente para que califique el servicio.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyEncuesta} className="flex-1 border-gray-700 text-gray-300">
                {copied ? <Check className="h-4 w-4 mr-2 text-green-400" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copiado' : 'Copiar link encuesta'}
              </Button>
              <a
                href={`https://wa.me/${orden.cliente.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${orden.cliente.nombre}, nos gustaría conocer su opinión sobre el servicio de su ${orden.marca.nombre} ${orden.modelo.nombre}. Por favor complete nuestra encuesta de satisfacción: ${encuestaLink}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="border-green-600/50 text-green-400 hover:bg-green-600/10">
                  <Package className="h-4 w-4 mr-2" /> WhatsApp
                </Button>
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

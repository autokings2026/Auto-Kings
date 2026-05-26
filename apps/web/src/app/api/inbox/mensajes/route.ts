import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { TipoMensajeWA, TipoPlantillaWA } from '@kings/shared'

const EnviarSchema = z.object({
  clienteId:      z.string(),
  texto:          z.string().min(1),
  plantillaUsada: z.nativeEnum(TipoPlantillaWA).optional(),
  ordenId:        z.string().optional(),
})

const EntranteSchema = z.object({
  clienteId: z.string(),
  texto:     z.string().min(1),
})

export async function POST(req: NextRequest) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const url = req.nextUrl
  const esEntrante = url.searchParams.get('tipo') === 'entrante'

  const body = await req.json()

  if (esEntrante) {
    const parsed = EntranteSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ message: 'Datos inválidos' }, { status: 400 })
    }
    const { clienteId, texto } = parsed.data

    const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } })
    if (!cliente) return Response.json({ message: 'Cliente no encontrado' }, { status: 404 })

    const mensaje = await prisma.mensajeWhatsApp.create({
      data: {
        clienteId,
        texto,
        tipo:         TipoMensajeWA.ENTRANTE,
        enviadoPorId: user.id,
        leido:        false,
      },
    })
    return Response.json(mensaje, { status: 201 })
  }

  const parsed = EnviarSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos' }, { status: 400 })
  }
  const { clienteId, texto, plantillaUsada, ordenId } = parsed.data

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } })
  if (!cliente) return Response.json({ message: 'Cliente no encontrado' }, { status: 404 })

  const mensaje = await prisma.mensajeWhatsApp.create({
    data: {
      clienteId,
      texto,
      tipo:           TipoMensajeWA.SALIENTE,
      plantillaUsada: plantillaUsada ?? null,
      ordenId:        ordenId ?? null,
      enviadoPorId:   user.id,
      leido:          true,
    },
  })

  const waNumber = cliente.telefono.replace(/\D/g, '')
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(texto)}`

  return Response.json({ mensaje, waLink }, { status: 201 })
}

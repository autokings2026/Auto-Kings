import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const SubmitSchema = z.object({
  calidad:    z.number().int().min(1).max(5),
  tiempo:     z.number().int().min(1).max(5),
  atencion:   z.number().int().min(1).max(5),
  comentario: z.string().optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  const encuesta = await prisma.encuestaSatisfaccion.findUnique({
    where: { token },
    include: {
      orden: {
        select: {
          numero:  true,
          placa:   true,
          anio:    true,
          cliente: { select: { nombre: true } },
          marca:   { select: { nombre: true } },
          modelo:  { select: { nombre: true } },
          tecnico: { select: { nombre: true } },
        },
      },
    },
  })

  if (!encuesta) {
    return Response.json({ message: 'Encuesta no encontrada' }, { status: 404 })
  }

  const o = encuesta.orden
  return Response.json({
    token,
    numero:        o.numero,
    clienteNombre: o.cliente.nombre,
    vehiculo:      `${o.marca.nombre} ${o.modelo.nombre} ${o.anio}`,
    placa:         o.placa,
    tecnico:       o.tecnico.nombre,
    respondido:    encuesta.respondidoEn !== null,
    calidad:       encuesta.calidad,
    tiempo:        encuesta.tiempo,
    atencion:      encuesta.atencion,
    comentario:    encuesta.comentario,
    respondidoEn:  encuesta.respondidoEn?.toISOString() ?? null,
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  const encuesta = await prisma.encuestaSatisfaccion.findUnique({ where: { token } })
  if (!encuesta) {
    return Response.json({ message: 'Encuesta no encontrada' }, { status: 404 })
  }
  if (encuesta.respondidoEn !== null) {
    return Response.json({ message: 'Esta encuesta ya fue respondida' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = SubmitSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos', errors: parsed.error.flatten() }, { status: 400 })
  }

  await prisma.encuestaSatisfaccion.update({
    where: { token },
    data: {
      calidad:      parsed.data.calidad,
      tiempo:       parsed.data.tiempo,
      atencion:     parsed.data.atencion,
      comentario:   parsed.data.comentario ?? null,
      respondidoEn: new Date(),
    },
  })

  return Response.json({ ok: true })
}

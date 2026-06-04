import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'

const Schema = z.object({
  url:      z.string().url(),
  publicId: z.string(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const { id } = await params
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos' }, { status: 400 })
  }

  const foto = await prisma.fotoReparacion.create({
    data: {
      ordenId:     id,
      url:         parsed.data.url,
      publicId:    parsed.data.publicId,
      creadoPorId: user.id,
    },
  })

  return Response.json(foto, { status: 201 })
}

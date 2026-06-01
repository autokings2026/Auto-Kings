import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { EstadoCita } from '@kings/shared'

const Schema = z.object({ estado: z.nativeEnum(EstadoCita) })

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const { id } = await params
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Estado inválido' }, { status: 400 })
  }

  const cita = await prisma.cita.update({ where: { id }, data: { estado: parsed.data.estado } })
  return Response.json(cita)
}

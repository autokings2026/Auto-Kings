import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole, forbidden } from '@/lib/auth-helpers'
import { RolUsuario } from '@kings/shared'

const UpdateSchema = z.object({
  estado: z.enum(['APROBADA', 'RECHAZADA', 'PENDIENTE']),
})

// PATCH — aprobar o rechazar reseña
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) return forbidden()

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Estado inválido' }, { status: 400 })
  }

  const resena = await prisma.resena.update({
    where: { id: params.id },
    data: { estado: parsed.data.estado },
  })
  return Response.json(resena)
}

// DELETE
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) return forbidden()

  await prisma.resena.delete({ where: { id: params.id } })
  return new Response(null, { status: 204 })
}

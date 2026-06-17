import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole, forbidden } from '@/lib/auth-helpers'
import { RolUsuario } from '@kings/shared'

const UpdateSchema = z.object({
  descripcion: z.string().max(200).optional(),
  categoria: z.enum(['FRENOS', 'MOTOR', 'DIAGNOSTICO', 'ELECTRICO', 'MANTENIMIENTO', 'OTRO']).optional(),
  activo: z.boolean().optional(),
  orden: z.number().int().min(0).optional(),
})

// PATCH — actualizar foto
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) return forbidden()

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos' }, { status: 400 })
  }

  const item = await prisma.galeriaTrabajo.update({
    where: { id: params.id },
    data: parsed.data,
  })
  return Response.json(item)
}

// DELETE — eliminar foto
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) return forbidden()

  await prisma.galeriaTrabajo.delete({ where: { id: params.id } })
  return new Response(null, { status: 204 })
}

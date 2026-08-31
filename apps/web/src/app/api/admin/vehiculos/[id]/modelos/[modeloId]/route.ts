import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, requireRole, unauthorized, forbidden } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { RolUsuario } from '@kings/shared'

const UpdateModeloSchema = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre es requerido').optional(),
    activo: z.boolean().optional(),
  })
  .refine((d) => d.nombre !== undefined || d.activo !== undefined, {
    message: 'Nada que actualizar',
  })

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; modeloId: string }> },
) {
  const admin = await requireRole(RolUsuario.ADMIN)
  if (!admin) {
    const auth = await requireAuth()
    if (!auth) return unauthorized()
    return forbidden()
  }

  const { id, modeloId } = await params
  const body = await req.json()
  const parsed = UpdateModeloSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos', errors: parsed.error.flatten() }, { status: 400 })
  }

  const modelo = await prisma.modelo.findUnique({ where: { id: modeloId } })
  if (!modelo || modelo.marcaId !== id) {
    return Response.json({ message: 'Modelo no encontrado' }, { status: 404 })
  }

  const data: { nombre?: string; activo?: boolean } = {}

  if (parsed.data.nombre !== undefined) {
    const conflicto = await prisma.modelo.findFirst({
      where: { marcaId: id, nombre: { equals: parsed.data.nombre, mode: 'insensitive' }, NOT: { id: modeloId } },
    })
    if (conflicto) {
      return Response.json({ message: 'Ya existe un modelo con ese nombre para esta marca' }, { status: 409 })
    }
    data.nombre = parsed.data.nombre
  }

  if (parsed.data.activo !== undefined) data.activo = parsed.data.activo

  const updated = await prisma.modelo.update({ where: { id: modeloId }, data })

  return Response.json(updated)
}

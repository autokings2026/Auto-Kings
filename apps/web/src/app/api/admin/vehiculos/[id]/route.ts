import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, requireRole, unauthorized, forbidden } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { RolUsuario } from '@kings/shared'

const UpdateMarcaSchema = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre es requerido').optional(),
    activa: z.boolean().optional(),
  })
  .refine((d) => d.nombre !== undefined || d.activa !== undefined, {
    message: 'Nada que actualizar',
  })

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireRole(RolUsuario.ADMIN)
  if (!admin) {
    const auth = await requireAuth()
    if (!auth) return unauthorized()
    return forbidden()
  }

  const { id } = await params
  const body = await req.json()
  const parsed = UpdateMarcaSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos', errors: parsed.error.flatten() }, { status: 400 })
  }

  const marca = await prisma.marca.findUnique({ where: { id } })
  if (!marca) return Response.json({ message: 'Marca no encontrada' }, { status: 404 })

  const data: { nombre?: string; activa?: boolean } = {}

  if (parsed.data.nombre !== undefined) {
    const conflicto = await prisma.marca.findFirst({
      where: { nombre: { equals: parsed.data.nombre, mode: 'insensitive' }, NOT: { id } },
    })
    if (conflicto) {
      return Response.json({ message: 'Ya existe una marca con ese nombre' }, { status: 409 })
    }
    data.nombre = parsed.data.nombre
  }

  if (parsed.data.activa !== undefined) data.activa = parsed.data.activa

  const updated = await prisma.marca.update({
    where: { id },
    data,
    include: { modelos: { orderBy: { nombre: 'asc' } } },
  })

  return Response.json(updated)
}

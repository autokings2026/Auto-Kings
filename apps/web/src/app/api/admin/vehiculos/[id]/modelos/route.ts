import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, requireRole, unauthorized, forbidden } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { RolUsuario } from '@kings/shared'

const CreateModeloSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
})

export async function POST(
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
  const parsed = CreateModeloSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos', errors: parsed.error.flatten() }, { status: 400 })
  }

  const marca = await prisma.marca.findUnique({ where: { id } })
  if (!marca) return Response.json({ message: 'Marca no encontrada' }, { status: 404 })

  const { nombre } = parsed.data

  const existente = await prisma.modelo.findFirst({
    where: { marcaId: id, nombre: { equals: nombre, mode: 'insensitive' } },
  })
  if (existente) {
    return Response.json({ message: 'Ya existe un modelo con ese nombre para esta marca' }, { status: 409 })
  }

  const modelo = await prisma.modelo.create({
    data: { marcaId: id, nombre },
  })

  return Response.json(modelo, { status: 201 })
}

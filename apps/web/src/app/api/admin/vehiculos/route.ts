import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, requireRole, unauthorized, forbidden } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { RolUsuario } from '@kings/shared'

export async function GET() {
  const admin = await requireRole(RolUsuario.ADMIN)
  if (!admin) {
    const auth = await requireAuth()
    if (!auth) return unauthorized()
    return forbidden()
  }

  const marcas = await prisma.marca.findMany({
    include: { modelos: { orderBy: { nombre: 'asc' } } },
    orderBy: { nombre: 'asc' },
  })

  return Response.json(marcas)
}

const CreateMarcaSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
})

export async function POST(req: NextRequest) {
  const admin = await requireRole(RolUsuario.ADMIN)
  if (!admin) {
    const auth = await requireAuth()
    if (!auth) return unauthorized()
    return forbidden()
  }

  const body = await req.json()
  const parsed = CreateMarcaSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos', errors: parsed.error.flatten() }, { status: 400 })
  }

  const { nombre } = parsed.data

  const existente = await prisma.marca.findFirst({
    where: { nombre: { equals: nombre, mode: 'insensitive' } },
  })
  if (existente) {
    return Response.json({ message: 'Ya existe una marca con ese nombre' }, { status: 409 })
  }

  const marca = await prisma.marca.create({
    data: { nombre },
    include: { modelos: true },
  })

  return Response.json(marca, { status: 201 })
}

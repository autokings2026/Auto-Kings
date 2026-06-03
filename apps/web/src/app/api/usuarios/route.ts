import { NextRequest } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { requireRole, unauthorized } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { RolUsuario } from '@kings/shared'

const USER_SELECT = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  activo: true,
  telefono: true,
  fechaIngreso: true,
  contactoEmergenciaNombre: true,
  contactoEmergenciaTelefono: true,
  createdAt: true,
} as const

export async function GET() {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) return unauthorized()

  const usuarios = await prisma.user.findMany({
    select: USER_SELECT,
    orderBy: { nombre: 'asc' },
  })

  return Response.json(usuarios)
}

const CreateSchema = z.object({
  nombre:                     z.string().min(2),
  email:                      z.string().email(),
  password:                   z.string().min(8),
  rol:                        z.enum([RolUsuario.EMPLEADO, RolUsuario.CONTROL_CALIDAD]),
  telefono:                   z.string().optional(),
  fechaIngreso:               z.string().optional(),
  contactoEmergenciaNombre:   z.string().optional(),
  contactoEmergenciaTelefono: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const admin = await requireRole(RolUsuario.ADMIN)
  if (!admin) return unauthorized()

  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos', errors: parsed.error.flatten() }, { status: 400 })
  }

  const { password, fechaIngreso, ...rest } = parsed.data

  const exists = await prisma.user.findUnique({ where: { email: rest.email } })
  if (exists) {
    return Response.json({ message: 'Ya existe un usuario con ese correo' }, { status: 409 })
  }

  const hash = await bcrypt.hash(password, 12)

  const nuevo = await prisma.user.create({
    data: {
      ...rest,
      password: hash,
      fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : null,
    },
    select: USER_SELECT,
  })

  return Response.json(nuevo, { status: 201 })
}

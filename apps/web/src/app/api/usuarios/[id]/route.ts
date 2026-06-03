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

const UpdateSchema = z.object({
  nombre:                     z.string().min(2).optional(),
  email:                      z.string().email().optional(),
  password:                   z.string().min(8).optional(),
  rol:                        z.enum([RolUsuario.EMPLEADO, RolUsuario.CONTROL_CALIDAD]).optional(),
  telefono:                   z.string().optional().nullable(),
  fechaIngreso:               z.string().optional().nullable(),
  contactoEmergenciaNombre:   z.string().optional().nullable(),
  contactoEmergenciaTelefono: z.string().optional().nullable(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireRole(RolUsuario.ADMIN)
  if (!admin) return unauthorized()

  const { id } = await params
  const usuario = await prisma.user.findUnique({ where: { id }, select: USER_SELECT })
  if (!usuario) return Response.json({ message: 'Usuario no encontrado' }, { status: 404 })

  return Response.json(usuario)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireRole(RolUsuario.ADMIN)
  if (!admin) return unauthorized()

  const { id } = await params
  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos', errors: parsed.error.flatten() }, { status: 400 })
  }

  const { password, fechaIngreso, ...rest } = parsed.data

  const data: Record<string, unknown> = { ...rest }
  if (password) data['password'] = await bcrypt.hash(password, 12)
  if (fechaIngreso !== undefined) data['fechaIngreso'] = fechaIngreso ? new Date(fechaIngreso) : null

  if (rest.email) {
    const conflict = await prisma.user.findFirst({ where: { email: rest.email, NOT: { id } } })
    if (conflict) return Response.json({ message: 'Ya existe un usuario con ese correo' }, { status: 409 })
  }

  const updated = await prisma.user.update({ where: { id }, data, select: USER_SELECT })
  return Response.json(updated)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireRole(RolUsuario.ADMIN)
  if (!admin) return unauthorized()

  const { id } = await params
  const { activo } = await req.json() as { activo: boolean }

  const me = admin
  if (me.id === id) {
    return Response.json({ message: 'No puedes desactivar tu propio usuario' }, { status: 400 })
  }

  const updated = await prisma.user.update({ where: { id }, data: { activo }, select: USER_SELECT })
  return Response.json(updated)
}

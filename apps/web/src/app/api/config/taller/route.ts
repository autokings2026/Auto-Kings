import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole, unauthorized, forbidden } from '@/lib/auth-helpers'
import { RolUsuario } from '@kings/shared'

const UpdateConfigSchema = z.object({
  nombre:                z.string().optional(),
  telefono:              z.string().optional(),
  email:                 z.string().email().optional(),
  direccion:             z.string().optional(),
  logoUrl:               z.string().optional(),
  horariosAtencion:      z.array(z.any()).optional(),
  duracionSlotMinutos:   z.number().min(15).optional(),
  maxCitasPorSlot:       z.number().min(1).optional(),
  alertaAmarillaMinutos: z.number().min(1).optional(),
  alertaRojaMinutos:     z.number().min(1).optional(),
  comisionTecnicoPct:    z.number().min(0).max(100).optional(),
})

export async function GET() {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const config = await prisma.configuracionTaller.findFirst()
  if (config) return Response.json(config)

  const nueva = await prisma.configuracionTaller.create({ data: {} })
  return Response.json(nueva)
}

export async function PATCH(req: NextRequest) {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) return forbidden()

  const body = await req.json()
  const parsed = UpdateConfigSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos', errors: parsed.error.flatten() }, { status: 400 })
  }

  const config = await prisma.configuracionTaller.findFirst()
  if (config) {
    const updated = await prisma.configuracionTaller.update({
      where: { id: config.id },
      data: parsed.data as Prisma.ConfiguracionTallerUpdateInput,
    })
    return Response.json(updated)
  }

  const nueva = await prisma.configuracionTaller.create({
    data: parsed.data as Prisma.ConfiguracionTallerCreateInput,
  })
  return Response.json(nueva)
}

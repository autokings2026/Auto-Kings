import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { TipoPlantillaWA } from '@kings/shared'

const UpsertSchema = z.object({
  nombre:   z.string().min(1),
  contenido: z.string().min(1),
  activa:   z.boolean(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tipo: string }> },
) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const { tipo } = await params
  const body = await req.json()
  const parsed = UpsertSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos' }, { status: 400 })
  }

  const plantilla = await prisma.plantillaMensaje.upsert({
    where: { tipo: tipo as TipoPlantillaWA },
    update:  { contenido: parsed.data.contenido, activa: parsed.data.activa, nombre: parsed.data.nombre },
    create:  { tipo: tipo as TipoPlantillaWA, nombre: parsed.data.nombre, contenido: parsed.data.contenido, activa: parsed.data.activa },
  })

  return Response.json(plantilla)
}

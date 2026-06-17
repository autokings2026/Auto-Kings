import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole, forbidden } from '@/lib/auth-helpers'
import { RolUsuario } from '@kings/shared'

const CrearGaleriaSchema = z.object({
  url: z.string().url(),
  publicId: z.string(),
  descripcion: z.string().max(200).optional(),
  categoria: z.enum(['FRENOS', 'MOTOR', 'DIAGNOSTICO', 'ELECTRICO', 'MANTENIMIENTO', 'OTRO']).optional(),
})

// GET — listar todas (admin)
export async function GET() {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) return forbidden()

  const items = await prisma.galeriaTrabajo.findMany({
    orderBy: [{ orden: 'asc' }, { createdAt: 'desc' }],
  })
  return Response.json(items)
}

// POST — agregar foto
export async function POST(req: NextRequest) {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) return forbidden()

  const body = await req.json()
  const parsed = CrearGaleriaSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos', errors: parsed.error.flatten() }, { status: 400 })
  }

  // Calcular siguiente orden
  const ultimo = await prisma.galeriaTrabajo.findFirst({ orderBy: { orden: 'desc' }, select: { orden: true } })
  const item = await prisma.galeriaTrabajo.create({
    data: { ...parsed.data, orden: (ultimo?.orden ?? 0) + 1 },
  })

  return Response.json(item, { status: 201 })
}

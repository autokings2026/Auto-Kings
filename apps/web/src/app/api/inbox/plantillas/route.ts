import { prisma } from '@/lib/prisma'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'

export async function GET() {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const plantillas = await prisma.plantillaMensaje.findMany({
    orderBy: { tipo: 'asc' },
  })

  return Response.json(plantillas)
}

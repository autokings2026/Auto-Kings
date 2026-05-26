import { prisma } from '@/lib/prisma'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'

export async function GET() {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const marcas = await prisma.marca.findMany({
    where: { activa: true },
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true },
  })

  return Response.json(marcas)
}

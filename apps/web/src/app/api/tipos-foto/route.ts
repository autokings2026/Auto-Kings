import { prisma } from '@/lib/prisma'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'

export async function GET() {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const tipos = await prisma.tipoFoto.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
    select: { id: true, nombre: true },
  })

  return Response.json(tipos)
}

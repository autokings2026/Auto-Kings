import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const usuarios = await prisma.user.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, email: true, rol: true },
    orderBy: { nombre: 'asc' },
  })

  return Response.json(usuarios)
}

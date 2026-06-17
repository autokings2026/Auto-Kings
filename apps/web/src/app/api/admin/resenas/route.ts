import { prisma } from '@/lib/prisma'
import { requireRole, forbidden } from '@/lib/auth-helpers'
import { RolUsuario } from '@kings/shared'

// GET — todas las reseñas para el admin
export async function GET() {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) return forbidden()

  const resenas = await prisma.resena.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return Response.json(resenas)
}

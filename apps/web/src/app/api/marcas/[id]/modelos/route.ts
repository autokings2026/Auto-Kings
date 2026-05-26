import { prisma } from '@/lib/prisma'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const { id } = await params

  const modelos = await prisma.modelo.findMany({
    where: { marcaId: id, activo: true },
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true },
  })

  return Response.json(modelos)
}

import { prisma } from '@/lib/prisma'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const { id } = await params

  try {
    const cliente = await prisma.cliente.findUniqueOrThrow({ where: { id } })
    return Response.json(cliente)
  } catch {
    return Response.json({ message: 'Cliente no encontrado' }, { status: 404 })
  }
}

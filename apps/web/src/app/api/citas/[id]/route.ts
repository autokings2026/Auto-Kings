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
    const cita = await prisma.cita.findUniqueOrThrow({
      where: { id },
      include: { cliente: true, marca: true, modelo: true },
    })
    return Response.json(cita)
  } catch {
    return Response.json({ message: 'Cita no encontrada' }, { status: 404 })
  }
}

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const modelos = await prisma.modelo.findMany({
    where: { marcaId: id, activo: true },
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true },
  })

  return Response.json(modelos)
}

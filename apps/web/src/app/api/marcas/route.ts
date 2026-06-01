import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const marcas = await prisma.marca.findMany({
    where: { activa: true },
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true },
  })

  return Response.json(marcas)
}

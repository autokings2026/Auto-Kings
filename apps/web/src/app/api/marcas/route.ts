import { prisma } from '@/lib/prisma'

export async function GET() {
  const marcas = await prisma.marca.findMany({
    where: { activa: true },
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true },
  })

  return Response.json(marcas)
}

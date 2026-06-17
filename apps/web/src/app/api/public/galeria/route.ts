import { prisma } from '@/lib/prisma'

// GET /api/public/galeria?limit=12&categoria=MOTOR
export async function GET(req: Request) {
  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '12'), 50)
  const categoria = url.searchParams.get('categoria')

  const items = await prisma.galeriaTrabajo.findMany({
    where: {
      activo: true,
      ...(categoria ? { categoria } : {}),
    },
    orderBy: [{ orden: 'asc' }, { createdAt: 'desc' }],
    take: limit,
    select: { id: true, url: true, descripcion: true, categoria: true, createdAt: true },
  })

  return Response.json(items)
}

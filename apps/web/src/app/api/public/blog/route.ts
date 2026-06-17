import { prisma } from '@/lib/prisma'

// GET /api/public/blog?limit=10&categoria=MANTENIMIENTO
export async function GET(req: Request) {
  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '10'), 50)
  const categoria = url.searchParams.get('categoria')

  const posts = await prisma.blogPost.findMany({
    where: {
      estado: 'PUBLICADO',
      ...(categoria ? { categoria } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      titulo: true,
      slug: true,
      extracto: true,
      categoria: true,
      imagenUrl: true,
      createdAt: true,
    },
  })

  return Response.json(posts)
}

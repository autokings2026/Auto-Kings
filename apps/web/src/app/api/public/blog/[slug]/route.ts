import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/public/blog/[slug]
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const post = await prisma.blogPost.findFirst({
    where: { slug: params.slug, estado: 'PUBLICADO' },
  })

  if (!post) {
    return Response.json({ message: 'Artículo no encontrado' }, { status: 404 })
  }

  return Response.json(post)
}

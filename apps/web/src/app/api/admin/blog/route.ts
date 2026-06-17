import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole, forbidden } from '@/lib/auth-helpers'
import { RolUsuario } from '@kings/shared'

const BlogSchema = z.object({
  titulo: z.string().min(5).max(200),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/),
  extracto: z.string().min(10).max(500),
  contenido: z.string().min(50),
  categoria: z.string().max(50).optional(),
  imagenUrl: z.string().url().optional(),
  publicId: z.string().optional(),
  estado: z.enum(['BORRADOR', 'PUBLICADO']).optional(),
})

// GET — listar todos para admin
export async function GET() {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) return forbidden()

  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, titulo: true, slug: true, categoria: true, estado: true, createdAt: true, imagenUrl: true },
  })
  return Response.json(posts)
}

// POST — crear artículo
export async function POST(req: NextRequest) {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) return forbidden()

  const body = await req.json()
  const parsed = BlogSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos', errors: parsed.error.flatten() }, { status: 400 })
  }

  const post = await prisma.blogPost.create({ data: parsed.data })
  return Response.json(post, { status: 201 })
}

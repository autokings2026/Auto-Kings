import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole, forbidden } from '@/lib/auth-helpers'
import { RolUsuario } from '@kings/shared'

const UpdateSchema = z.object({
  titulo: z.string().min(5).max(200).optional(),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/).optional(),
  extracto: z.string().min(10).max(500).optional(),
  contenido: z.string().min(50).optional(),
  categoria: z.string().max(50).optional(),
  imagenUrl: z.string().url().optional().nullable(),
  publicId: z.string().optional().nullable(),
  estado: z.enum(['BORRADOR', 'PUBLICADO']).optional(),
})

// GET — detalle
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) return forbidden()

  const post = await prisma.blogPost.findUnique({ where: { id: params.id } })
  if (!post) return Response.json({ message: 'No encontrado' }, { status: 404 })
  return Response.json(post)
}

// PATCH — editar artículo
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) return forbidden()

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos' }, { status: 400 })
  }

  const post = await prisma.blogPost.update({ where: { id: params.id }, data: parsed.data })
  return Response.json(post)
}

// DELETE
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) return forbidden()

  await prisma.blogPost.delete({ where: { id: params.id } })
  return new Response(null, { status: 204 })
}

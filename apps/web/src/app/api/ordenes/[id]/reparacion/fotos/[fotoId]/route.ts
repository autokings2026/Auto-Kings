import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; fotoId: string }> },
) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const { id, fotoId } = await params

  await prisma.fotoReparacion.delete({
    where: { id: fotoId, ordenId: id },
  })

  return new Response(null, { status: 204 })
}

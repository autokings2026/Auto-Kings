import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { deleteFoto } from '@/lib/services/ordenes'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; fotoId: string }> },
) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const { id, fotoId } = await params
  try {
    const result = await deleteFoto(id, fotoId)
    return Response.json(result)
  } catch (err) {
    const e = err as Error & { status?: number }
    return Response.json({ message: e.message }, { status: e.status ?? 400 })
  }
}

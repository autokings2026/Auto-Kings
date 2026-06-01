import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { avanzarFase } from '@/lib/services/ordenes'

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const { id } = await params
  try {
    const result = await avanzarFase(id, user.id)
    return Response.json(result)
  } catch (err) {
    const e = err as Error & { status?: number }
    return Response.json({ message: e.message }, { status: e.status ?? 400 })
  }
}

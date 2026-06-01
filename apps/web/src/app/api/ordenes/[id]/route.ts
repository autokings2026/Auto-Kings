import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { findOneOrden } from '@/lib/services/ordenes'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const { id } = await params
  try {
    const orden = await findOneOrden(id)
    return Response.json(orden)
  } catch (err) {
    const e = err as Error & { status?: number }
    return Response.json({ message: e.message }, { status: e.status ?? 500 })
  }
}

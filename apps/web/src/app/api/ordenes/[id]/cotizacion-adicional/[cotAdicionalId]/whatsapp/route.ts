import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { getWhatsappCotizacionAdicional } from '@/lib/services/ordenes'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; cotAdicionalId: string }> },
) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const { id, cotAdicionalId } = await params
  try {
    const result = await getWhatsappCotizacionAdicional(id, cotAdicionalId)
    return Response.json(result)
  } catch (err) {
    const e = err as Error & { status?: number }
    return Response.json({ message: e.message }, { status: e.status ?? 400 })
  }
}

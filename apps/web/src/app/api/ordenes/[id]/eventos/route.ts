import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { getEventos } from '@/lib/services/ordenes'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const { id } = await params
  const eventos = await getEventos(id)
  return Response.json(eventos)
}

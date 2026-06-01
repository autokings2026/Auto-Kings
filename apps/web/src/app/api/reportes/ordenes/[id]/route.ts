import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { getDetalleReporte } from '@/lib/services/reportes'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const { id } = await params
  const data = await getDetalleReporte(id)
  if (!data) return Response.json({ message: 'OT no encontrada' }, { status: 404 })
  return Response.json(data)
}

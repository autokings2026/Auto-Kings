import { findCotizacionByToken } from '@/lib/services/cotizacion'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const data = await findCotizacionByToken(token)
  if (!data) return Response.json({ message: 'Cotización no encontrada' }, { status: 404 })
  return Response.json(data)
}

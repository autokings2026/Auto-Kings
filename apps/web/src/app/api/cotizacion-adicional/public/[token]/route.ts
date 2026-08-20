import { findCotizacionAdicionalByToken } from '@/lib/services/cotizacion-adicional'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const data = await findCotizacionAdicionalByToken(token)
  if (!data) return Response.json({ message: 'Cotización adicional no encontrada' }, { status: 404 })
  return Response.json(data)
}

import { NextRequest } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { findAllClientes } from '@/lib/services/clientes'

// Directorio de clientes agrupado por teléfono (a partir de las reservas).
// Distinto de GET /api/clientes: ese devuelve filas de Cliente sin agrupar
// (una por reserva, ver findOrCreateCliente); este agrupa por persona real.
export async function GET(req: NextRequest) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const p = req.nextUrl.searchParams
  const result = await findAllClientes({
    search: p.get('search') ?? undefined,
    page: Number(p.get('page') ?? 1),
    pageSize: Number(p.get('pageSize') ?? 15),
  })

  return Response.json(result)
}

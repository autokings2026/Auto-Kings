import { getClienteDetalle } from '@/lib/services/clientes'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ telefono: string }> },
) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const { telefono } = await params
  try {
    const cliente = await getClienteDetalle(telefono)
    return Response.json(cliente)
  } catch (err) {
    const e = err as Error & { status?: number }
    return Response.json({ message: e.message }, { status: e.status ?? 500 })
  }
}

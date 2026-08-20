import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { registrarRespuestaCotizacionAdicional } from '@/lib/services/ordenes'

const Schema = z.object({
  aprobado: z.boolean(),
  mensaje:  z.string().optional(),
})

// Registro manual de la respuesta del cliente (ej. respondió por llamada).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cotAdicionalId: string }> },
) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const { id, cotAdicionalId } = await params
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos' }, { status: 400 })
  }

  try {
    const result = await registrarRespuestaCotizacionAdicional(id, cotAdicionalId, parsed.data, user.id)
    return Response.json(result)
  } catch (err) {
    const e = err as Error & { status?: number }
    return Response.json({ message: e.message }, { status: e.status ?? 400 })
  }
}

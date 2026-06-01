import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, requireRole, unauthorized, forbidden } from '@/lib/auth-helpers'
import { registrarCC, RolUsuario } from '@/lib/services/ordenes'

const Schema = z.object({
  aprobado:      z.boolean(),
  observaciones: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireRole(RolUsuario.ADMIN, RolUsuario.CONTROL_CALIDAD)
  if (!user) {
    const auth = await requireAuth()
    if (!auth) return unauthorized()
    return forbidden()
  }

  const { id } = await params
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos' }, { status: 400 })
  }

  try {
    const result = await registrarCC(id, parsed.data, user.id)
    return Response.json(result, { status: 201 })
  } catch (err) {
    const e = err as Error & { status?: number }
    return Response.json({ message: e.message }, { status: e.status ?? 400 })
  }
}

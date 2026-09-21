import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole, requireAuth, unauthorized, forbidden } from '@/lib/auth-helpers'
import { registrarMovimiento, listMovimientos } from '@/lib/services/inventario'
import { RolUsuario } from '@kings/shared'

const CreateSchema = z.object({
  tipo:     z.enum(['ENTRADA', 'AJUSTE']),
  cantidad: z.number().refine((n) => n !== 0, 'La cantidad no puede ser cero'),
  nota:     z.string().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) {
    const auth = await requireAuth()
    if (!auth) return unauthorized()
    return forbidden()
  }

  const { id } = await params
  try {
    const movimientos = await listMovimientos(id)
    return Response.json(movimientos)
  } catch (err) {
    const e = err as Error & { status?: number }
    return Response.json({ message: e.message }, { status: e.status ?? 400 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) {
    const auth = await requireAuth()
    if (!auth) return unauthorized()
    return forbidden()
  }

  const { id } = await params
  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos', errors: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const mov = await registrarMovimiento(id, parsed.data, user.id)
    return Response.json(mov, { status: 201 })
  } catch (err) {
    const e = err as Error & { status?: number }
    return Response.json({ message: e.message }, { status: e.status ?? 400 })
  }
}

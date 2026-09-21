import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole, requireAuth, unauthorized, forbidden } from '@/lib/auth-helpers'
import { updateInventario } from '@/lib/services/inventario'
import { RolUsuario } from '@kings/shared'

const UpdateSchema = z.object({
  nombre:      z.string().trim().min(1).optional(),
  descripcion: z.string().nullable().optional(),
  precioVenta: z.number().min(0).optional(),
  precioCosto: z.number().min(0).nullable().optional(),
  stockMinimo: z.number().min(0).optional(),
  unidad:      z.string().trim().optional(),
  proveedor:   z.string().nullable().optional(),
  activo:      z.boolean().optional(),
})

export async function PATCH(
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
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos', errors: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const inv = await updateInventario(id, parsed.data)
    return Response.json(inv)
  } catch (err) {
    const e = err as Error & { status?: number }
    return Response.json({ message: e.message }, { status: e.status ?? 400 })
  }
}

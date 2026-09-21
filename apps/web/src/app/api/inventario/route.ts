import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, requireRole, unauthorized, forbidden } from '@/lib/auth-helpers'
import { createInventario, listInventario, buscarInventarioParaCotizacion } from '@/lib/services/inventario'
import { RolUsuario } from '@kings/shared'

const CreateSchema = z.object({
  codigo:      z.string().trim().min(1),
  nombre:      z.string().trim().min(1),
  descripcion: z.string().optional(),
  precioVenta: z.number().min(0),
  precioCosto: z.number().min(0).optional(),
  stockMinimo: z.number().min(0).optional(),
  unidad:      z.string().trim().optional(),
  proveedor:   z.string().optional(),
})

// Cualquier usuario autenticado puede BUSCAR partes (para el picker de
// cotización); listar/administrar el catálogo completo es solo ADMIN.
export async function GET(req: NextRequest) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const p = req.nextUrl.searchParams
  const q = p.get('q') ?? undefined

  if (p.get('picker') === 'true') {
    const items = await buscarInventarioParaCotizacion(q ?? '')
    return Response.json(items)
  }

  if (user.rol !== RolUsuario.ADMIN) return forbidden()

  const items = await listInventario({
    q,
    bajoMinimo: p.get('bajoMinimo') === 'true',
    soloActivos: p.get('soloActivos') !== 'false',
  })
  return Response.json(items)
}

export async function POST(req: NextRequest) {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) {
    const auth = await requireAuth()
    if (!auth) return unauthorized()
    return forbidden()
  }

  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos', errors: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const inv = await createInventario(parsed.data)
    return Response.json(inv, { status: 201 })
  } catch (err) {
    const e = err as Error & { status?: number }
    return Response.json({ message: e.message }, { status: e.status ?? 400 })
  }
}

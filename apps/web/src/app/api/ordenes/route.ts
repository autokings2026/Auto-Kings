import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { createOrden, findAllOrdenes } from '@/lib/services/ordenes'
import { FaseOT, EstadoOT } from '@kings/shared'

const CreateSchema = z.object({
  citaId:     z.string().optional(),
  clienteId:  z.string().optional(),
  marcaId:    z.string().optional(),
  modeloId:   z.string().optional(),
  anio:       z.number().int().min(2000).max(2030).optional(),
  placa:      z.string().trim().min(2).regex(/^\S+$/, 'La placa no puede contener espacios').optional(),
  tecnicoId:  z.string().min(1),
  color:      z.string().min(1),
  combustible: z.enum(['GASOLINA', 'DIESEL', 'HIBRIDO', 'ELECTRICO', 'GAS']),
  kilometraje: z.number().min(0),
})

export async function GET(req: NextRequest) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const p = req.nextUrl.searchParams
  const result = await findAllOrdenes({
    fase:      (p.get('fase') as FaseOT | null)   ?? undefined,
    estado:    (p.get('estado') as EstadoOT | null) ?? undefined,
    search:    p.get('search')    ?? undefined,
    tecnicoId: p.get('tecnicoId') ?? undefined,
    page:      Number(p.get('page')     ?? 1),
    pageSize:  Number(p.get('pageSize') ?? 20),
  })

  return Response.json(result)
}

export async function POST(req: NextRequest) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos', errors: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const orden = await createOrden(parsed.data, user.id)
    return Response.json(orden, { status: 201 })
  } catch (err) {
    const e = err as Error & { status?: number }
    return Response.json({ message: e.message }, { status: e.status ?? 400 })
  }
}

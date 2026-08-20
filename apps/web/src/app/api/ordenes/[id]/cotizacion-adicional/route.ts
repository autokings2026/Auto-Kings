import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { crearCotizacionAdicional } from '@/lib/services/ordenes'

const ItemSchema = z.object({
  descripcion:    z.string().min(1),
  tipo:           z.enum(['MATERIAL', 'PARTE', 'MANO_OBRA']),
  cantidad:       z.number().min(0),
  precioUnitario: z.number().min(0),
  posicion:       z.number().int().optional(),
})

const Schema = z.object({
  motivo: z.string().trim().min(1, 'Explica por qué no se incluyó en la cotización original'),
  items:  z.array(ItemSchema).min(1, 'Agrega al menos un ítem'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const { id } = await params
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos', errors: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const result = await crearCotizacionAdicional(id, parsed.data, user.id)
    return Response.json(result)
  } catch (err) {
    const e = err as Error & { status?: number }
    return Response.json({ message: e.message }, { status: e.status ?? 400 })
  }
}

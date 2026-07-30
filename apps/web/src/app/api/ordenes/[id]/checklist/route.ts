import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { saveChecklist } from '@/lib/services/ordenes'

const Schema = z.object({
  testigos: z.array(z.string()),
  testigoOtro: z.string().optional(),
  anormalidades: z.array(z.string()),
  anormalidadOtro: z.string().optional(),
  observacionesRecepcion: z.string().optional(),
  observacionesAdicionales: z.string().optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const { id } = await params
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos' }, { status: 400 })
  }

  try {
    const result = await saveChecklist(id, parsed.data, user.id)
    return Response.json(result)
  } catch (err) {
    const e = err as Error & { status?: number }
    return Response.json({ message: e.message }, { status: e.status ?? 400 })
  }
}

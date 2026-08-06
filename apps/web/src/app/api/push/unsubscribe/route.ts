import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { eliminarSuscripcion } from '@/lib/services/push'

const BodySchema = z.object({ endpoint: z.string().url() })

// POST — elimina la suscripción push del navegador actual
export async function POST(req: NextRequest) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const body = await req.json()
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos' }, { status: 400 })
  }

  await eliminarSuscripcion(parsed.data.endpoint)
  return Response.json({ ok: true })
}

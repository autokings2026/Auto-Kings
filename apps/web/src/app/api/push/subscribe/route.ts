import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { guardarSuscripcion } from '@/lib/services/push'

const SubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

// POST — guarda (o actualiza) la suscripción push del navegador actual
export async function POST(req: NextRequest) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const body = await req.json()
  const parsed = SubscriptionSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Suscripción inválida' }, { status: 400 })
  }

  const userAgent = req.headers.get('user-agent') ?? undefined
  await guardarSuscripcion(user.id, parsed.data, userAgent)

  return Response.json({ ok: true })
}

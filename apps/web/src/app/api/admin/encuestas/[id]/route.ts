import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole, forbidden } from '@/lib/auth-helpers'
import { RolUsuario } from '@kings/shared'
import { aprobarEncuesta, rechazarEncuesta } from '@/lib/services/encuestas'

const BodySchema = z.discriminatedUnion('accion', [
  z.object({ accion: z.literal('aprobar'), comentario: z.string().max(1000).optional() }),
  z.object({
    accion: z.literal('rechazar'),
    requiereLlamada: z.boolean(),
    notasSeguimiento: z.string().max(1000).optional(),
  }),
])

// PATCH — aprobar (publica reseña) o rechazar (mal servicio) una encuesta respondida
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) return forbidden()

  const { id } = await params
  const body = await req.json()
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: parsed.error.errors[0]?.message ?? 'Datos inválidos' }, { status: 400 })
  }

  try {
    const result = parsed.data.accion === 'aprobar'
      ? await aprobarEncuesta(id, user.id, parsed.data.comentario)
      : await rechazarEncuesta(id, {
          requiereLlamada: parsed.data.requiereLlamada,
          notasSeguimiento: parsed.data.notasSeguimiento,
        }, user.id)
    return Response.json(result)
  } catch (err) {
    const e = err as Error & { status?: number }
    return Response.json({ message: e.message }, { status: e.status ?? 400 })
  }
}

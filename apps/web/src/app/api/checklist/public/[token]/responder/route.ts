import { NextRequest } from 'next/server'
import { z } from 'zod'
import { responderChecklist } from '@/lib/services/checklist'

const Schema = z.object({
  aceptado: z.boolean(),
  comentario: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos' }, { status: 400 })
  }

  try {
    const result = await responderChecklist(token, parsed.data.aceptado, parsed.data.comentario)
    if (!result) return Response.json({ message: 'Checklist no encontrado' }, { status: 404 })
    return Response.json(result)
  } catch (err) {
    return Response.json({ message: err instanceof Error ? err.message : 'Error' }, { status: 400 })
  }
}

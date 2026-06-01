import { NextRequest } from 'next/server'
import { z } from 'zod'
import { responderCotizacion } from '@/lib/services/cotizacion'

const Schema = z.object({
  aprobado: z.boolean(),
  mensaje:  z.string().optional(),
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
    const result = await responderCotizacion(token, parsed.data.aprobado, parsed.data.mensaje)
    if (!result) return Response.json({ message: 'Cotización no encontrada' }, { status: 404 })
    return Response.json(result)
  } catch (err) {
    return Response.json({ message: err instanceof Error ? err.message : 'Error' }, { status: 400 })
  }
}

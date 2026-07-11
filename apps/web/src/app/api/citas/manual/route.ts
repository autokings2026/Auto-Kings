import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { createCitaManual } from '@/lib/services/citas'

const CreateCitaManualSchema = z.object({
  nombre:      z.string().min(2),
  email:       z.string().email().optional(),
  telefono:    z.string().min(8),
  marcaId:     z.string(),
  modeloId:    z.string(),
  anio:        z.number().int().min(2000).max(2030),
  placa:       z.string().min(2),
  hora:        z.string().regex(/^\d{2}:\d{2}$/),
  comentarios: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const body = await req.json()
  const parsed = CreateCitaManualSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos', errors: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const result = await createCitaManual(parsed.data)
    return Response.json(result, { status: 201 })
  } catch (err) {
    return Response.json({ message: err instanceof Error ? err.message : 'Error al crear cita' }, { status: 400 })
  }
}

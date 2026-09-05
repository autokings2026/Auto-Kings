import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { createCita, findAllCitas } from '@/lib/services/citas'
import { EstadoCita } from '@kings/shared'

const CreateCitaSchema = z.object({
  nombre:      z.string().min(2),
  email:       z.string().email().optional(),
  telefono:    z.string().min(8),
  marcaId:     z.string(),
  modeloId:    z.string(),
  anio:        z.number().int().min(2000).max(new Date().getFullYear() + 2),
  placa:       z.string().trim().min(2).regex(/^\S+$/, 'La placa no puede contener espacios'),
  fecha:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora:        z.string().regex(/^\d{2}:\d{2}$/),
  comentarios: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const p = req.nextUrl.searchParams
  const result = await findAllCitas({
    rango:    (p.get('rango') as 'hoy' | 'semana' | 'mes' | 'todas') ?? 'todas',
    search:   p.get('search') ?? undefined,
    estado:   p.get('estado') as EstadoCita ?? undefined,
    page:     p.get('page') ? Number(p.get('page')) : 1,
    pageSize: p.get('pageSize') ? Number(p.get('pageSize')) : 20,
  })

  return Response.json(result)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = CreateCitaSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ message: 'Datos inválidos', errors: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const result = await createCita(parsed.data)
    return Response.json(result, { status: 201 })
  } catch (err) {
    return Response.json({ message: err instanceof Error ? err.message : 'Error al crear cita' }, { status: 400 })
  }
}

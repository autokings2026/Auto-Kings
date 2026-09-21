import { NextRequest } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { buscarVehiculos } from '@/lib/services/vehiculos'

export async function GET(req: NextRequest) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const q = req.nextUrl.searchParams.get('q') ?? ''
  const resultados = await buscarVehiculos(q)
  return Response.json(resultados)
}

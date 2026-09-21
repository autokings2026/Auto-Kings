import { NextRequest } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { getHistorialVehiculo } from '@/lib/services/vehiculos'

export async function GET(req: NextRequest) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const placa = req.nextUrl.searchParams.get('placa') ?? ''
  try {
    const result = await getHistorialVehiculo(placa)
    return Response.json(result)
  } catch (err) {
    const e = err as Error & { status?: number }
    return Response.json({ message: e.message }, { status: e.status ?? 400 })
  }
}

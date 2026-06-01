import { NextRequest } from 'next/server'
import { getSlotsDisponibles } from '@/lib/services/citas'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const fecha = req.nextUrl.searchParams.get('fecha')
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return Response.json({ message: 'Parámetro fecha requerido (YYYY-MM-DD)' }, { status: 400 })
  }

  const slots = await getSlotsDisponibles(fecha)
  return Response.json(slots)
}

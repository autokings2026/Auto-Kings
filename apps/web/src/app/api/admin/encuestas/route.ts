import { NextRequest } from 'next/server'
import { requireRole, forbidden } from '@/lib/auth-helpers'
import { RolUsuario } from '@kings/shared'
import { listEncuestasRevision } from '@/lib/services/encuestas'

// GET — encuestas respondidas, para revisión del staff
export async function GET(req: NextRequest) {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) return forbidden()

  const { searchParams } = new URL(req.url)
  const estadoParam = searchParams.get('estado')
  const estado = estadoParam === 'PENDIENTE' || estadoParam === 'APROBADA' || estadoParam === 'RECHAZADA'
    ? estadoParam
    : undefined
  const page = Number(searchParams.get('page') ?? '1')
  const pageSize = Number(searchParams.get('pageSize') ?? '20')

  const result = await listEncuestasRevision({ estado, page, pageSize })
  return Response.json(result)
}

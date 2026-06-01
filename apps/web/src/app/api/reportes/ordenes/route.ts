import { NextRequest } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { getOrdenesCompletadas } from '@/lib/services/reportes'

export async function GET(req: NextRequest) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const p = req.nextUrl.searchParams

  const result = await getOrdenesCompletadas({
    page:      Number(p.get('page') ?? 1),
    pageSize:  Number(p.get('pageSize') ?? 20),
    desde:     p.get('desde') ?? undefined,
    hasta:     p.get('hasta') ?? undefined,
    tecnicoId: p.get('tecnicoId') ?? undefined,
  })

  return Response.json(result)
}

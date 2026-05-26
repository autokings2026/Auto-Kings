import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const search = req.nextUrl.searchParams.get('search') ?? undefined

  const clientes = await prisma.cliente.findMany({
    where: search
      ? {
          OR: [
            { nombre:   { contains: search, mode: 'insensitive' } },
            { telefono: { contains: search } },
            { email:    { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { nombre: 'asc' },
    take: 50,
  })

  return Response.json(clientes)
}

import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { getDashboardStats } from '@/lib/services/ordenes'

export async function GET() {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const stats = await getDashboardStats()
  return Response.json(stats)
}

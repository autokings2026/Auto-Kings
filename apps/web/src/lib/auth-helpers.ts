import { auth } from '@/auth'
import { RolUsuario } from '@kings/shared'

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) return null
  return session.user
}

export async function requireRole(...roles: RolUsuario[]) {
  const user = await requireAuth()
  if (!user) return null
  if (!roles.includes(user.rol)) return null
  return user
}

export const unauthorized = () =>
  Response.json({ message: 'No autorizado' }, { status: 401 })

export const forbidden = () =>
  Response.json({ message: 'Sin permisos' }, { status: 403 })

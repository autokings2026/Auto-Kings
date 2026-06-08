import { NextRequest } from 'next/server'
import { requireRole, forbidden } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { RolUsuario } from '@kings/shared'

const PALABRA = 'LIMPIAR'

export async function POST(req: NextRequest) {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) return forbidden()

  const { confirmacion } = await req.json() as { confirmacion: string }
  if (confirmacion !== PALABRA) {
    return Response.json({ message: 'Palabra de confirmación incorrecta' }, { status: 400 })
  }

  // Eliminación en orden respetando FK Restrict:
  // 1. mensajes (referencia a cliente con Restrict)
  // 2. ordenes (cascade a fotos, diagnóstico, items, reparación, CC, entrega, encuesta, eventos)
  // 3. citas (referencia a cliente con Restrict)
  // 4. clientes (ya sin referencias)
  await prisma.$transaction([
    prisma.mensajeWhatsApp.deleteMany(),
    prisma.ordenTrabajo.deleteMany(),
    prisma.cita.deleteMany(),
    prisma.cliente.deleteMany(),
  ])

  return Response.json({ ok: true })
}

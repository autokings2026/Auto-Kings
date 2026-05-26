import { prisma } from '@/lib/prisma'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { TipoMensajeWA } from '@kings/shared'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clienteId: string }> },
) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const { clienteId } = await params

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } })
  if (!cliente) {
    return Response.json({ message: 'Cliente no encontrado' }, { status: 404 })
  }

  const mensajes = await prisma.mensajeWhatsApp.findMany({
    where: { clienteId },
    orderBy: { enviadoEn: 'asc' },
    include: {
      enviadoPor: { select: { nombre: true } },
      orden:      { select: { numero: true } },
    },
  })

  await prisma.mensajeWhatsApp.updateMany({
    where: { clienteId, tipo: TipoMensajeWA.ENTRANTE, leido: false },
    data: { leido: true },
  })

  return Response.json({
    cliente: { id: cliente.id, nombre: cliente.nombre, telefono: cliente.telefono },
    mensajes: mensajes.map(m => ({
      id:             m.id,
      texto:          m.texto,
      tipo:           m.tipo,
      plantillaUsada: m.plantillaUsada,
      leido:          m.leido,
      enviadoEn:      m.enviadoEn.toISOString(),
      enviadoPor:     m.enviadoPor.nombre,
      ordenNumero:    m.orden?.numero ?? null,
    })),
  })
}

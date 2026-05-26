import { prisma } from '@/lib/prisma'
import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { TipoMensajeWA } from '@kings/shared'

export async function GET() {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const config = await prisma.configuracionTaller.findFirst()
  const alertaAmarilla = config?.alertaAmarillaMinutos ?? 60
  const alertaRoja     = config?.alertaRojaMinutos     ?? 120
  const ahora = new Date()

  const clientes = await prisma.cliente.findMany({
    where: { mensajes: { some: {} } },
    include: {
      mensajes: {
        orderBy: { enviadoEn: 'desc' },
        take: 1,
        include: { enviadoPor: { select: { nombre: true } } },
      },
      _count: {
        select: {
          mensajes: { where: { leido: false, tipo: TipoMensajeWA.ENTRANTE } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const resultado = clientes.map(c => {
    const ultimo = c.mensajes[0]
    const noLeidos = c._count.mensajes
    const minutosDesdeUltimo = ultimo
      ? Math.floor((ahora.getTime() - ultimo.enviadoEn.getTime()) / 60000)
      : 0
    const sinResponder = ultimo?.tipo === TipoMensajeWA.ENTRANTE && !ultimo.leido

    return {
      clienteId: c.id,
      nombre:    c.nombre,
      telefono:  c.telefono,
      noLeidos,
      ultimoMensaje: ultimo
        ? {
            id:         ultimo.id,
            texto:      ultimo.texto,
            tipo:       ultimo.tipo,
            enviadoEn:  ultimo.enviadoEn.toISOString(),
            enviadoPor: ultimo.enviadoPor.nombre,
          }
        : null,
      minutosDesdeUltimo,
      alerta: sinResponder
        ? minutosDesdeUltimo >= alertaRoja
          ? 'roja'
          : minutosDesdeUltimo >= alertaAmarilla
            ? 'amarilla'
            : null
        : null,
    }
  })

  return Response.json(resultado)
}

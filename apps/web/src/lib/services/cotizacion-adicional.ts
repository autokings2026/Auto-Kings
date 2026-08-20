import { prisma } from '@/lib/prisma'
import { TipoEventoOT } from '@kings/shared'

// ── Datos públicos ─────────────────────────────────────────────────────────────

export async function findCotizacionAdicionalByToken(token: string) {
  const cot = await prisma.cotizacionAdicional.findUnique({
    where: { tokenAprobacion: token },
    include: {
      items: { orderBy: { posicion: 'asc' } },
      orden: { include: { cliente: true, marca: true, modelo: true, tecnico: { select: { nombre: true } } } },
    },
  })
  if (!cot) return null

  const o = cot.orden
  return {
    token,
    numero: o.numero,
    clienteNombre: o.cliente.nombre,
    vehiculo: `${o.marca.nombre} ${o.modelo.nombre} ${o.anio}`,
    placa: o.placa,
    tecnico: o.tecnico.nombre,
    motivo: cot.motivo,
    items: cot.items.map(i => ({
      descripcion: i.descripcion,
      tipo: i.tipo,
      cantidad: Number(i.cantidad),
      precioUnitario: Number(i.precioUnitario),
      subtotal: Number(i.subtotal),
    })),
    totalMateriales: Number(cot.totalMateriales),
    totalPartes: Number(cot.totalPartes),
    totalManoObra: Number(cot.totalManoObra),
    totalGeneral: Number(cot.totalGeneral),
    aprobado: cot.aprobado,
    fechaAprobacion: cot.fechaAprobacion?.toISOString() ?? null,
  }
}

// ── Respuesta del cliente ───────────────────────────────────────────────────────
// A diferencia de la cotización original, aprobar/rechazar un addendum NO
// cambia la fase de la OT — la reparación sigue su curso; esto solo destraba
// el poka-yoke que bloquea "Finalizar reparación" mientras esté pendiente.

export async function responderCotizacionAdicional(token: string, aprobado: boolean, mensaje?: string) {
  const cot = await prisma.cotizacionAdicional.findUnique({
    where: { tokenAprobacion: token },
    select: { id: true, ordenId: true, aprobado: true, totalGeneral: true },
  })
  if (!cot) return null

  if (cot.aprobado !== null) {
    throw new Error(cot.aprobado ? 'Esta cotización adicional ya fue aprobada' : 'Esta cotización adicional ya fue rechazada')
  }

  return prisma.$transaction(async (tx) => {
    await tx.cotizacionAdicional.update({
      where: { tokenAprobacion: token },
      data: { aprobado, fechaAprobacion: new Date(), mensajeAprobacion: mensaje },
    })

    await tx.eventoOT.create({
      data: {
        ordenId: cot.ordenId,
        tipo: aprobado ? TipoEventoOT.COTIZACION_ADICIONAL_APROBADA : TipoEventoOT.COTIZACION_ADICIONAL_RECHAZADA,
        descripcion: aprobado
          ? `Cotización adicional aprobada por el cliente (link público). Total: L. ${Number(cot.totalGeneral).toFixed(2)}`
          : `Cotización adicional rechazada por el cliente (link público).${mensaje ? ` Motivo: ${mensaje}` : ''}`,
      },
    })

    return { ok: true, aprobado }
  })
}

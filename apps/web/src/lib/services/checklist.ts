import { prisma } from '@/lib/prisma'
import { TipoEventoOT } from '@kings/shared'

// ── Datos públicos ─────────────────────────────────────────────────────────────

export async function findChecklistByToken(token: string) {
  const chk = await prisma.checklistRecepcion.findUnique({
    where: { tokenAprobacion: token },
    include: {
      orden: { include: { cliente: true, marca: true, modelo: true, tecnico: { select: { nombre: true } } } },
    },
  })
  if (!chk) return null

  const o = chk.orden
  return {
    token,
    numero: o.numero,
    clienteNombre: o.cliente.nombre,
    vehiculo: `${o.marca.nombre} ${o.modelo.nombre} ${o.anio}`,
    placa: o.placa,
    kilometraje: o.kilometraje,
    tecnico: o.tecnico.nombre,
    testigos: chk.testigos,
    testigoOtro: chk.testigoOtro,
    anormalidades: chk.anormalidades,
    anormalidadOtro: chk.anormalidadOtro,
    observacionesRecepcion: chk.observacionesRecepcion,
    observacionesAdicionales: chk.observacionesAdicionales,
    aceptado: chk.aceptado,
    fechaRespuesta: chk.fechaRespuesta?.toISOString() ?? null,
  }
}

// ── Respuesta del cliente ─────────────────────────────────────────────────────

export async function responderChecklist(token: string, aceptado: boolean, comentario?: string) {
  const chk = await prisma.checklistRecepcion.findUnique({
    where: { tokenAprobacion: token },
    select: { ordenId: true, aceptado: true },
  })
  if (!chk) return null

  if (chk.aceptado !== null) {
    throw new Error(chk.aceptado ? 'Este checklist ya fue aceptado' : 'Este checklist ya fue rechazado')
  }

  return prisma.$transaction(async (tx) => {
    await tx.checklistRecepcion.update({
      where: { tokenAprobacion: token },
      data: { aceptado, fechaRespuesta: new Date(), comentarioCliente: comentario },
    })
    await tx.eventoOT.create({
      data: {
        ordenId: chk.ordenId,
        tipo: aceptado ? TipoEventoOT.CHECKLIST_ACEPTADO : TipoEventoOT.CHECKLIST_RECHAZADO,
        descripcion: aceptado
          ? 'Checklist de recepción aceptado por el cliente (link público).'
          : `Checklist de recepción rechazado por el cliente (link público).${comentario ? ` Motivo: ${comentario}` : ''}`,
      },
    })
    return { ok: true, aceptado }
  })
}

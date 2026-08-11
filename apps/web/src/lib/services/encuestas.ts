import { prisma } from '@/lib/prisma'
import { TipoEventoOT } from '@kings/shared'

// ── Helpers ───────────────────────────────────────────────────────────────────

function badRequest(msg: string): never {
  const err = new Error(msg)
  ;(err as Error & { status: number }).status = 400
  throw err
}

function notFound(msg: string): never {
  const err = new Error(msg)
  ;(err as Error & { status: number }).status = 404
  throw err
}

function generarCodigoCortesia() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin caracteres ambiguos (0,O,1,I)
  let code = 'KA-'
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

const mapEncuesta = (e: {
  id: string
  calidad: number | null
  tiempo: number | null
  atencion: number | null
  comentario: string | null
  respondidoEn: Date | null
  estadoRevision: string
  requiereLlamada: boolean
  notasSeguimiento: string | null
  cortesiaTipo: string | null
  codigoCortesia: string | null
  codigoEnviadoEn: Date | null
  revisadoEn: Date | null
  revisadoPor: { nombre: string } | null
  orden: {
    id: string
    numero: string
    placa: string
    anio: number
    cliente: { nombre: string; telefono: string; email: string | null }
    marca: { nombre: string }
    modelo: { nombre: string }
  }
}) => ({
  id: e.id,
  ordenId: e.orden.id,
  ordenNumero: e.orden.numero,
  placa: e.orden.placa,
  vehiculo: `${e.orden.marca.nombre} ${e.orden.modelo.nombre} ${e.orden.anio}`,
  cliente: e.orden.cliente,
  calidad: e.calidad,
  tiempo: e.tiempo,
  atencion: e.atencion,
  promedio: e.calidad && e.tiempo && e.atencion
    ? +((e.calidad + e.tiempo + e.atencion) / 3).toFixed(1)
    : null,
  comentario: e.comentario,
  respondidoEn: e.respondidoEn?.toISOString() ?? null,
  estadoRevision: e.estadoRevision,
  requiereLlamada: e.requiereLlamada,
  notasSeguimiento: e.notasSeguimiento,
  cortesiaTipo: e.cortesiaTipo,
  codigoCortesia: e.codigoCortesia,
  codigoEnviadoEn: e.codigoEnviadoEn?.toISOString() ?? null,
  revisadoEn: e.revisadoEn?.toISOString() ?? null,
  revisadoPor: e.revisadoPor?.nombre ?? null,
})

const ENCUESTA_INCLUDE = {
  orden: {
    select: {
      id: true, numero: true, placa: true, anio: true,
      cliente: { select: { nombre: true, telefono: true, email: true } },
      marca: { select: { nombre: true } },
      modelo: { select: { nombre: true } },
    },
  },
  revisadoPor: { select: { nombre: true } },
} as const

// ── Listado para revisión (solo respondidas) ────────────────────────────────────

export async function listEncuestasRevision(params: {
  estado?: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'
  page: number
  pageSize: number
}) {
  const { estado, page, pageSize } = params
  const where = {
    respondidoEn: { not: null },
    ...(estado ? { estadoRevision: estado } : {}),
  }

  const [total, encuestas, pendientes] = await Promise.all([
    prisma.encuestaSatisfaccion.count({ where }),
    prisma.encuestaSatisfaccion.findMany({
      where,
      orderBy: { respondidoEn: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: ENCUESTA_INCLUDE,
    }),
    prisma.encuestaSatisfaccion.count({ where: { respondidoEn: { not: null }, estadoRevision: 'PENDIENTE' } }),
  ])

  return {
    data: encuestas.map(mapEncuesta),
    total, page, pageSize,
    totalPages: Math.ceil(total / pageSize),
    pendientes,
  }
}

// ── Aprobar (publica como reseña) ────────────────────────────────────────────────

export async function aprobarEncuesta(id: string, userId: string, comentarioOverride?: string) {
  const enc = await prisma.encuestaSatisfaccion.findUnique({
    where: { id },
    include: { orden: { include: { cliente: true, marca: true, modelo: true } } },
  })
  if (!enc) notFound('Encuesta no encontrada')
  if (!enc.respondidoEn) badRequest('La encuesta aún no ha sido respondida por el cliente')
  if (enc.estadoRevision !== 'PENDIENTE') badRequest('Esta encuesta ya fue revisada')

  // El cliente puede haber calificado con estrellas sin escribir comentario.
  // En ese caso el staff puede redactar uno (ej. lo que dijo por telefono)
  // para poder publicar igual la reseña; si no hay ninguno, no se puede
  // publicar (la reseña pública siempre necesita un texto).
  const comentarioFinal = enc.comentario?.trim() || comentarioOverride?.trim()
  if (!comentarioFinal) badRequest('No se puede publicar una reseña sin comentario del cliente')

  const promedio = Math.round(
    ((enc.calidad ?? 0) + (enc.tiempo ?? 0) + (enc.atencion ?? 0)) / 3,
  ) || 5

  return prisma.$transaction(async (tx) => {
    const resena = await tx.resena.create({
      data: {
        nombre: enc.orden.cliente.nombre,
        vehiculoMarca: enc.orden.marca.nombre,
        vehiculoModelo: enc.orden.modelo.nombre,
        vehiculoAnio: enc.orden.anio,
        placa: enc.orden.placa,
        calificacion: promedio,
        comentario: comentarioFinal,
        estado: 'APROBADA',
      },
    })
    const updated = await tx.encuestaSatisfaccion.update({
      where: { id },
      data: {
        estadoRevision: 'APROBADA',
        revisadoPorId: userId,
        revisadoEn: new Date(),
        resenaId: resena.id,
      },
      include: ENCUESTA_INCLUDE,
    })
    await tx.eventoOT.create({
      data: {
        ordenId: enc.ordenId,
        tipo: TipoEventoOT.ENCUESTA_APROBADA,
        descripcion: enc.comentario?.trim()
          ? 'Comentario de la encuesta aprobado por el staff y publicado como reseña en el sitio web.'
          : 'Encuesta aprobada y publicada como reseña con un comentario redactado por el staff (el cliente no dejó uno).',
        realizadoPorId: userId,
      },
    })
    return mapEncuesta(updated)
  })
}

// ── Rechazar (mal servicio, con o sin llamada de seguimiento) ───────────────────

export interface RechazarEncuestaInput {
  requiereLlamada: boolean
  notasSeguimiento?: string
}

export async function rechazarEncuesta(id: string, dto: RechazarEncuestaInput, userId: string) {
  const enc = await prisma.encuestaSatisfaccion.findUnique({ where: { id } })
  if (!enc) notFound('Encuesta no encontrada')
  if (!enc.respondidoEn) badRequest('La encuesta aún no ha sido respondida por el cliente')
  if (enc.estadoRevision !== 'PENDIENTE') badRequest('Esta encuesta ya fue revisada')

  return prisma.$transaction(async (tx) => {
    const updated = await tx.encuestaSatisfaccion.update({
      where: { id },
      data: {
        estadoRevision: 'RECHAZADA',
        revisadoPorId: userId,
        revisadoEn: new Date(),
        requiereLlamada: dto.requiereLlamada,
        notasSeguimiento: dto.notasSeguimiento,
      },
      include: ENCUESTA_INCLUDE,
    })
    await tx.eventoOT.create({
      data: {
        ordenId: enc.ordenId,
        tipo: TipoEventoOT.ENCUESTA_RECHAZADA,
        descripcion: `Encuesta marcada como mal servicio (no se publica).${dto.requiereLlamada ? ' Requiere llamada de seguimiento al cliente.' : ''}`,
        realizadoPorId: userId,
      },
    })
    return mapEncuesta(updated)
  })
}

// ── Cortesía: generar código y armar link de WhatsApp ────────────────────────────

export interface EnviarCortesiaInput {
  cortesiaTipo: string
}

export async function getWhatsappCortesia(id: string, dto: EnviarCortesiaInput, userId: string) {
  const enc = await prisma.encuestaSatisfaccion.findUnique({
    where: { id },
    include: { orden: { include: { cliente: true, marca: true, modelo: true } } },
  })
  if (!enc) notFound('Encuesta no encontrada')
  if (enc.estadoRevision !== 'RECHAZADA') badRequest('Solo se puede enviar una cortesía a encuestas marcadas como mal servicio')

  let codigo = enc.codigoCortesia
  if (!codigo) {
    codigo = generarCodigoCortesia()
    while (await prisma.encuestaSatisfaccion.findUnique({ where: { codigoCortesia: codigo } })) {
      codigo = generarCodigoCortesia()
    }
    await prisma.encuestaSatisfaccion.update({
      where: { id },
      data: { cortesiaTipo: dto.cortesiaTipo, codigoCortesia: codigo, codigoEnviadoEn: new Date() },
    })
    await prisma.eventoOT.create({
      data: {
        ordenId: enc.ordenId,
        tipo: TipoEventoOT.CORTESIA_ENVIADA,
        descripcion: `Código de cortesía generado y enviado por WhatsApp: ${codigo} (${dto.cortesiaTipo}).`,
        realizadoPorId: userId,
      },
    })
  }

  const cliente = enc.orden.cliente
  const mensaje = `Hola ${cliente.nombre}, lamentamos que su experiencia con el servicio de su ${enc.orden.marca.nombre} ${enc.orden.modelo.nombre} (placa ${enc.orden.placa}) no haya sido la esperada.

Queremos compensarlo: le ofrecemos *${dto.cortesiaTipo}* en su próxima visita.

Su código de cortesía es: *${codigo}*
Muéstrelo (o este mensaje) en su próxima cita en Kings Auto Diagnósticos para redimirlo.

Gracias por su paciencia, seguiremos trabajando para mejorar. 🙏`

  const telefono = cliente.telefono.replace(/\D/g, '')
  const waLink = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`

  return { waLink, codigo, mensaje }
}

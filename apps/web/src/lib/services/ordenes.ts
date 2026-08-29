import { prisma } from '@/lib/prisma'
import { deleteImage } from '@/lib/cloudinary'
import {
  EstadoCita,
  EstadoOT,
  FaseOT,
  TipoEventoOT,
  LABEL_FASE,
  ORDEN_FASES,
  RolUsuario,
} from '@kings/shared'
import { Prisma } from '@prisma/client'

// ── Types ────────────────────────────────────────────────────────────────────

export interface CreateOrdenInput {
  citaId?: string
  clienteId?: string
  marcaId?: string
  modeloId?: string
  anio?: number
  placa?: string
  tecnicoId: string
  color: string
  combustible: string
  kilometraje: number
}

export interface QueryOrdenesInput {
  fase?: FaseOT
  estado?: EstadoOT
  search?: string
  tecnicoId?: string
  page?: number
  pageSize?: number
}

export interface ItemInput {
  descripcion: string
  tipo: 'MATERIAL' | 'PARTE' | 'MANO_OBRA'
  cantidad: number
  precioUnitario: number
  posicion?: number
}

export interface SaveDiagnosticoInput {
  sintomaCliente: string
  diagnosticoTecnico: string
  items: ItemInput[]
  aplicarISV?: boolean
}

export interface AprobacionInput {
  aprobado: boolean
  mensajeAprobacion?: string
}

export interface SaveChecklistInput {
  testigos: string[]
  testigoOtro?: string
  anormalidades: string[]
  anormalidadOtro?: string
  observacionesRecepcion?: string
  observacionesAdicionales?: string
}

export interface AceptacionChecklistInput {
  aceptado: boolean
  comentarioCliente?: string
}

export interface SaveReparacionInput {
  notas?: string
  finalizada?: boolean
}

export interface CreateCCInput {
  aprobado: boolean
  observaciones?: string
}

export interface RegistrarEntregaInput {
  entregadoEn?: string
}

export interface CrearCotizacionAdicionalInput {
  motivo: string
  items: ItemInput[]
}

export interface ResponderCotizacionAdicionalInput {
  aprobado: boolean
  mensaje?: string
}

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

async function generarNumero(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.ordenTrabajo.count({
    where: { createdAt: { gte: new Date(`${year}-01-01T00:00:00`) } },
  })
  return `OT-${year}-${String(count + 1).padStart(4, '0')}`
}

// ── Crear OT ─────────────────────────────────────────────────────────────────

export async function createOrden(dto: CreateOrdenInput, userId: string) {
  let clienteId: string
  let marcaId: string
  let modeloId: string
  let anio: number
  let placa: string
  let citaId: string | undefined

  if (dto.citaId) {
    const cita = await prisma.cita.findUnique({
      where: { id: dto.citaId },
      include: { ordenTrabajo: true },
    })
    if (!cita) badRequest('Cita no encontrada')
    if (cita!.estado === EstadoCita.CANCELADA) badRequest('La cita está cancelada')
    if (cita!.ordenTrabajo) badRequest('La cita ya tiene una OT asignada')

    clienteId = cita!.clienteId
    marcaId   = cita!.marcaId
    modeloId  = cita!.modeloId
    anio      = cita!.anio
    placa     = cita!.placa ?? ''
    citaId    = cita!.id
  } else {
    if (!dto.clienteId || !dto.marcaId || !dto.modeloId || !dto.anio || !dto.placa) {
      badRequest('Para una OT directa se requiere: clienteId, marcaId, modeloId, anio, placa')
    }
    clienteId = dto.clienteId!
    marcaId   = dto.marcaId!
    modeloId  = dto.modeloId!
    anio      = dto.anio!
    placa     = dto.placa!
  }

  // generarNumero() cuenta las OTs del año y calcula el siguiente correlativo
  // FUERA de una transacción — si dos OTs se crean casi al mismo tiempo (dos
  // recepciones simultáneas), ambas pueden calcular el mismo número antes de
  // que la primera termine de insertarse, y la segunda choca contra el unique
  // constraint de `numero`. Se reintenta con un número recalculado en vez de
  // fallarle al usuario con un error de Prisma.
  const MAX_INTENTOS = 5
  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    const numero = await generarNumero()
    try {
      return await prisma.$transaction(async (tx) => {
        const orden = await tx.ordenTrabajo.create({
          data: {
            numero,
            citaId,
            clienteId,
            tecnicoId: dto.tecnicoId,
            marcaId,
            modeloId,
            anio,
            placa: placa.toUpperCase(),
            color: dto.color,
            combustible: dto.combustible as Prisma.OrdenTrabajoCreateInput['combustible'],
            kilometraje: dto.kilometraje,
          },
          include: {
            cliente: true,
            marca: true,
            modelo: true,
            tecnico: { select: { id: true, nombre: true, email: true, rol: true } },
          },
        })

        if (citaId) {
          await tx.cita.update({ where: { id: citaId }, data: { estado: EstadoCita.CONVERTIDA } })
        }

        await tx.eventoOT.create({
          data: {
            ordenId: orden.id,
            tipo: TipoEventoOT.CREACION_OT,
            descripcion: `OT creada${citaId ? ' desde cita' : ' directamente'}. Vehículo: ${orden.marca.nombre} ${orden.modelo.nombre} ${orden.anio} — ${orden.placa}`,
            realizadoPorId: userId,
          },
        })

        return orden
      })
    } catch (err) {
      const esChoqueDeNumero =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        (err.meta?.['target'] as string[] | undefined)?.includes('numero')
      if (!esChoqueDeNumero || intento === MAX_INTENTOS) throw err
    }
  }
  // Inalcanzable: el for siempre retorna o lanza en su última iteración.
  throw new Error('No se pudo generar un número de OT único, intenta de nuevo')
}

// ── Listar ────────────────────────────────────────────────────────────────────

export async function findAllOrdenes(query: QueryOrdenesInput) {
  const { fase, estado, search, tecnicoId, page = 1, pageSize = 20 } = query
  const capped = Math.min(pageSize, 100)

  const where: Prisma.OrdenTrabajoWhereInput = {}
  if (fase)      where.faseActual = fase
  if (estado)    where.estado     = estado
  if (tecnicoId) where.tecnicoId  = tecnicoId
  if (search) {
    where.OR = [
      { numero:  { contains: search, mode: 'insensitive' } },
      { placa:   { contains: search, mode: 'insensitive' } },
      { cliente: { nombre:   { contains: search, mode: 'insensitive' } } },
      { cliente: { telefono: { contains: search } } },
    ]
  }

  const [ordenes, total] = await Promise.all([
    prisma.ordenTrabajo.findMany({
      where,
      include: {
        cliente: true,
        marca: true,
        modelo: true,
        tecnico: { select: { id: true, nombre: true } },
        fotos: { select: { id: true }, take: 1 },
        diagnostico: { select: { id: true, totalGeneral: true, aprobado: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * capped,
      take: capped,
    }),
    prisma.ordenTrabajo.count({ where }),
  ])

  return {
    data: ordenes.map((o) => ({
      id: o.id,
      numero: o.numero,
      clienteNombre: o.cliente.nombre,
      clienteTelefono: o.cliente.telefono,
      marcaNombre: o.marca.nombre,
      modeloNombre: o.modelo.nombre,
      anio: o.anio,
      placa: o.placa,
      color: o.color,
      faseActual: o.faseActual,
      estado: o.estado,
      tecnicoNombre: o.tecnico.nombre,
      tieneFotos: o.fotos.length > 0,
      totalCotizacion: o.diagnostico?.totalGeneral ?? null,
      cotizacionAprobada: o.diagnostico?.aprobado ?? null,
      createdAt: o.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize: capped,
    totalPages: Math.ceil(total / capped),
  }
}

// ── Detalle ───────────────────────────────────────────────────────────────────

export async function findOneOrden(id: string) {
  const orden = await prisma.ordenTrabajo.findUnique({
    where: { id },
    include: {
      cliente: true,
      tecnico: { select: { id: true, nombre: true, email: true, rol: true } },
      marca: true,
      modelo: true,
      cita: { select: { id: true, fecha: true, hora: true } },
      fotos: {
        orderBy: { createdAt: 'asc' },
        include: { tipoFoto: { select: { id: true, nombre: true } } },
      },
      fotosReparacion: { orderBy: { createdAt: 'asc' } },
      checklistRecepcion: true,
      diagnostico: { include: { items: { orderBy: { posicion: 'asc' } } } },
      cotizacionesAdicionales: {
        orderBy: { createdAt: 'asc' },
        include: { items: { orderBy: { posicion: 'asc' } }, creador: { select: { id: true, nombre: true } } },
      },
      reparacion: { include: { tecnico: { select: { id: true, nombre: true } } } },
      controlesCC: {
        orderBy: { revisadoEn: 'asc' },
        include: { revisadoPor: { select: { id: true, nombre: true } } },
      },
      entrega: { include: { registradoPor: { select: { id: true, nombre: true } } } },
      encuesta: true,
      eventos: {
        orderBy: { createdAt: 'asc' },
        include: { realizadoPor: { select: { id: true, nombre: true } } },
      },
    },
  })
  if (!orden) notFound('OT no encontrada')
  return orden
}

// ── Avanzar fase ─────────────────────────────────────────────────────────────

export async function avanzarFase(id: string, userId: string) {
  const orden = await prisma.ordenTrabajo.findUnique({ where: { id } })
  if (!orden) notFound('OT no encontrada')

  if (orden!.estado === EstadoOT.CANCELADA) badRequest('La OT está cancelada')
  if (orden!.faseActual === FaseOT.COMPLETADA) badRequest('La OT ya está completada')

  const idx = ORDEN_FASES.indexOf(orden!.faseActual as FaseOT)
  const siguienteFase = ORDEN_FASES[idx + 1]
  if (!siguienteFase) badRequest('No hay siguiente fase')

  if (orden!.faseActual === FaseOT.LLEGADA_FOTOS) {
    const chk = await prisma.checklistRecepcion.findUnique({ where: { ordenId: id } })
    if (!chk) badRequest('Completa el checklist de recepción antes de avanzar')
    if (chk!.aceptado === null) badRequest('El checklist de recepción está pendiente de aceptación del cliente')
    if (chk!.aceptado === false) badRequest('El cliente rechazó el checklist de recepción')
  }

  if (orden!.faseActual === FaseOT.DIAGNOSTICO) {
    const diag = await prisma.diagnosticoCotizacion.findUnique({ where: { ordenId: id } })
    if (!diag) badRequest('Registra el diagnóstico antes de avanzar')
    if (diag!.aprobado === null) badRequest('La cotización está pendiente de aprobación del cliente')
    if (diag!.aprobado === false) badRequest('La cotización fue rechazada')
  }

  if (orden!.faseActual === FaseOT.REPARACION) {
    const rep = await prisma.reparacion.findUnique({ where: { ordenId: id } })
    if (!rep?.finalizadaEn) badRequest('Finaliza la reparación antes de avanzar a Control de Calidad')
  }

  // Control de Calidad y Entrega tienen su propio endpoint (registrarCC / registrarEntrega)
  // que valida la aprobación correspondiente y hace la transición de fase por su cuenta.
  // Este endpoint genérico NUNCA debe saltarse esas aprobaciones.
  if (orden!.faseActual === FaseOT.CONTROL_CALIDAD) {
    badRequest('Registra el resultado de Control de Calidad para avanzar')
  }
  if (orden!.faseActual === FaseOT.ENTREGA) {
    badRequest('Registra la entrega del vehículo para completar la OT')
  }

  const nuevoEstado = siguienteFase === FaseOT.COMPLETADA ? EstadoOT.COMPLETADA : orden!.estado

  return prisma.$transaction(async (tx) => {
    const updated = await tx.ordenTrabajo.update({
      where: { id },
      data: { faseActual: siguienteFase, estado: nuevoEstado },
    })

    await tx.eventoOT.create({
      data: {
        ordenId: id,
        tipo: TipoEventoOT.CAMBIO_FASE,
        descripcion: `Fase: ${LABEL_FASE[orden!.faseActual as FaseOT]} → ${LABEL_FASE[siguienteFase!]}`,
        realizadoPorId: userId,
      },
    })

    if (siguienteFase === FaseOT.COMPLETADA) {
      await tx.encuestaSatisfaccion.upsert({
        where: { ordenId: id },
        create: { ordenId: id },
        update: {},
      })
    }

    return updated
  })
}

// ── Fotos ─────────────────────────────────────────────────────────────────────

export async function addFoto(
  id: string,
  dto: { url: string; publicId: string; tipoFotoId?: string | null },
  userId: string,
) {
  const orden = await prisma.ordenTrabajo.findUnique({ where: { id } })
  if (!orden) notFound('OT no encontrada')

  return prisma.$transaction(async (tx) => {
    const foto = await tx.fotoIngreso.create({
      data: {
        ordenId: id,
        url: dto.url,
        publicId: dto.publicId,
        creadoPorId: userId,
        ...(dto.tipoFotoId ? { tipoFotoId: dto.tipoFotoId } : {}),
      },
      include: { tipoFoto: { select: { id: true, nombre: true } } },
    })
    await tx.eventoOT.create({
      data: {
        ordenId: id,
        tipo: TipoEventoOT.FOTO_SUBIDA,
        descripcion: 'Foto de ingreso registrada',
        realizadoPorId: userId,
        metadata: { url: dto.url },
      },
    })
    return foto
  })
}

export async function deleteFoto(id: string, fotoId: string) {
  const foto = await prisma.fotoIngreso.findFirst({ where: { id: fotoId, ordenId: id } })
  if (!foto) notFound('Foto no encontrada')

  await prisma.fotoIngreso.delete({ where: { id: fotoId } })
  deleteImage(foto!.publicId).catch(() => null)
  return { deleted: true }
}

// ── Checklist de recepción ────────────────────────────────────────────────────

export async function saveChecklist(id: string, dto: SaveChecklistInput, userId: string) {
  const orden = await prisma.ordenTrabajo.findUnique({ where: { id } })
  if (!orden) notFound('OT no encontrada')
  if (orden!.faseActual !== FaseOT.LLEGADA_FOTOS) badRequest('La OT no está en fase de Llegada y Fotos')

  const existing = await prisma.checklistRecepcion.findUnique({ where: { ordenId: id } })
  if (existing?.aceptado !== null && existing?.aceptado !== undefined) {
    badRequest('El checklist ya fue respondido por el cliente y no puede modificarse')
  }

  return prisma.$transaction(async (tx) => {
    const checklist = await tx.checklistRecepcion.upsert({
      where: { ordenId: id },
      create: {
        ordenId: id,
        testigos: dto.testigos,
        testigoOtro: dto.testigoOtro,
        anormalidades: dto.anormalidades,
        anormalidadOtro: dto.anormalidadOtro,
        observacionesRecepcion: dto.observacionesRecepcion,
        observacionesAdicionales: dto.observacionesAdicionales,
      },
      update: {
        testigos: dto.testigos,
        testigoOtro: dto.testigoOtro,
        anormalidades: dto.anormalidades,
        anormalidadOtro: dto.anormalidadOtro,
        observacionesRecepcion: dto.observacionesRecepcion,
        observacionesAdicionales: dto.observacionesAdicionales,
      },
    })
    await tx.eventoOT.create({
      data: {
        ordenId: id,
        tipo: TipoEventoOT.CHECKLIST_GUARDADO,
        descripcion: 'Checklist de recepción registrado.',
        realizadoPorId: userId,
      },
    })
    return checklist
  })
}

export async function getWhatsappChecklist(id: string) {
  const orden = await prisma.ordenTrabajo.findUnique({
    where: { id },
    include: {
      cliente: true,
      marca: true,
      modelo: true,
      checklistRecepcion: { select: { tokenAprobacion: true } },
    },
  })
  if (!orden) notFound('OT no encontrada')
  if (!orden!.checklistRecepcion) badRequest('Guarda el checklist antes de enviarlo al cliente')

  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'
  const linkAceptacion = `${appUrl}/checklist/${orden!.checklistRecepcion!.tokenAprobacion}`

  const mensaje = `Hola ${orden!.cliente.nombre}, hemos recibido su ${orden!.marca.nombre} ${orden!.modelo.nombre} (placa ${orden!.placa}) en Kings Auto Diagnósticos. 🚗

Estas son las condiciones de recepción registradas (fotos, testigos del tablero y observaciones). Por favor revíselas y confírmenos su aprobación:
${linkAceptacion}

Gracias por confiar en nosotros.`

  const telefono = orden!.cliente.telefono.replace(/\D/g, '')
  const waLink = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`

  await prisma.eventoOT.create({
    data: {
      ordenId: id,
      tipo: TipoEventoOT.CHECKLIST_ENVIADO_WA,
      descripcion: 'Enlace del checklist de recepción generado para envío por WhatsApp.',
    },
  })

  return { waLink, linkAceptacion, mensaje }
}

export async function registrarAceptacionChecklist(id: string, dto: AceptacionChecklistInput, userId: string) {
  const chk = await prisma.checklistRecepcion.findUnique({ where: { ordenId: id } })
  if (!chk) notFound('Checklist no encontrado')
  if (chk!.aceptado !== null) badRequest('El checklist ya fue procesado anteriormente')

  return prisma.$transaction(async (tx) => {
    const updated = await tx.checklistRecepcion.update({
      where: { ordenId: id },
      data: {
        aceptado: dto.aceptado,
        fechaRespuesta: new Date(),
        comentarioCliente: dto.comentarioCliente,
      },
    })
    await tx.eventoOT.create({
      data: {
        ordenId: id,
        tipo: dto.aceptado ? TipoEventoOT.CHECKLIST_ACEPTADO : TipoEventoOT.CHECKLIST_RECHAZADO,
        descripcion: dto.aceptado
          ? 'Checklist de recepción aceptado por el cliente (registrado por el taller).'
          : `Checklist de recepción rechazado por el cliente.${dto.comentarioCliente ? ` Motivo: ${dto.comentarioCliente}` : ''}`,
        realizadoPorId: userId,
      },
    })
    return updated
  })
}

// ── Diagnóstico ───────────────────────────────────────────────────────────────

export async function saveDiagnostico(id: string, dto: SaveDiagnosticoInput, userId: string) {
  const orden = await prisma.ordenTrabajo.findUnique({ where: { id } })
  if (!orden) notFound('OT no encontrada')
  if (orden!.faseActual !== FaseOT.DIAGNOSTICO) badRequest('La OT no está en fase de Diagnóstico')

  const totales = dto.items.reduce(
    (acc, item) => {
      const sub = Number(item.cantidad) * Number(item.precioUnitario)
      if (item.tipo === 'MATERIAL') acc.materiales += sub
      else if (item.tipo === 'PARTE') acc.partes += sub
      else acc.manoObra += sub
      return acc
    },
    { materiales: 0, partes: 0, manoObra: 0 },
  )
  const subtotal = totales.materiales + totales.partes + totales.manoObra
  const aplicarISV = dto.aplicarISV ?? false
  const totalGeneral = aplicarISV ? parseFloat((subtotal * 1.15).toFixed(2)) : subtotal

  return prisma.$transaction(async (tx) => {
    const existing = await tx.diagnosticoCotizacion.findUnique({ where: { ordenId: id } })
    if (existing) {
      await tx.itemCotizacion.deleteMany({ where: { cotizacionId: existing.id } })
    }

    const diag = await tx.diagnosticoCotizacion.upsert({
      where: { ordenId: id },
      create: {
        ordenId: id,
        sintomaCliente: dto.sintomaCliente,
        diagnosticoTecnico: dto.diagnosticoTecnico,
        totalMateriales: totales.materiales,
        totalPartes: totales.partes,
        totalManoObra: totales.manoObra,
        aplicarISV,
        totalGeneral,
        aprobado: null,
      },
      update: {
        sintomaCliente: dto.sintomaCliente,
        diagnosticoTecnico: dto.diagnosticoTecnico,
        totalMateriales: totales.materiales,
        totalPartes: totales.partes,
        totalManoObra: totales.manoObra,
        aplicarISV,
        totalGeneral,
        aprobado: null,
        fechaAprobacion: null,
      },
      include: { items: true },
    })

    await tx.itemCotizacion.createMany({
      data: dto.items.map((item, i) => ({
        cotizacionId: diag.id,
        descripcion: item.descripcion,
        tipo: item.tipo,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: Number(item.cantidad) * Number(item.precioUnitario),
        posicion: item.posicion ?? i,
      })),
    })

    await tx.ordenTrabajo.update({
      where: { id },
      data: { estado: EstadoOT.EN_ESPERA_APROBACION },
    })

    await tx.eventoOT.create({
      data: {
        ordenId: id,
        tipo: existing ? TipoEventoOT.DIAGNOSTICO_REGISTRADO : TipoEventoOT.COTIZACION_GENERADA,
        descripcion: `Diagnóstico y cotización ${existing ? 'actualizados' : 'registrados'}. Total: L. ${totalGeneral.toFixed(2)}`,
        realizadoPorId: userId,
        metadata: {
          totalMateriales: totales.materiales,
          totalPartes: totales.partes,
          totalManoObra: totales.manoObra,
          totalGeneral,
        },
      },
    })

    return tx.diagnosticoCotizacion.findUnique({
      where: { id: diag.id },
      include: { items: { orderBy: { posicion: 'asc' } } },
    })
  })
}

export async function registrarAprobacion(id: string, dto: AprobacionInput, userId: string) {
  const diag = await prisma.diagnosticoCotizacion.findUnique({ where: { ordenId: id } })
  if (!diag) notFound('Diagnóstico no encontrado')
  if (diag!.aprobado !== null) badRequest('La cotización ya fue procesada anteriormente')

  const orden = await prisma.ordenTrabajo.findUnique({ where: { id } })
  if (!orden) notFound('OT no encontrada')

  return prisma.$transaction(async (tx) => {
    await tx.diagnosticoCotizacion.update({
      where: { ordenId: id },
      data: {
        aprobado: dto.aprobado,
        fechaAprobacion: new Date(),
        mensajeAprobacion: dto.mensajeAprobacion,
      },
    })

    if (dto.aprobado) {
      await tx.ordenTrabajo.update({
        where: { id },
        data: { faseActual: FaseOT.REPARACION, estado: EstadoOT.ACTIVA },
      })
      await tx.reparacion.upsert({
        where: { ordenId: id },
        create: { ordenId: id, tecnicoId: orden!.tecnicoId, iniciadaEn: new Date() },
        update: { iniciadaEn: new Date() },
      })
      await tx.eventoOT.create({
        data: {
          ordenId: id,
          tipo: TipoEventoOT.COTIZACION_APROBADA,
          descripcion: 'Cotización aprobada por el cliente. Reparación iniciada.',
          realizadoPorId: userId,
        },
      })
    } else {
      await tx.ordenTrabajo.update({
        where: { id },
        data: { estado: EstadoOT.RECHAZADA_COTIZACION },
      })
      await tx.eventoOT.create({
        data: {
          ordenId: id,
          tipo: TipoEventoOT.COTIZACION_RECHAZADA,
          descripcion: 'Cotización rechazada por el cliente.',
          realizadoPorId: userId,
          metadata: { mensaje: dto.mensajeAprobacion },
        },
      })
    }

    return tx.diagnosticoCotizacion.findUnique({
      where: { ordenId: id },
      include: { items: { orderBy: { posicion: 'asc' } } },
    })
  })
}

// ── Reparación ────────────────────────────────────────────────────────────────

export async function saveReparacion(id: string, dto: SaveReparacionInput, userId: string) {
  const orden = await prisma.ordenTrabajo.findUnique({ where: { id } })
  if (!orden) notFound('OT no encontrada')
  if (orden!.faseActual !== FaseOT.REPARACION) badRequest('La OT no está en fase de Reparación')

  if (dto.finalizada) {
    const pendiente = await prisma.cotizacionAdicional.findFirst({ where: { ordenId: id, aprobado: null } })
    if (pendiente) badRequest('Hay una cotización adicional pendiente de respuesta del cliente')
  }

  return prisma.$transaction(async (tx) => {
    const rep = await tx.reparacion.upsert({
      where: { ordenId: id },
      create: {
        ordenId: id,
        tecnicoId: orden!.tecnicoId,
        notas: dto.notas,
        iniciadaEn: new Date(),
        finalizadaEn: dto.finalizada ? new Date() : null,
      },
      update: {
        notas: dto.notas,
        ...(dto.finalizada ? { finalizadaEn: new Date() } : {}),
      },
    })

    if (dto.finalizada) {
      await tx.ordenTrabajo.update({ where: { id }, data: { faseActual: FaseOT.CONTROL_CALIDAD } })
      await tx.eventoOT.create({
        data: {
          ordenId: id,
          tipo: TipoEventoOT.REPARACION_FINALIZADA,
          descripcion: 'Reparación finalizada. Lista para Control de Calidad.',
          realizadoPorId: userId,
        },
      })
    }

    return rep
  })
}

// ── Control de Calidad ────────────────────────────────────────────────────────

export async function registrarCC(id: string, dto: CreateCCInput, userId: string) {
  if (!dto.aprobado && !dto.observaciones) badRequest('Las observaciones son requeridas al rechazar')

  const orden = await prisma.ordenTrabajo.findUnique({ where: { id } })
  if (!orden) notFound('OT no encontrada')
  if (orden!.faseActual !== FaseOT.CONTROL_CALIDAD) badRequest('La OT no está en fase de Control de Calidad')

  return prisma.$transaction(async (tx) => {
    const cc = await tx.controlCalidad.create({
      data: { ordenId: id, aprobado: dto.aprobado, observaciones: dto.observaciones, revisadoPorId: userId },
    })

    if (dto.aprobado) {
      await tx.ordenTrabajo.update({ where: { id }, data: { faseActual: FaseOT.ENTREGA } })
      await tx.entrega.upsert({
        where: { ordenId: id },
        create: { ordenId: id, registradoPorId: userId },
        update: {},
      })
      await tx.eventoOT.create({
        data: {
          ordenId: id,
          tipo: TipoEventoOT.CC_APROBADO,
          descripcion: 'Control de calidad aprobado. Vehículo listo para entrega.',
          realizadoPorId: userId,
        },
      })
    } else {
      await tx.ordenTrabajo.update({ where: { id }, data: { faseActual: FaseOT.REPARACION } })
      await tx.eventoOT.create({
        data: {
          ordenId: id,
          tipo: TipoEventoOT.CC_RECHAZADO,
          descripcion: `Control de calidad rechazado — regresa a Reparación. Motivo: ${dto.observaciones}`,
          realizadoPorId: userId,
          metadata: { observaciones: dto.observaciones },
        },
      })
    }

    return cc
  })
}

// ── Entrega ───────────────────────────────────────────────────────────────────

export async function registrarEntrega(id: string, dto: RegistrarEntregaInput, userId: string) {
  const orden = await prisma.ordenTrabajo.findUnique({ where: { id } })
  if (!orden) notFound('OT no encontrada')
  if (orden!.faseActual !== FaseOT.ENTREGA) badRequest('La OT no está en fase de Entrega')

  const entregadoEn = dto.entregadoEn ? new Date(dto.entregadoEn) : new Date()

  return prisma.$transaction(async (tx) => {
    await tx.entrega.update({ where: { ordenId: id }, data: { entregadoEn, registradoPorId: userId } })
    await tx.ordenTrabajo.update({
      where: { id },
      data: { faseActual: FaseOT.COMPLETADA, estado: EstadoOT.COMPLETADA },
    })
    await tx.encuestaSatisfaccion.upsert({
      where: { ordenId: id },
      create: { ordenId: id },
      update: {},
    })
    await tx.eventoOT.create({
      data: {
        ordenId: id,
        tipo: TipoEventoOT.VEHICULO_ENTREGADO,
        descripcion: 'Vehículo entregado al cliente. OT completada.',
        realizadoPorId: userId,
      },
    })
    return tx.ordenTrabajo.findUnique({ where: { id } })
  })
}

// ── Nota interna ──────────────────────────────────────────────────────────────

export async function agregarNota(id: string, texto: string, userId: string) {
  const orden = await prisma.ordenTrabajo.findUnique({ where: { id } })
  if (!orden) notFound('OT no encontrada')

  return prisma.eventoOT.create({
    data: { ordenId: id, tipo: TipoEventoOT.NOTA_INTERNA, descripcion: texto, realizadoPorId: userId },
  })
}

// ── Eventos ───────────────────────────────────────────────────────────────────

export async function getEventos(id: string) {
  return prisma.eventoOT.findMany({
    where: { ordenId: id },
    orderBy: { createdAt: 'asc' },
    include: { realizadoPor: { select: { id: true, nombre: true } } },
  })
}

// ── WhatsApp cotización ───────────────────────────────────────────────────────

export async function getWhatsappCotizacion(id: string) {
  const orden = await prisma.ordenTrabajo.findUnique({
    where: { id },
    include: {
      cliente: true,
      marca: true,
      modelo: true,
      diagnostico: { select: { tokenAprobacion: true, totalGeneral: true } },
    },
  })
  if (!orden) notFound('OT no encontrada')
  if (!orden!.diagnostico) badRequest('La OT no tiene diagnóstico registrado')

  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'
  const linkAprobacion = `${appUrl}/cotizacion/${orden!.diagnostico!.tokenAprobacion}`
  const total = Number(orden!.diagnostico!.totalGeneral).toLocaleString('es-HN', { minimumFractionDigits: 2 })

  const plantilla = await prisma.plantillaMensaje.findFirst({ where: { tipo: 'COTIZACION_LISTA' } })

  let mensaje: string
  if (plantilla) {
    mensaje = plantilla.contenido
      .replace('{{nombre_cliente}}', orden!.cliente.nombre)
      .replace('{{marca}}', orden!.marca.nombre)
      .replace('{{modelo}}', orden!.modelo.nombre)
      .replace('{{total_cotizacion}}', total)
  } else {
    mensaje = `Hola ${orden!.cliente.nombre}, hemos terminado el diagnóstico de su ${orden!.marca.nombre} ${orden!.modelo.nombre} (placa ${orden!.placa}). El costo estimado es L. ${total}. Puede aprobar o rechazar la cotización aquí: ${linkAprobacion}`
  }

  if (!mensaje.includes(linkAprobacion)) {
    mensaje += `\n\n👉 Ver y aprobar cotización: ${linkAprobacion}`
  }

  const telefono = orden!.cliente.telefono.replace(/\D/g, '')
  const waLink = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`

  await prisma.eventoOT.create({
    data: {
      ordenId: id,
      tipo: TipoEventoOT.COTIZACION_ENVIADA_WA,
      descripcion: 'Enlace de cotización generado para envío por WhatsApp.',
    },
  })

  return { waLink, linkAprobacion, mensaje }
}

// ── Cotización adicional (partes/servicios no previstos en Reparación) ────────
// No toca DiagnosticoCotizacion — es un addendum aparte con su propio link de
// aprobación. Se aprueba/rechaza como paquete completo, no por ítem.

export async function crearCotizacionAdicional(id: string, dto: CrearCotizacionAdicionalInput, userId: string) {
  const orden = await prisma.ordenTrabajo.findUnique({ where: { id } })
  if (!orden) notFound('OT no encontrada')
  if (orden!.faseActual !== FaseOT.REPARACION) {
    badRequest('Solo se puede agregar una cotización adicional durante la fase de Reparación')
  }

  const totales = dto.items.reduce(
    (acc, item) => {
      const sub = Number(item.cantidad) * Number(item.precioUnitario)
      if (item.tipo === 'MATERIAL') acc.materiales += sub
      else if (item.tipo === 'PARTE') acc.partes += sub
      else acc.manoObra += sub
      return acc
    },
    { materiales: 0, partes: 0, manoObra: 0 },
  )
  const totalGeneral = totales.materiales + totales.partes + totales.manoObra

  return prisma.$transaction(async (tx) => {
    const cot = await tx.cotizacionAdicional.create({
      data: {
        ordenId: id,
        motivo: dto.motivo,
        totalMateriales: totales.materiales,
        totalPartes: totales.partes,
        totalManoObra: totales.manoObra,
        totalGeneral,
        creadoPorId: userId,
        items: {
          create: dto.items.map((item, i) => ({
            descripcion: item.descripcion,
            tipo: item.tipo,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: Number(item.cantidad) * Number(item.precioUnitario),
            posicion: item.posicion ?? i,
          })),
        },
      },
      include: { items: { orderBy: { posicion: 'asc' } } },
    })

    await tx.eventoOT.create({
      data: {
        ordenId: id,
        tipo: TipoEventoOT.COTIZACION_ADICIONAL_GENERADA,
        descripcion: `Cotización adicional registrada. Total: L. ${totalGeneral.toFixed(2)}. Motivo: ${dto.motivo}`,
        realizadoPorId: userId,
      },
    })

    return cot
  })
}

export async function getWhatsappCotizacionAdicional(id: string, cotizacionAdicionalId: string) {
  const cot = await prisma.cotizacionAdicional.findUnique({
    where: { id: cotizacionAdicionalId },
    include: { orden: { include: { cliente: true, marca: true, modelo: true } } },
  })
  if (!cot) notFound('Cotización adicional no encontrada')
  if (cot!.ordenId !== id) notFound('Cotización adicional no encontrada')

  const orden = cot!.orden
  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'
  const linkAprobacion = `${appUrl}/cotizacion-adicional/${cot!.tokenAprobacion}`
  const total = Number(cot!.totalGeneral).toLocaleString('es-HN', { minimumFractionDigits: 2 })

  const mensaje = `Hola ${orden.cliente.nombre}, al reparar su ${orden.marca.nombre} ${orden.modelo.nombre} (placa ${orden.placa}) encontramos que hace falta lo siguiente, no incluido en la cotización original: ${cot!.motivo}. Costo adicional: L. ${total}. Puede aprobar o rechazar aquí: ${linkAprobacion}`

  const telefono = orden.cliente.telefono.replace(/\D/g, '')
  const waLink = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`

  await prisma.eventoOT.create({
    data: {
      ordenId: id,
      tipo: TipoEventoOT.COTIZACION_ADICIONAL_ENVIADA_WA,
      descripcion: 'Enlace de cotización adicional generado para envío por WhatsApp.',
    },
  })

  return { waLink, linkAprobacion, mensaje }
}

// Registro manual (staff), ej. el cliente respondió por llamada o WhatsApp de texto.
export async function registrarRespuestaCotizacionAdicional(
  id: string,
  cotizacionAdicionalId: string,
  dto: ResponderCotizacionAdicionalInput,
  userId: string,
) {
  const cot = await prisma.cotizacionAdicional.findUnique({ where: { id: cotizacionAdicionalId } })
  if (!cot) notFound('Cotización adicional no encontrada')
  if (cot!.ordenId !== id) notFound('Cotización adicional no encontrada')
  if (cot!.aprobado !== null) badRequest('Esta cotización adicional ya fue procesada')

  return prisma.$transaction(async (tx) => {
    const updated = await tx.cotizacionAdicional.update({
      where: { id: cotizacionAdicionalId },
      data: { aprobado: dto.aprobado, fechaAprobacion: new Date(), mensajeAprobacion: dto.mensaje },
    })

    await tx.eventoOT.create({
      data: {
        ordenId: id,
        tipo: dto.aprobado ? TipoEventoOT.COTIZACION_ADICIONAL_APROBADA : TipoEventoOT.COTIZACION_ADICIONAL_RECHAZADA,
        descripcion: dto.aprobado
          ? `Cotización adicional aprobada por el cliente (registrado por el taller). Total: L. ${Number(cot!.totalGeneral).toFixed(2)}`
          : `Cotización adicional rechazada por el cliente (registrado por el taller).${dto.mensaje ? ` Motivo: ${dto.mensaje}` : ''}`,
        realizadoPorId: userId,
      },
    })

    return updated
  })
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export async function getDashboardStats(opts?: { userId?: string; rol?: string }) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const manana = new Date(hoy)
  manana.setDate(hoy.getDate() + 1)

  // Semana calendario (lunes → domingo)
  const diasDesdeLunes = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1
  const lunes = new Date(hoy); lunes.setDate(hoy.getDate() - diasDesdeLunes)
  const domingo = new Date(lunes); domingo.setDate(lunes.getDate() + 7)

  // Inicio del mes actual
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

  const [totalActivas, enEsperaAprobacion, completadasHoy, citasSemana, porFase, config] = await Promise.all([
    prisma.ordenTrabajo.count({ where: { estado: { in: [EstadoOT.ACTIVA, EstadoOT.EN_ESPERA_APROBACION] } } }),
    prisma.ordenTrabajo.count({ where: { estado: EstadoOT.EN_ESPERA_APROBACION } }),
    prisma.ordenTrabajo.count({ where: { estado: EstadoOT.COMPLETADA, updatedAt: { gte: hoy, lt: manana } } }),
    prisma.cita.count({ where: { fecha: { gte: lunes, lt: domingo }, estado: { notIn: [EstadoCita.CANCELADA, EstadoCita.CONVERTIDA] } } }),
    prisma.ordenTrabajo.groupBy({
      by: ['faseActual'],
      where: { estado: { in: [EstadoOT.ACTIVA, EstadoOT.EN_ESPERA_APROBACION] } },
      _count: true,
    }),
    prisma.configuracionTaller.findFirst({ select: { comisionTecnicoPct: true } }),
  ])

  const comisionPct = config?.comisionTecnicoPct ?? 8

  // Comisión del mes (calculada sobre mano de obra de OTs completadas este mes)
  let comisionMes: number | null = null
  if (opts?.userId && opts.rol === RolUsuario.EMPLEADO) {
    const agg = await prisma.diagnosticoCotizacion.aggregate({
      where: {
        orden: {
          estado: EstadoOT.COMPLETADA,
          tecnicoId: opts.userId,
          updatedAt: { gte: inicioMes },
        },
      },
      _sum: { totalManoObra: true },
    })
    comisionMes = +(Number(agg._sum.totalManoObra ?? 0) * comisionPct / 100).toFixed(2)
  } else if (opts?.rol === RolUsuario.ADMIN) {
    const agg = await prisma.diagnosticoCotizacion.aggregate({
      where: {
        orden: {
          estado: EstadoOT.COMPLETADA,
          updatedAt: { gte: inicioMes },
        },
      },
      _sum: { totalManoObra: true },
    })
    comisionMes = +(Number(agg._sum.totalManoObra ?? 0) * comisionPct / 100).toFixed(2)
  }

  return {
    totalActivas,
    enEsperaAprobacion,
    completadasHoy,
    citasHoy: citasSemana,
    porFase: Object.fromEntries(porFase.map((f) => [f.faseActual, f._count])),
    comisionMes,
    comisionPct,
  }
}

export { RolUsuario }

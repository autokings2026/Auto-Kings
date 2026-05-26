import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CloudinaryService } from '../cloudinary/cloudinary.service'
import {
  EstadoCita,
  EstadoOT,
  FaseOT,
  TipoEventoOT,
  LABEL_FASE,
  ORDEN_FASES,
} from '@kings/shared'
import { CreateOrdenDto } from './dto/create-orden.dto'
import { QueryOrdenesDto } from './dto/query-ordenes.dto'
import {
  AddFotoDto,
  AprobacionCotizacionDto,
  CreateCCDto,
  NotaInternaDto,
  RegistrarEntregaDto,
  SaveDiagnosticoDto,
  SaveReparacionDto,
} from './dto/fase-dtos'

@Injectable()
export class OrdenesService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  // ── Número único ──────────────────────────────────────────────────────────

  private async generarNumero(): Promise<string> {
    const year = new Date().getFullYear()
    const count = await this.prisma.ordenTrabajo.count({
      where: { createdAt: { gte: new Date(`${year}-01-01T00:00:00`) } },
    })
    return `OT-${year}-${String(count + 1).padStart(4, '0')}`
  }

  // ── Crear OT ──────────────────────────────────────────────────────────────

  async create(dto: CreateOrdenDto, userId: string) {
    let clienteId: string
    let marcaId: string
    let modeloId: string
    let anio: number
    let placa: string
    let citaId: string | undefined

    if (dto.citaId) {
      const cita = await this.prisma.cita.findUnique({
        where: { id: dto.citaId },
        include: { ordenTrabajo: true },
      })
      if (!cita) throw new BadRequestException('Cita no encontrada')
      if (cita.estado === EstadoCita.CANCELADA)
        throw new BadRequestException('La cita está cancelada')
      if (cita.ordenTrabajo)
        throw new BadRequestException('La cita ya tiene una OT asignada')

      clienteId = cita.clienteId
      marcaId = cita.marcaId
      modeloId = cita.modeloId
      anio = cita.anio
      placa = cita.placa
      citaId = cita.id
    } else {
      if (!dto.clienteId || !dto.marcaId || !dto.modeloId || !dto.anio || !dto.placa) {
        throw new BadRequestException(
          'Para una OT directa se requiere: clienteId, marcaId, modeloId, anio, placa',
        )
      }
      clienteId = dto.clienteId
      marcaId = dto.marcaId
      modeloId = dto.modeloId
      anio = dto.anio
      placa = dto.placa
    }

    const numero = await this.generarNumero()

    return this.prisma.$transaction(async (tx) => {
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
          combustible: dto.combustible,
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
        await tx.cita.update({
          where: { id: citaId },
          data: { estado: EstadoCita.CONVERTIDA },
        })
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
  }

  // ── Listar ────────────────────────────────────────────────────────────────

  async findAll(query: QueryOrdenesDto) {
    const { fase, estado, search, tecnicoId, page = 1, pageSize = 20 } = query

    const where: Record<string, unknown> = {}
    if (fase) where['faseActual'] = fase
    if (estado) where['estado'] = estado
    if (tecnicoId) where['tecnicoId'] = tecnicoId
    if (search) {
      where['OR'] = [
        { numero: { contains: search, mode: 'insensitive' } },
        { placa: { contains: search, mode: 'insensitive' } },
        { cliente: { nombre: { contains: search, mode: 'insensitive' } } },
        { cliente: { telefono: { contains: search } } },
      ]
    }

    const [ordenes, total] = await Promise.all([
      this.prisma.ordenTrabajo.findMany({
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
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.ordenTrabajo.count({ where }),
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
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  // ── Detalle ───────────────────────────────────────────────────────────────

  async findOne(id: string) {
    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        cliente: true,
        tecnico: { select: { id: true, nombre: true, email: true, rol: true } },
        marca: true,
        modelo: true,
        cita: { select: { id: true, fecha: true, hora: true } },
        fotos: { orderBy: { createdAt: 'asc' } },
        diagnostico: { include: { items: { orderBy: { posicion: 'asc' } } } },
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
    if (!orden) throw new NotFoundException('OT no encontrada')
    return orden
  }

  // ── Avanzar fase (genérico) ───────────────────────────────────────────────

  async avanzarFase(id: string, userId: string) {
    const orden = await this.prisma.ordenTrabajo.findUnique({ where: { id } })
    if (!orden) throw new NotFoundException('OT no encontrada')
    if (orden.estado === EstadoOT.CANCELADA)
      throw new BadRequestException('La OT está cancelada')
    if (orden.faseActual === FaseOT.COMPLETADA)
      throw new BadRequestException('La OT ya está completada')

    const idx = ORDEN_FASES.indexOf(orden.faseActual as FaseOT)
    const siguienteFase = ORDEN_FASES[idx + 1]
    if (!siguienteFase) throw new BadRequestException('No hay siguiente fase')

    // Validaciones por fase actual
    if (orden.faseActual === FaseOT.DIAGNOSTICO) {
      const diag = await this.prisma.diagnosticoCotizacion.findUnique({
        where: { ordenId: id },
      })
      if (!diag) throw new BadRequestException('Registra el diagnóstico antes de avanzar')
      if (diag.aprobado === null)
        throw new BadRequestException('La cotización está pendiente de aprobación del cliente')
      if (diag.aprobado === false)
        throw new BadRequestException('La cotización fue rechazada')
    }

    if (orden.faseActual === FaseOT.REPARACION) {
      const rep = await this.prisma.reparacion.findUnique({ where: { ordenId: id } })
      if (!rep?.finalizadaEn)
        throw new BadRequestException('Finaliza la reparación antes de avanzar a Control de Calidad')
    }

    const nuevoEstado =
      siguienteFase === FaseOT.COMPLETADA ? EstadoOT.COMPLETADA : orden.estado

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.ordenTrabajo.update({
        where: { id },
        data: { faseActual: siguienteFase, estado: nuevoEstado },
      })

      await tx.eventoOT.create({
        data: {
          ordenId: id,
          tipo: TipoEventoOT.CAMBIO_FASE,
          descripcion: `Fase: ${LABEL_FASE[orden.faseActual]} → ${LABEL_FASE[siguienteFase]}`,
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

  // ── Fase 1: Fotos ──────────────────────────────────────────────────────────

  async addFoto(id: string, dto: AddFotoDto, userId: string) {
    const orden = await this.prisma.ordenTrabajo.findUnique({ where: { id } })
    if (!orden) throw new NotFoundException('OT no encontrada')

    const foto = await this.prisma.$transaction(async (tx) => {
      const f = await tx.fotoIngreso.create({
        data: { ordenId: id, url: dto.url, publicId: dto.publicId, creadoPorId: userId },
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
      return f
    })

    return foto
  }

  async deleteFoto(id: string, fotoId: string) {
    const foto = await this.prisma.fotoIngreso.findFirst({
      where: { id: fotoId, ordenId: id },
    })
    if (!foto) throw new NotFoundException('Foto no encontrada')
    await this.prisma.fotoIngreso.delete({ where: { id: fotoId } })
    // Borrar de Cloudinary en background (no bloquea la respuesta)
    this.cloudinary.deleteImage(foto.publicId).catch(() => null)
    return { deleted: true }
  }

  // ── Fase 2: Diagnóstico + Cotización ──────────────────────────────────────

  async saveDiagnostico(id: string, dto: SaveDiagnosticoDto, userId: string) {
    const orden = await this.prisma.ordenTrabajo.findUnique({ where: { id } })
    if (!orden) throw new NotFoundException('OT no encontrada')
    if (orden.faseActual !== FaseOT.DIAGNOSTICO)
      throw new BadRequestException('La OT no está en fase de Diagnóstico')

    const totales = dto.items.reduce(
      (acc, item) => {
        const sub = Number(item.cantidad) * Number(item.precioUnitario)
        if (item.tipo === 'MATERIAL') acc.materiales += sub
        else acc.manoObra += sub
        return acc
      },
      { materiales: 0, manoObra: 0 },
    )
    const totalGeneral = totales.materiales + totales.manoObra

    return this.prisma.$transaction(async (tx) => {
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
          totalManoObra: totales.manoObra,
          totalGeneral,
          aprobado: null,
        },
        update: {
          sintomaCliente: dto.sintomaCliente,
          diagnosticoTecnico: dto.diagnosticoTecnico,
          totalMateriales: totales.materiales,
          totalManoObra: totales.manoObra,
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
          tipo: existing
            ? TipoEventoOT.DIAGNOSTICO_REGISTRADO
            : TipoEventoOT.COTIZACION_GENERADA,
          descripcion: `Diagnóstico y cotización ${existing ? 'actualizados' : 'registrados'}. Total: L. ${totalGeneral.toFixed(2)}`,
          realizadoPorId: userId,
          metadata: {
            totalMateriales: totales.materiales,
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

  async registrarAprobacion(id: string, dto: AprobacionCotizacionDto, userId: string) {
    const diag = await this.prisma.diagnosticoCotizacion.findUnique({ where: { ordenId: id } })
    if (!diag) throw new NotFoundException('Diagnóstico no encontrado')
    if (diag.aprobado !== null)
      throw new BadRequestException('La cotización ya fue procesada anteriormente')

    const orden = await this.prisma.ordenTrabajo.findUnique({ where: { id } })
    if (!orden) throw new NotFoundException('OT no encontrada')

    return this.prisma.$transaction(async (tx) => {
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
          create: { ordenId: id, tecnicoId: orden.tecnicoId, iniciadaEn: new Date() },
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

  // ── Fase 3: Reparación ────────────────────────────────────────────────────

  async saveReparacion(id: string, dto: SaveReparacionDto, userId: string) {
    const orden = await this.prisma.ordenTrabajo.findUnique({ where: { id } })
    if (!orden) throw new NotFoundException('OT no encontrada')
    if (orden.faseActual !== FaseOT.REPARACION)
      throw new BadRequestException('La OT no está en fase de Reparación')

    return this.prisma.$transaction(async (tx) => {
      const rep = await tx.reparacion.upsert({
        where: { ordenId: id },
        create: {
          ordenId: id,
          tecnicoId: orden.tecnicoId,
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
        await tx.ordenTrabajo.update({
          where: { id },
          data: { faseActual: FaseOT.CONTROL_CALIDAD },
        })

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

  // ── Fase 4: Control de Calidad ────────────────────────────────────────────

  async registrarCC(id: string, dto: CreateCCDto, userId: string) {
    if (!dto.aprobado && !dto.observaciones)
      throw new BadRequestException('Las observaciones son requeridas al rechazar')

    const orden = await this.prisma.ordenTrabajo.findUnique({ where: { id } })
    if (!orden) throw new NotFoundException('OT no encontrada')
    if (orden.faseActual !== FaseOT.CONTROL_CALIDAD)
      throw new BadRequestException('La OT no está en fase de Control de Calidad')

    return this.prisma.$transaction(async (tx) => {
      const cc = await tx.controlCalidad.create({
        data: {
          ordenId: id,
          aprobado: dto.aprobado,
          observaciones: dto.observaciones,
          revisadoPorId: userId,
        },
      })

      if (dto.aprobado) {
        await tx.ordenTrabajo.update({
          where: { id },
          data: { faseActual: FaseOT.ENTREGA },
        })

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
        await tx.ordenTrabajo.update({
          where: { id },
          data: { faseActual: FaseOT.REPARACION },
        })

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

  // ── Fase 5: Entrega ───────────────────────────────────────────────────────

  async registrarEntrega(id: string, dto: RegistrarEntregaDto, userId: string) {
    const orden = await this.prisma.ordenTrabajo.findUnique({ where: { id } })
    if (!orden) throw new NotFoundException('OT no encontrada')
    if (orden.faseActual !== FaseOT.ENTREGA)
      throw new BadRequestException('La OT no está en fase de Entrega')

    const entregadoEn = dto.entregadoEn ? new Date(dto.entregadoEn) : new Date()

    return this.prisma.$transaction(async (tx) => {
      await tx.entrega.update({
        where: { ordenId: id },
        data: { entregadoEn, registradoPorId: userId },
      })

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

  // ── Nota interna ──────────────────────────────────────────────────────────

  async agregarNota(id: string, dto: NotaInternaDto, userId: string) {
    const orden = await this.prisma.ordenTrabajo.findUnique({ where: { id } })
    if (!orden) throw new NotFoundException('OT no encontrada')

    return this.prisma.eventoOT.create({
      data: {
        ordenId: id,
        tipo: TipoEventoOT.NOTA_INTERNA,
        descripcion: dto.texto,
        realizadoPorId: userId,
      },
    })
  }

  // ── WhatsApp cotización ───────────────────────────────────────────────────

  async getWhatsappCotizacion(id: string) {
    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        cliente: true,
        marca: true,
        modelo: true,
        diagnostico: { select: { tokenAprobacion: true, totalGeneral: true } },
      },
    })
    if (!orden) throw new NotFoundException('OT no encontrada')
    if (!orden.diagnostico) throw new BadRequestException('La OT no tiene diagnóstico registrado')

    const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'
    const linkAprobacion = `${appUrl}/cotizacion/${orden.diagnostico.tokenAprobacion}`
    const total = Number(orden.diagnostico.totalGeneral).toLocaleString('es-HN', { minimumFractionDigits: 2 })

    const plantilla = await this.prisma.plantillaMensaje.findFirst({
      where: { tipo: 'COTIZACION_LISTA' },
    })

    let mensaje: string
    if (plantilla) {
      mensaje = plantilla.contenido
        .replace('{{nombre_cliente}}', orden.cliente.nombre)
        .replace('{{marca}}', orden.marca.nombre)
        .replace('{{modelo}}', orden.modelo.nombre)
        .replace('{{total_cotizacion}}', total)
    } else {
      mensaje = `Hola ${orden.cliente.nombre}, hemos terminado el diagnóstico de su ${orden.marca.nombre} ${orden.modelo.nombre} (placa ${orden.placa}). El costo estimado es L. ${total}. Puede aprobar o rechazar la cotización aquí: ${linkAprobacion}`
    }

    // Si la plantilla no incluye el link, lo añadimos al final
    if (!mensaje.includes(linkAprobacion)) {
      mensaje += `\n\n👉 Ver y aprobar cotización: ${linkAprobacion}`
    }

    const telefono = orden.cliente.telefono.replace(/\D/g, '')
    const waLink = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`

    await this.prisma.eventoOT.create({
      data: {
        ordenId: id,
        tipo: TipoEventoOT.COTIZACION_ENVIADA_WA,
        descripcion: 'Enlace de cotización generado para envío por WhatsApp.',
      },
    })

    return { waLink, linkAprobacion, mensaje }
  }

  // ── Eventos ───────────────────────────────────────────────────────────────

  async getEventos(id: string) {
    return this.prisma.eventoOT.findMany({
      where: { ordenId: id },
      orderBy: { createdAt: 'asc' },
      include: { realizadoPor: { select: { id: true, nombre: true } } },
    })
  }

  // ── Stats para dashboard ──────────────────────────────────────────────────

  async getDashboardStats() {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const manana = new Date(hoy)
    manana.setDate(hoy.getDate() + 1)

    const [
      totalActivas,
      enEsperaAprobacion,
      completadasHoy,
      citasHoy,
      porFase,
    ] = await Promise.all([
      this.prisma.ordenTrabajo.count({
        where: { estado: { in: [EstadoOT.ACTIVA, EstadoOT.EN_ESPERA_APROBACION] } },
      }),
      this.prisma.ordenTrabajo.count({
        where: { estado: EstadoOT.EN_ESPERA_APROBACION },
      }),
      this.prisma.ordenTrabajo.count({
        where: {
          estado: EstadoOT.COMPLETADA,
          updatedAt: { gte: hoy, lt: manana },
        },
      }),
      this.prisma.cita.count({
        where: {
          fecha: hoy,
          estado: { notIn: [EstadoCita.CANCELADA, EstadoCita.CONVERTIDA] },
        },
      }),
      this.prisma.ordenTrabajo.groupBy({
        by: ['faseActual'],
        where: { estado: { in: [EstadoOT.ACTIVA, EstadoOT.EN_ESPERA_APROBACION] } },
        _count: true,
      }),
    ])

    return {
      totalActivas,
      enEsperaAprobacion,
      completadasHoy,
      citasHoy,
      porFase: Object.fromEntries(porFase.map((f) => [f.faseActual, f._count])),
    }
  }
}

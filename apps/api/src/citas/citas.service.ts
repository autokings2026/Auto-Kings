import {
  BadRequestException,
  Injectable,
} from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../prisma/prisma.service'
import { ClientesService } from '../clientes/clientes.service'
import { EmailService } from '../email/email.service'
import { CreateCitaDto } from './dto/create-cita.dto'
import { QueryCitasDto } from './dto/query-citas.dto'
import { EstadoCita } from '@kings/shared'
import type { HorarioDia } from '@kings/shared'

@Injectable()
export class CitasService {
  constructor(
    private prisma: PrismaService,
    private clientesService: ClientesService,
    private emailService: EmailService,
  ) {}

  // ── Slots disponibles ──────────────────────────────────────────────────────

  async getSlotsDisponibles(fecha: string) {
    const config = await this.prisma.configuracionTaller.findFirst()
    const horarios = (config?.horariosAtencion ?? []) as unknown as HorarioDia[]

    // getDay(): 0=Dom,1=Lun,...,6=Sáb — se parsea en UTC+noon para evitar offsets
    const dia = new Date(`${fecha}T12:00:00`).getDay()
    const horarioDia = horarios.find((h) => h.dia === dia)

    if (!horarioDia?.activo) return []

    const slots = this.generarSlots(
      horarioDia.apertura,
      horarioDia.cierre,
      config?.duracionSlotMinutos ?? 60,
    )

    const fechaDate = new Date(`${fecha}T00:00:00`)
    const citasDelDia = await this.prisma.cita.findMany({
      where: {
        fecha: fechaDate,
        estado: { notIn: [EstadoCita.CANCELADA] },
      },
      select: { hora: true },
    })

    const maxPorSlot = config?.maxCitasPorSlot ?? 3

    return slots.map((hora) => {
      const ocupadas = citasDelDia.filter((c) => c.hora === hora).length
      return {
        hora,
        disponible: ocupadas < maxPorSlot,
        citasActuales: ocupadas,
        maxCitas: maxPorSlot,
      }
    })
  }

  private generarSlots(apertura: string, cierre: string, duracionMin: number): string[] {
    const slots: string[] = []
    const [aH, aM] = apertura.split(':').map(Number)
    const [cH, cM] = cierre.split(':').map(Number)
    let minutos = (aH ?? 8) * 60 + (aM ?? 0)
    const fin = (cH ?? 18) * 60 + (cM ?? 0)

    while (minutos < fin) {
      const h = String(Math.floor(minutos / 60)).padStart(2, '0')
      const m = String(minutos % 60).padStart(2, '0')
      slots.push(`${h}:${m}`)
      minutos += duracionMin
    }
    return slots
  }

  // ── Crear cita (endpoint público) ─────────────────────────────────────────

  async create(dto: CreateCitaDto) {
    // 1. Validar disponibilidad
    const slots = await this.getSlotsDisponibles(dto.fecha)
    const slot = slots.find((s) => s.hora === dto.hora)

    if (!slot) {
      throw new BadRequestException('El horario seleccionado no está disponible ese día')
    }
    if (!slot.disponible) {
      throw new BadRequestException(
        `El slot ${dto.hora} del ${dto.fecha} está completo (${slot.citasActuales}/${slot.maxCitas})`,
      )
    }

    // 2. Validar que marcaId y modeloId existen
    const [marca, modelo] = await Promise.all([
      this.prisma.marca.findUnique({ where: { id: dto.marcaId } }),
      this.prisma.modelo.findUnique({ where: { id: dto.modeloId } }),
    ])
    if (!marca) throw new BadRequestException('Marca no encontrada')
    if (!modelo) throw new BadRequestException('Modelo no encontrado')

    // 3. Find or create cliente
    const cliente = await this.clientesService.findOrCreate({
      nombre: dto.nombre,
      telefono: dto.telefono,
      email: dto.email,
    })

    // 4. Crear la cita
    const cita = await this.prisma.cita.create({
      data: {
        clienteId: cliente.id,
        marcaId: dto.marcaId,
        modeloId: dto.modeloId,
        anio: dto.anio,
        placa: dto.placa.toUpperCase(),
        fecha: new Date(`${dto.fecha}T00:00:00`),
        hora: dto.hora,
        comentarios: dto.comentarios,
      },
      include: { cliente: true, marca: true, modelo: true },
    })

    // 5. Enviar email de confirmación (sin bloquear la respuesta)
    if (cliente.email) {
      const config = await this.prisma.configuracionTaller.findFirst()
      const fechaFormateada = this.formatFecha(cita.fecha)
      const horaFormateada = this.formatHora(cita.hora)

      this.emailService
        .sendConfirmacionCita({
          to: cliente.email,
          nombre: cliente.nombre,
          fecha: fechaFormateada,
          hora: horaFormateada,
          marca: marca.nombre,
          modelo: modelo.nombre,
          anio: cita.anio,
          placa: cita.placa,
          telefonoTaller: config?.telefono ?? '',
        })
        .then(() =>
          this.prisma.cita.update({
            where: { id: cita.id },
            data: { emailEnviado: true },
          }),
        )
        .catch(() => null)
    }

    return {
      id: cita.id,
      mensaje: 'Cita registrada exitosamente',
      detalle: {
        nombre: cliente.nombre,
        fecha: this.formatFecha(cita.fecha),
        hora: this.formatHora(cita.hora),
        vehiculo: `${marca.nombre} ${modelo.nombre} ${cita.anio}`,
        placa: cita.placa,
      },
    }
  }

  // ── Listar citas (endpoint interno) ───────────────────────────────────────

  async findAll(query: QueryCitasDto) {
    const { rango = 'todas', search, estado, page = 1, pageSize = 20 } = query

    const where: Record<string, unknown> = {}

    if (rango !== 'todas') {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)

      if (rango === 'hoy') {
        const manana = new Date(hoy)
        manana.setDate(hoy.getDate() + 1)
        where['fecha'] = { gte: hoy, lt: manana }
      } else if (rango === 'semana') {
        const fin = new Date(hoy)
        fin.setDate(hoy.getDate() + 7)
        where['fecha'] = { gte: hoy, lt: fin }
      } else if (rango === 'mes') {
        const fin = new Date(hoy)
        fin.setMonth(hoy.getMonth() + 1)
        where['fecha'] = { gte: hoy, lt: fin }
      }
    }

    if (estado) where['estado'] = estado

    if (search) {
      where['OR'] = [
        { cliente: { nombre: { contains: search, mode: 'insensitive' } } },
        { placa: { contains: search, mode: 'insensitive' } },
        { cliente: { telefono: { contains: search } } },
      ]
    }

    const [citas, total] = await Promise.all([
      this.prisma.cita.findMany({
        where,
        include: { cliente: true, marca: true, modelo: true, ordenTrabajo: { select: { id: true, numero: true } } },
        orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.cita.count({ where }),
    ])

    return {
      data: citas.map((c) => ({
        id: c.id,
        clienteId: c.clienteId,
        clienteNombre: c.cliente.nombre,
        clienteTelefono: c.cliente.telefono,
        clienteEmail: c.cliente.email,
        marcaNombre: c.marca.nombre,
        modeloNombre: c.modelo.nombre,
        anio: c.anio,
        placa: c.placa,
        fecha: c.fecha.toISOString().split('T')[0],
        hora: c.hora,
        comentarios: c.comentarios,
        estado: c.estado,
        ordenTrabajo: c.ordenTrabajo ?? null,
        createdAt: c.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  async findOne(id: string) {
    return this.prisma.cita.findUniqueOrThrow({
      where: { id },
      include: { cliente: true, marca: true, modelo: true },
    })
  }

  async updateEstado(id: string, estado: EstadoCita) {
    return this.prisma.cita.update({ where: { id }, data: { estado } })
  }

  // ── Cron: recordatorios 24h antes ─────────────────────────────────────────

  @Cron(CronExpression.EVERY_HOUR)
  async enviarRecordatorios() {
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    manana.setHours(0, 0, 0, 0)
    const pasadoManana = new Date(manana)
    pasadoManana.setDate(manana.getDate() + 1)

    const citas = await this.prisma.cita.findMany({
      where: {
        fecha: { gte: manana, lt: pasadoManana },
        estado: { in: [EstadoCita.PENDIENTE, EstadoCita.CONFIRMADA] },
        recordatorioEnviado: false,
      },
      include: { cliente: true, marca: true, modelo: true },
    })

    const config = await this.prisma.configuracionTaller.findFirst()

    for (const cita of citas) {
      if (!cita.cliente.email) continue

      await this.emailService.sendRecordatorioCita({
        to: cita.cliente.email,
        nombre: cita.cliente.nombre,
        fecha: this.formatFecha(cita.fecha),
        hora: this.formatHora(cita.hora),
        marca: cita.marca.nombre,
        modelo: cita.modelo.nombre,
        anio: cita.anio,
        placa: cita.placa,
        telefonoTaller: config?.telefono ?? '',
      })

      await this.prisma.cita.update({
        where: { id: cita.id },
        data: { recordatorioEnviado: true },
      })
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private formatFecha(fecha: Date): string {
    return new Intl.DateTimeFormat('es-HN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Tegucigalpa',
    }).format(fecha)
  }

  private formatHora(hora: string): string {
    const [h, m] = hora.split(':').map(Number)
    const ampm = (h ?? 0) >= 12 ? 'PM' : 'AM'
    const h12 = (h ?? 0) % 12 || 12
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`
  }
}

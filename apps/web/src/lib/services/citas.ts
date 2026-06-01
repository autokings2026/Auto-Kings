import { prisma } from '@/lib/prisma'
import { sendConfirmacionCita, sendRecordatorioCita } from '@/lib/email'
import { findOrCreateCliente } from '@/lib/services/clientes'
import { EstadoCita } from '@kings/shared'
import type { HorarioDia } from '@kings/shared'

// ── Slots ─────────────────────────────────────────────────────────────────────

export async function getSlotsDisponibles(fecha: string) {
  const config = await prisma.configuracionTaller.findFirst()
  const horarios = (config?.horariosAtencion ?? []) as unknown as HorarioDia[]

  const dia = new Date(`${fecha}T12:00:00`).getDay()
  const horarioDia = horarios.find(h => h.dia === dia)
  if (!horarioDia?.activo) return []

  const slots = generarSlots(
    horarioDia.apertura,
    horarioDia.cierre,
    config?.duracionSlotMinutos ?? 60,
  )

  const citasDelDia = await prisma.cita.findMany({
    where: { fecha: new Date(`${fecha}T00:00:00`), estado: { notIn: [EstadoCita.CANCELADA] } },
    select: { hora: true },
  })

  const maxPorSlot = config?.maxCitasPorSlot ?? 3

  return slots.map(hora => {
    const ocupadas = citasDelDia.filter(c => c.hora === hora).length
    return { hora, disponible: ocupadas < maxPorSlot, citasActuales: ocupadas, maxCitas: maxPorSlot }
  })
}

function generarSlots(apertura: string, cierre: string, duracionMin: number): string[] {
  const slots: string[] = []
  const [aH = 8, aM = 0] = apertura.split(':').map(Number)
  const [cH = 18, cM = 0] = cierre.split(':').map(Number)
  let min = aH * 60 + aM
  const fin = cH * 60 + cM
  while (min < fin) {
    const h = String(Math.floor(min / 60)).padStart(2, '0')
    const m = String(min % 60).padStart(2, '0')
    slots.push(`${h}:${m}`)
    min += duracionMin
  }
  return slots
}

// ── Crear cita ────────────────────────────────────────────────────────────────

export async function createCita(dto: {
  nombre: string; email?: string; telefono: string
  marcaId: string; modeloId: string; anio: number; placa: string
  fecha: string; hora: string; comentarios?: string
}) {
  const slots = await getSlotsDisponibles(dto.fecha)
  const slot = slots.find(s => s.hora === dto.hora)
  if (!slot) throw new Error('El horario seleccionado no está disponible ese día')
  if (!slot.disponible) throw new Error(`El slot ${dto.hora} del ${dto.fecha} está completo (${slot.citasActuales}/${slot.maxCitas})`)

  const [marca, modelo] = await Promise.all([
    prisma.marca.findUnique({ where: { id: dto.marcaId } }),
    prisma.modelo.findUnique({ where: { id: dto.modeloId } }),
  ])
  if (!marca) throw new Error('Marca no encontrada')
  if (!modelo) throw new Error('Modelo no encontrado')

  const cliente = await findOrCreateCliente({ nombre: dto.nombre, telefono: dto.telefono, email: dto.email })

  const cita = await prisma.cita.create({
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

  if (cliente.email) {
    const config = await prisma.configuracionTaller.findFirst()
    sendConfirmacionCita({
      to: cliente.email,
      nombre: cliente.nombre,
      fecha: formatFecha(cita.fecha),
      hora: formatHora(cita.hora),
      marca: marca.nombre,
      modelo: modelo.nombre,
      anio: cita.anio,
      placa: cita.placa,
      telefonoTaller: config?.telefono ?? '',
    }).then(() =>
      prisma.cita.update({ where: { id: cita.id }, data: { emailEnviado: true } })
    ).catch(() => null)
  }

  return {
    id: cita.id,
    mensaje: 'Cita registrada exitosamente',
    detalle: {
      nombre: cliente.nombre,
      fecha: formatFecha(cita.fecha),
      hora: formatHora(cita.hora),
      vehiculo: `${marca.nombre} ${modelo.nombre} ${cita.anio}`,
      placa: cita.placa,
    },
  }
}

// ── Listar / Detalle ──────────────────────────────────────────────────────────

export async function findAllCitas(query: {
  rango?: 'hoy' | 'semana' | 'mes' | 'todas'
  search?: string
  estado?: EstadoCita
  page?: number
  pageSize?: number
}) {
  const { rango = 'todas', search, estado, page = 1, pageSize = 20 } = query
  const where: Record<string, unknown> = {}

  if (rango !== 'todas') {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    if (rango === 'hoy') {
      const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1)
      where['fecha'] = { gte: hoy, lt: manana }
    } else if (rango === 'semana') {
      const fin = new Date(hoy); fin.setDate(hoy.getDate() + 7)
      where['fecha'] = { gte: hoy, lt: fin }
    } else if (rango === 'mes') {
      const fin = new Date(hoy); fin.setMonth(hoy.getMonth() + 1)
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
    prisma.cita.findMany({
      where,
      include: { cliente: true, marca: true, modelo: true, ordenTrabajo: { select: { id: true, numero: true } } },
      orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cita.count({ where }),
  ])

  return {
    data: citas.map(c => ({
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

// ── Recordatorios ─────────────────────────────────────────────────────────────

export async function enviarRecordatorios() {
  const manana = new Date(); manana.setDate(manana.getDate() + 1); manana.setHours(0, 0, 0, 0)
  const pasadoManana = new Date(manana); pasadoManana.setDate(manana.getDate() + 1)

  const citas = await prisma.cita.findMany({
    where: {
      fecha: { gte: manana, lt: pasadoManana },
      estado: { in: [EstadoCita.PENDIENTE, EstadoCita.CONFIRMADA] },
      recordatorioEnviado: false,
    },
    include: { cliente: true, marca: true, modelo: true },
  })

  const config = await prisma.configuracionTaller.findFirst()

  for (const cita of citas) {
    if (!cita.cliente.email) continue
    await sendRecordatorioCita({
      to: cita.cliente.email,
      nombre: cita.cliente.nombre,
      fecha: formatFecha(cita.fecha),
      hora: formatHora(cita.hora),
      marca: cita.marca.nombre,
      modelo: cita.modelo.nombre,
      anio: cita.anio,
      placa: cita.placa,
      telefonoTaller: config?.telefono ?? '',
    })
    await prisma.cita.update({ where: { id: cita.id }, data: { recordatorioEnviado: true } })
  }

  return { enviados: citas.length }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(fecha: Date): string {
  return new Intl.DateTimeFormat('es-HN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/Tegucigalpa',
  }).format(fecha)
}

function formatHora(hora: string): string {
  const [h = 0, m = 0] = hora.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`
}

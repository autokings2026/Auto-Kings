import { prisma } from '@/lib/prisma'
import { EstadoCita } from '@kings/shared'

// Cada reserva crea un cliente nuevo e independiente.
// No se reutilizan registros por teléfono para evitar pisar datos de otras reservas.
export async function findOrCreateCliente(dto: {
  nombre: string
  telefono: string
  email?: string
}) {
  // Sin trim(), un espacio de más al escribir (muy común desde el teclado del
  // celular) queda guardado para siempre y rompe cualquier búsqueda exacta
  // después (ej. el seguimiento público por placa nunca encuentra la OT).
  return prisma.cliente.create({
    data: {
      nombre: dto.nombre.trim(),
      telefono: dto.telefono.trim(),
      email: dto.email?.trim() || null,
    },
  })
}

// ── Directorio de clientes (a partir de las reservas) ───────────────────────
//
// Como cada Cita crea su propio registro de Cliente (ver findOrCreateCliente),
// una misma persona que reserva varias veces queda repartida en varios
// registros de Cliente distintos. Para mostrar un directorio real de
// "clientes" hay que agrupar por teléfono normalizado (el dato que sí se
// repite entre reservas de la misma persona), no por Cliente.id.

// "Por hacer" = reserva futura que todavía puede pasar (pendiente o
// confirmada, con fecha desde hoy en adelante). Todo lo demás (pasada,
// cancelada, convertida a OT, no asistió) cuenta como "hecha".
const ESTADOS_POR_HACER: EstadoCita[] = [EstadoCita.PENDIENTE, EstadoCita.CONFIRMADA]

function inicioDeHoy() {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return hoy
}

function esPorHacer(cita: { fecha: Date; estado: EstadoCita }, hoy: Date) {
  return cita.fecha >= hoy && ESTADOS_POR_HACER.includes(cita.estado as EstadoCita)
}

function normalizarTelefono(telefono: string) {
  return telefono.replace(/\D/g, '')
}

interface CitaConCliente {
  fecha: Date
  estado: EstadoCita
  cliente: { nombre: string; telefono: string; email: string | null }
}

export async function findAllClientes(query: { search?: string; page?: number; pageSize?: number }) {
  const { search, page = 1, pageSize = 15 } = query
  const hoy = inicioDeHoy()

  const citas = await prisma.cita.findMany({
    where: search
      ? {
          OR: [
            { cliente: { nombre: { contains: search, mode: 'insensitive' } } },
            { cliente: { telefono: { contains: search } } },
            { cliente: { email: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : undefined,
    orderBy: { fecha: 'desc' },
    select: { fecha: true, estado: true, cliente: { select: { nombre: true, telefono: true, email: true } } },
  })

  const porTelefono = new Map<string, { nombre: string; telefono: string; email: string | null; citas: { fecha: Date; estado: EstadoCita }[] }>()
  for (const c of citas as CitaConCliente[]) {
    const key = normalizarTelefono(c.cliente.telefono) || c.cliente.telefono
    if (!porTelefono.has(key)) {
      // Primera vez que se ve esta clave = la cita más reciente de esa
      // persona (las citas vienen ordenadas desc) — se usa su nombre/email
      // como el más actualizado.
      porTelefono.set(key, { nombre: c.cliente.nombre, telefono: c.cliente.telefono, email: c.cliente.email, citas: [] })
    }
    porTelefono.get(key)!.citas.push({ fecha: c.fecha, estado: c.estado })
  }

  const todos = Array.from(porTelefono.entries())
    .map(([telefonoKey, info]) => {
      const citasPorHacer = info.citas.filter((ci) => esPorHacer(ci, hoy)).length
      const ultimaCita = info.citas.reduce<Date | null>(
        (max, ci) => (!max || ci.fecha > max ? ci.fecha : max),
        null,
      )
      return {
        id: telefonoKey,
        nombre: info.nombre,
        telefono: info.telefono,
        email: info.email,
        citasPorHacer,
        citasHechas: info.citas.length - citasPorHacer,
        ultimaCita: ultimaCita ? ultimaCita.toISOString() : null,
      }
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  const total = todos.length
  const start = (page - 1) * pageSize
  const data = todos.slice(start, start + pageSize)

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getClienteDetalle(telefonoParam: string) {
  const key = normalizarTelefono(telefonoParam) || telefonoParam

  const citas = await prisma.cita.findMany({
    orderBy: [{ fecha: 'desc' }, { hora: 'desc' }],
    include: {
      cliente: { select: { nombre: true, telefono: true, email: true } },
      marca: { select: { nombre: true } },
      modelo: { select: { nombre: true } },
      ordenTrabajo: { select: { id: true, numero: true } },
    },
  })

  const delCliente = citas.filter((c) => (normalizarTelefono(c.cliente.telefono) || c.cliente.telefono) === key)
  if (delCliente.length === 0) {
    const err = new Error('Cliente no encontrado')
    ;(err as Error & { status: number }).status = 404
    throw err
  }

  const hoy = inicioDeHoy()
  const masReciente = delCliente[0]!.cliente // ya viene ordenado desc por fecha

  const citasMapeadas = delCliente.map((ci) => ({
    id: ci.id,
    fecha: ci.fecha.toISOString().split('T')[0],
    hora: ci.hora,
    marca: ci.marca.nombre,
    modelo: ci.modelo.nombre,
    anio: ci.anio,
    placa: ci.placa,
    comentarios: ci.comentarios,
    estado: ci.estado,
    ordenTrabajo: ci.ordenTrabajo,
    porHacer: esPorHacer({ fecha: ci.fecha, estado: ci.estado as EstadoCita }, hoy),
  }))

  return {
    id: key,
    nombre: masReciente.nombre,
    telefono: masReciente.telefono,
    email: masReciente.email,
    // Próximas primero por fecha más cercana; el historial ya viene desc (más reciente primero)
    porHacer: citasMapeadas.filter((c) => c.porHacer).sort((a, b) => a.fecha.localeCompare(b.fecha)),
    hechas: citasMapeadas.filter((c) => !c.porHacer),
  }
}

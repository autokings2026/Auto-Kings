import { prisma } from '@/lib/prisma'
import { EstadoOT } from '@kings/shared'

// Estados de OT que no representan trabajo real cobrado — se excluyen del
// resumen (total gastado, visitas, última visita) pero sí aparecen en el
// historial completo con su estado visible.
const ESTADOS_NO_CONTABLES: EstadoOT[] = [EstadoOT.CANCELADA, EstadoOT.RECHAZADA_COTIZACION]

function totalOrden(orden: {
  diagnostico: { totalGeneral: unknown } | null
  cotizacionesAdicionales: { totalGeneral: unknown; aprobado: boolean | null }[]
}): number {
  const base = orden.diagnostico ? Number(orden.diagnostico.totalGeneral) : 0
  const adicionales = orden.cotizacionesAdicionales
    .filter((c) => c.aprobado === true)
    .reduce((sum, c) => sum + Number(c.totalGeneral), 0)
  return base + adicionales
}

// Busca vehículos por placa o por nombre de cliente, para la pantalla
// dedicada de historial (a diferencia del panel embebido en el detalle de la
// OT, aquí se busca sin partir de una OT puntual). Agrupa por placa —
// si una placa cambió de dueño o de marca/modelo registrado entre visitas,
// se muestra el dato de la visita más reciente.
export async function buscarVehiculos(q: string) {
  const query = q.trim()
  if (!query) return []

  const ordenes = await prisma.ordenTrabajo.findMany({
    where: {
      OR: [
        { placa: { contains: query, mode: 'insensitive' } },
        { cliente: { nombre: { contains: query, mode: 'insensitive' } } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      placa: true,
      createdAt: true,
      cliente: { select: { nombre: true } },
      marca: { select: { nombre: true } },
      modelo: { select: { nombre: true } },
    },
  })

  const porPlaca = new Map<string, { placa: string; cliente: string; marca: string; modelo: string; ultimaVisita: Date }>()
  for (const o of ordenes) {
    if (!porPlaca.has(o.placa)) {
      porPlaca.set(o.placa, {
        placa: o.placa,
        cliente: o.cliente.nombre,
        marca: o.marca.nombre,
        modelo: o.modelo.nombre,
        ultimaVisita: o.createdAt,
      })
    }
  }

  return Array.from(porPlaca.values()).slice(0, 20)
}

export async function getHistorialVehiculo(placaRaw: string) {
  const placa = placaRaw.trim().toUpperCase()
  if (!placa) {
    const err = new Error('Placa requerida')
    ;(err as Error & { status: number }).status = 400
    throw err
  }

  const ordenes = await prisma.ordenTrabajo.findMany({
    where: { placa },
    orderBy: { createdAt: 'desc' },
    include: {
      cliente: { select: { nombre: true } },
      marca: { select: { nombre: true } },
      modelo: { select: { nombre: true } },
      diagnostico: { select: { totalGeneral: true, diagnosticoTecnico: true } },
      cotizacionesAdicionales: { select: { totalGeneral: true, aprobado: true } },
    },
  })

  const historial = ordenes.map((o) => ({
    id: o.id,
    numero: o.numero,
    createdAt: o.createdAt,
    estado: o.estado,
    faseActual: o.faseActual,
    kilometraje: o.kilometraje,
    cliente: o.cliente.nombre,
    marca: o.marca.nombre,
    modelo: o.modelo.nombre,
    diagnosticoTecnico: o.diagnostico?.diagnosticoTecnico ?? null,
    total: totalOrden(o),
  }))

  const contables = ordenes.filter((o) => !ESTADOS_NO_CONTABLES.includes(o.estado as EstadoOT))

  const totalGastado = contables.reduce((sum, o) => sum + totalOrden(o), 0)
  const visitas = contables.length
  const masReciente = contables[0] ?? null // ya viene ordenado createdAt desc

  return {
    placa,
    resumen: {
      totalGastado,
      visitas,
      ultimaVisita: masReciente?.createdAt ?? null,
      ultimoKilometraje: masReciente?.kilometraje ?? null,
    },
    historial,
  }
}

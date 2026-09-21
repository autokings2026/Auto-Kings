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

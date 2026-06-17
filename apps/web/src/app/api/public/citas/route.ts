import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/public/citas?placa=XXX
// Sin autenticación. Retorna estado de cita activa y/o OT activa para la placa.
export async function GET(req: NextRequest) {
  const placa = req.nextUrl.searchParams.get('placa')?.trim().toUpperCase()
  if (!placa || placa.length < 2) {
    return Response.json({ message: 'Ingresa una placa válida.' }, { status: 400 })
  }

  const resultado: {
    cita?: {
      fecha: string
      hora: string
      marca: string
      modelo: string
      anio: number
      estado: string
    }
    ot?: {
      numero: string
      marca: string
      modelo: string
      anio: number
      faseActual: string
      tecnico: string
      actualizadoEn: string
    }
  } = {}

  // Buscar cita más reciente PENDIENTE o CONFIRMADA para esa placa
  const cita = await prisma.cita.findFirst({
    where: {
      placa: { equals: placa, mode: 'insensitive' },
      estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
    },
    orderBy: { fecha: 'desc' },
    select: {
      fecha: true,
      hora: true,
      estado: true,
      anio: true,
      marca: { select: { nombre: true } },
      modelo: { select: { nombre: true } },
    },
  })

  if (cita) {
    resultado.cita = {
      fecha: cita.fecha.toISOString().split('T')[0],
      hora: cita.hora,
      marca: cita.marca.nombre,
      modelo: cita.modelo.nombre,
      anio: cita.anio,
      estado: cita.estado,
    }
  }

  // Buscar OT activa para esa placa
  const ot = await prisma.ordenTrabajo.findFirst({
    where: {
      placa: { equals: placa, mode: 'insensitive' },
      estado: 'ACTIVA',
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      numero: true,
      anio: true,
      faseActual: true,
      updatedAt: true,
      marca: { select: { nombre: true } },
      modelo: { select: { nombre: true } },
      tecnico: { select: { nombre: true } },
    },
  })

  if (ot) {
    resultado.ot = {
      numero: ot.numero,
      marca: ot.marca.nombre,
      modelo: ot.modelo.nombre,
      anio: ot.anio,
      faseActual: ot.faseActual,
      tecnico: ot.tecnico.nombre,
      actualizadoEn: ot.updatedAt.toISOString(),
    }
  }

  if (!resultado.cita && !resultado.ot) {
    return Response.json({ encontrado: false }, { status: 200 })
  }

  return Response.json({ encontrado: true, ...resultado })
}

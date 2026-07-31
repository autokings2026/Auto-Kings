import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const ResenaSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido').max(80),
  vehiculoMarca: z.string().max(50).optional(),
  vehiculoModelo: z.string().max(80).optional(),
  vehiculoAnio: z.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
  placa: z.string().max(10).optional(),
  calificacion: z.number().int().min(1).max(5),
  comentario: z.string().min(20, 'El comentario debe tener al menos 20 caracteres').max(1000),
})

// GET /api/public/resenas — reseñas aprobadas por el staff.
// Las respuestas de la encuesta de satisfacción con buen comentario ya no se
// publican aquí automáticamente: pasan primero por el módulo de revisión de
// encuestas (Contenido → Encuestas) y, al aprobarse, generan una Resena con
// estado APROBADA que aparece en este mismo listado.
export async function GET() {
  const resenas = await prisma.resena.findMany({
    where: { estado: 'APROBADA' },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      nombre: true,
      vehiculoMarca: true,
      vehiculoModelo: true,
      vehiculoAnio: true,
      calificacion: true,
      comentario: true,
      createdAt: true,
    },
  })

  const todas = resenas.map(r => ({
    id: r.id,
    nombre: r.nombre,
    vehiculo: [r.vehiculoMarca, r.vehiculoModelo, r.vehiculoAnio].filter(Boolean).join(' '),
    calificacion: r.calificacion,
    comentario: r.comentario,
    fecha: r.createdAt.toISOString(),
    fuente: 'manual' as const,
  }))

  return Response.json(todas)
}

// POST /api/public/resenas — crear nueva reseña (queda PENDIENTE)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = ResenaSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { message: parsed.error.errors[0]?.message ?? 'Datos inválidos' },
      { status: 400 },
    )
  }

  await prisma.resena.create({
    data: {
      ...parsed.data,
      estado: 'PENDIENTE',
    },
  })

  return Response.json({
    success: true,
    message: 'Gracias por tu reseña. Será publicada tras una breve revisión.',
  })
}

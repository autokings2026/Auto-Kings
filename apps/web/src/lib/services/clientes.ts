import { prisma } from '@/lib/prisma'

// Cada reserva crea un cliente nuevo e independiente.
// No se reutilizan registros por teléfono para evitar pisar datos de otras reservas.
export async function findOrCreateCliente(dto: {
  nombre: string
  telefono: string
  email?: string
}) {
  return prisma.cliente.create({
    data: { nombre: dto.nombre, telefono: dto.telefono, email: dto.email ?? null },
  })
}

import { prisma } from '@/lib/prisma'

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

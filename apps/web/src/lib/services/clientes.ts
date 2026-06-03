import { prisma } from '@/lib/prisma'

export async function findOrCreateCliente(dto: {
  nombre: string
  telefono: string
  email?: string
}) {
  const existing = await prisma.cliente.findFirst({ where: { telefono: dto.telefono } })
  if (existing) {
    return prisma.cliente.update({
      where: { id: existing.id },
      data: {
        nombre: dto.nombre,
        ...(dto.email ? { email: dto.email } : {}),
      },
    })
  }
  return prisma.cliente.create({ data: dto })
}

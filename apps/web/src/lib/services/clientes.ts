import { prisma } from '@/lib/prisma'

export async function findOrCreateCliente(dto: {
  nombre: string
  telefono: string
  email?: string
}) {
  const existing = await prisma.cliente.findFirst({ where: { telefono: dto.telefono } })
  if (existing) return existing
  return prisma.cliente.create({ data: dto })
}

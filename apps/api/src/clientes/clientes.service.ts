import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateClienteDto } from './dto/create-cliente.dto'

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  /** Busca un cliente por teléfono; si no existe, lo crea */
  async findOrCreate(dto: CreateClienteDto) {
    const existing = await this.prisma.cliente.findFirst({
      where: { telefono: dto.telefono },
    })
    if (existing) return existing

    return this.prisma.cliente.create({ data: dto })
  }

  findAll(search?: string) {
    return this.prisma.cliente.findMany({
      where: search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { telefono: { contains: search } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { nombre: 'asc' },
      take: 50,
    })
  }

  findOne(id: string) {
    return this.prisma.cliente.findUniqueOrThrow({ where: { id } })
  }
}

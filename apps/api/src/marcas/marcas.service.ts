import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class MarcasService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.marca.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true },
    })
  }

  findModelosByMarca(marcaId: string) {
    return this.prisma.modelo.findMany({
      where: { marcaId, activo: true },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true },
    })
  }
}

import { Injectable } from '@nestjs/common'
import { Prisma } from '@kings/database'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ConfigTallerService {
  constructor(private prisma: PrismaService) {}

  async get() {
    const config = await this.prisma.configuracionTaller.findFirst()
    if (config) return config
    return this.prisma.configuracionTaller.create({ data: {} })
  }

  async update(dto: {
    nombre?: string
    telefono?: string
    email?: string
    direccion?: string
    logoUrl?: string
    horariosAtencion?: Prisma.InputJsonValue
    duracionSlotMinutos?: number
    maxCitasPorSlot?: number
    alertaAmarillaMinutos?: number
    alertaRojaMinutos?: number
  }) {
    const config = await this.prisma.configuracionTaller.findFirst()
    if (config) {
      return this.prisma.configuracionTaller.update({ where: { id: config.id }, data: dto })
    }
    return this.prisma.configuracionTaller.create({ data: dto })
  }
}

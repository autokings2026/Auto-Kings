import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class EncuestaService {
  constructor(private prisma: PrismaService) {}

  private async findEncuesta(token: string) {
    const encuesta = await this.prisma.encuestaSatisfaccion.findUnique({
      where: { token },
      include: {
        orden: {
          select: {
            numero: true,
            placa: true,
            anio: true,
            cliente: { select: { nombre: true } },
            marca:  { select: { nombre: true } },
            modelo: { select: { nombre: true } },
            tecnico: { select: { nombre: true } },
          },
        },
      },
    })
    if (!encuesta) throw new NotFoundException('Encuesta no encontrada')
    return encuesta
  }

  async findByToken(token: string) {
    const e = await this.findEncuesta(token)
    const o = e.orden
    return {
      token,
      numero: o.numero,
      clienteNombre: o.cliente.nombre,
      vehiculo: `${o.marca.nombre} ${o.modelo.nombre} ${o.anio}`,
      placa: o.placa,
      tecnico: o.tecnico.nombre,
      respondido: e.respondidoEn !== null,
      calidad:    e.calidad,
      tiempo:     e.tiempo,
      atencion:   e.atencion,
      comentario: e.comentario,
      respondidoEn: e.respondidoEn?.toISOString() ?? null,
    }
  }

  async responder(token: string, dto: { calidad: number; tiempo: number; atencion: number; comentario?: string }) {
    const encuesta = await this.findEncuesta(token)

    if (encuesta.respondidoEn !== null) {
      throw new BadRequestException('Esta encuesta ya fue respondida')
    }

    for (const [campo, val] of Object.entries({ calidad: dto.calidad, tiempo: dto.tiempo, atencion: dto.atencion })) {
      if (!Number.isInteger(val) || val < 1 || val > 5) {
        throw new BadRequestException(`${campo} debe ser un número entre 1 y 5`)
      }
    }

    await this.prisma.encuestaSatisfaccion.update({
      where: { token },
      data: {
        calidad:     dto.calidad,
        tiempo:      dto.tiempo,
        atencion:    dto.atencion,
        comentario:  dto.comentario ?? null,
        respondidoEn: new Date(),
      },
    })

    return { ok: true }
  }
}

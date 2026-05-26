import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { TipoMensajeWA, TipoPlantillaWA } from '@kings/shared'

@Injectable()
export class InboxService {
  constructor(private prisma: PrismaService) {}

  // ── Conversaciones ────────────────────────────────────────────────────────

  async getConversaciones() {
    const config = await this.prisma.configuracionTaller.findFirst()
    const alertaAmarilla = config?.alertaAmarillaMinutos ?? 60
    const alertaRoja     = config?.alertaRojaMinutos     ?? 120
    const ahora = new Date()

    // Clientes que tienen al menos un mensaje
    const clientes = await this.prisma.cliente.findMany({
      where: { mensajes: { some: {} } },
      include: {
        mensajes: {
          orderBy: { enviadoEn: 'desc' },
          take: 1,
          include: { enviadoPor: { select: { nombre: true } } },
        },
        _count: { select: { mensajes: { where: { leido: false, tipo: TipoMensajeWA.ENTRANTE } } } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return clientes.map(c => {
      const ultimo = c.mensajes[0]
      const noLeidos = c._count.mensajes
      const minutosDesdeUltimo = ultimo
        ? Math.floor((ahora.getTime() - ultimo.enviadoEn.getTime()) / 60000)
        : 0
      const sinResponder =
        ultimo?.tipo === TipoMensajeWA.ENTRANTE && !ultimo.leido

      return {
        clienteId:   c.id,
        nombre:      c.nombre,
        telefono:    c.telefono,
        noLeidos,
        ultimoMensaje: ultimo
          ? {
              id:        ultimo.id,
              texto:     ultimo.texto,
              tipo:      ultimo.tipo,
              enviadoEn: ultimo.enviadoEn.toISOString(),
              enviadoPor: ultimo.enviadoPor.nombre,
            }
          : null,
        minutosDesdeUltimo,
        alerta: sinResponder
          ? minutosDesdeUltimo >= alertaRoja
            ? 'roja'
            : minutosDesdeUltimo >= alertaAmarilla
              ? 'amarilla'
              : null
          : null,
      }
    })
  }

  // ── Hilo de mensajes de un cliente ───────────────────────────────────────

  async getMensajes(clienteId: string) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id: clienteId } })
    if (!cliente) throw new NotFoundException('Cliente no encontrado')

    const mensajes = await this.prisma.mensajeWhatsApp.findMany({
      where: { clienteId },
      orderBy: { enviadoEn: 'asc' },
      include: {
        enviadoPor: { select: { nombre: true } },
        orden: { select: { numero: true } },
      },
    })

    // Marcar entrantes como leídos al abrir el hilo
    await this.prisma.mensajeWhatsApp.updateMany({
      where: { clienteId, tipo: TipoMensajeWA.ENTRANTE, leido: false },
      data: { leido: true },
    })

    return {
      cliente: { id: cliente.id, nombre: cliente.nombre, telefono: cliente.telefono },
      mensajes: mensajes.map(m => ({
        id:             m.id,
        texto:          m.texto,
        tipo:           m.tipo,
        plantillaUsada: m.plantillaUsada,
        leido:          m.leido,
        enviadoEn:      m.enviadoEn.toISOString(),
        enviadoPor:     m.enviadoPor.nombre,
        ordenNumero:    m.orden?.numero ?? null,
      })),
    }
  }

  // ── Registrar mensaje saliente ────────────────────────────────────────────

  async enviarMensaje(dto: {
    clienteId: string
    texto: string
    plantillaUsada?: TipoPlantillaWA
    ordenId?: string
    userId: string
  }) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id: dto.clienteId } })
    if (!cliente) throw new NotFoundException('Cliente no encontrado')

    const mensaje = await this.prisma.mensajeWhatsApp.create({
      data: {
        clienteId:     dto.clienteId,
        texto:         dto.texto,
        tipo:          TipoMensajeWA.SALIENTE,
        plantillaUsada: dto.plantillaUsada ?? null,
        ordenId:       dto.ordenId ?? null,
        enviadoPorId:  dto.userId,
        leido:         true,
      },
    })

    const waNumber = cliente.telefono.replace(/\D/g, '')
    const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(dto.texto)}`

    return { mensaje, waLink }
  }

  // ── Registrar mensaje entrante (manual) ──────────────────────────────────

  async registrarEntrante(dto: {
    clienteId: string
    texto: string
    userId: string
  }) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id: dto.clienteId } })
    if (!cliente) throw new NotFoundException('Cliente no encontrado')

    return this.prisma.mensajeWhatsApp.create({
      data: {
        clienteId:    dto.clienteId,
        texto:        dto.texto,
        tipo:         TipoMensajeWA.ENTRANTE,
        enviadoPorId: dto.userId,
        leido:        false,
      },
    })
  }

  // ── Plantillas ────────────────────────────────────────────────────────────

  async getPlantillas() {
    return this.prisma.plantillaMensaje.findMany({ orderBy: { tipo: 'asc' } })
  }

  async upsertPlantilla(tipo: TipoPlantillaWA, dto: { nombre: string; contenido: string; activa: boolean }) {
    return this.prisma.plantillaMensaje.upsert({
      where: { tipo },
      update: { contenido: dto.contenido, activa: dto.activa, nombre: dto.nombre },
      create: { tipo, nombre: dto.nombre, contenido: dto.contenido, activa: dto.activa },
    })
  }
}

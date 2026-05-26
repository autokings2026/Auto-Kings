import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { EstadoOT, FaseOT, TipoEventoOT } from '@kings/shared'
import PDFDocument from 'pdfkit'
import * as https from 'https'
import * as http from 'http'
import * as path from 'path'
import * as fs from 'fs'
import * as QRCode from 'qrcode'

@Injectable()
export class CotizacionService {
  constructor(private prisma: PrismaService) {}

  private async findDiag(token: string) {
    const diag = await this.prisma.diagnosticoCotizacion.findUnique({
      where: { tokenAprobacion: token },
      include: {
        items: { orderBy: { posicion: 'asc' } },
        orden: {
          include: {
            cliente: true,
            marca: true,
            modelo: true,
            tecnico: { select: { nombre: true } },
          },
        },
      },
    })
    if (!diag) throw new NotFoundException('Cotización no encontrada')
    return diag
  }

  async findByToken(token: string) {
    const diag = await this.findDiag(token)
    const o = diag.orden
    return {
      token,
      numero: o.numero,
      clienteNombre: o.cliente.nombre,
      clienteTelefono: o.cliente.telefono,
      vehiculo: `${o.marca.nombre} ${o.modelo.nombre} ${o.anio}`,
      placa: o.placa,
      tecnico: o.tecnico.nombre,
      sintomaCliente: diag.sintomaCliente,
      diagnosticoTecnico: diag.diagnosticoTecnico,
      items: diag.items.map(i => ({
        descripcion: i.descripcion,
        tipo: i.tipo,
        cantidad: Number(i.cantidad),
        precioUnitario: Number(i.precioUnitario),
        subtotal: Number(i.subtotal),
      })),
      totalMateriales: Number(diag.totalMateriales),
      totalManoObra: Number(diag.totalManoObra),
      totalGeneral: Number(diag.totalGeneral),
      aprobado: diag.aprobado,
      fechaAprobacion: diag.fechaAprobacion?.toISOString() ?? null,
    }
  }

  async responder(token: string, aprobado: boolean, mensaje?: string) {
    const diag = await this.findDiag(token)

    if (diag.aprobado !== null) {
      throw new BadRequestException(
        diag.aprobado
          ? 'Esta cotización ya fue aprobada anteriormente'
          : 'Esta cotización ya fue rechazada anteriormente',
      )
    }

    const ordenId = diag.ordenId

    return this.prisma.$transaction(async (tx) => {
      await tx.diagnosticoCotizacion.update({
        where: { tokenAprobacion: token },
        data: { aprobado, fechaAprobacion: new Date(), mensajeAprobacion: mensaje },
      })

      if (aprobado) {
        await tx.ordenTrabajo.update({
          where: { id: ordenId },
          data: { faseActual: FaseOT.REPARACION, estado: EstadoOT.ACTIVA },
        })
        await tx.reparacion.upsert({
          where: { ordenId },
          create: { ordenId, tecnicoId: diag.orden.tecnicoId, iniciadaEn: new Date() },
          update: { iniciadaEn: new Date() },
        })
        await tx.eventoOT.create({
          data: {
            ordenId,
            tipo: TipoEventoOT.COTIZACION_APROBADA,
            descripcion: 'Cotización aprobada por el cliente (link público). Reparación iniciada.',
          },
        })
      } else {
        await tx.ordenTrabajo.update({
          where: { id: ordenId },
          data: { estado: EstadoOT.RECHAZADA_COTIZACION },
        })
        await tx.eventoOT.create({
          data: {
            ordenId,
            tipo: TipoEventoOT.COTIZACION_RECHAZADA,
            descripcion: `Cotización rechazada por el cliente (link público).${mensaje ? ` Motivo: ${mensaje}` : ''}`,
          },
        })
      }

      return { ok: true, aprobado }
    })
  }

  // ── PDF ───────────────────────────────────────────────────────────────────

  async generarPdf(token: string) {
    const diag = await this.findDiag(token)
    const o = diag.orden
    const config = await this.prisma.configuracionTaller.findFirst()
    const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'
    const linkAprobacion = `${appUrl}/cotizacion/${token}`

    // Generar QR como buffer PNG
    const qrBuffer = await QRCode.toBuffer(linkAprobacion, {
      width: 110,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })

    // Logo: intentar URL remota → fallback local
    let logoBuffer: Buffer | null = null
    if (config?.logoUrl) {
      try { logoBuffer = await this.fetchUrl(config.logoUrl) } catch { /* noop */ }
    }
    if (!logoBuffer) {
      const localLogo = path.join(__dirname, 'logo.jpeg')
      if (fs.existsSync(localLogo)) logoBuffer = fs.readFileSync(localLogo)
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    const filename = `cotizacion-${o.numero}.pdf`
    const tallerNombre = config?.nombre ?? 'Kings Auto Diagnósticos'
    const fmt = (n: number) => `L. ${n.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

    // ── ENCABEZADO ────────────────────────────────────────────────────────
    // Logo (izquierda)
    if (logoBuffer) {
      doc.image(logoBuffer, 50, 35, { height: 65, fit: [120, 65] })
    }

    // Nombre taller (derecha)
    doc.fontSize(16).fillColor('#0f172a').font('Helvetica-Bold')
       .text(tallerNombre, 180, 38, { align: 'right', width: 365 })
    doc.fontSize(8.5).fillColor('#64748b').font('Helvetica')
    if (config?.telefono)  doc.text(config.telefono,  180, 58, { align: 'right', width: 365 })
    if (config?.email)     doc.text(config.email,     180, 69, { align: 'right', width: 365 })
    if (config?.direccion) doc.text(config.direccion, 180, 80, { align: 'right', width: 365 })

    // Línea separadora
    doc.moveTo(50, 108).lineTo(545, 108).strokeColor('#cbd5e1').lineWidth(0.8).stroke()

    // ── TÍTULO ────────────────────────────────────────────────────────────
    doc.fontSize(13).fillColor('#0f172a').font('Helvetica-Bold')
       .text('COTIZACIÓN DE SERVICIO', 50, 118, { align: 'center' })
    doc.fontSize(9).fillColor('#64748b').font('Helvetica')
       .text(`${o.numero}  ·  ${new Date().toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' })}`, { align: 'center' })
    doc.moveDown(1)

    // ── DATOS CLIENTE / VEHÍCULO ──────────────────────────────────────────
    const y0 = doc.y
    this.drawBox(doc, 50, y0, 245, 85, '#f8fafc')
    doc.fontSize(7.5).fillColor('#64748b').font('Helvetica-Bold').text('CLIENTE', 60, y0 + 9)
    doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text(o.cliente.nombre, 60, y0 + 20)
    doc.fontSize(8.5).fillColor('#475569').font('Helvetica').text(o.cliente.telefono, 60, y0 + 34)

    this.drawBox(doc, 300, y0, 245, 85, '#f8fafc')
    doc.fontSize(7.5).fillColor('#64748b').font('Helvetica-Bold').text('VEHÍCULO', 310, y0 + 9)
    doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold')
       .text(`${o.marca.nombre} ${o.modelo.nombre} ${o.anio}`, 310, y0 + 20)
    doc.fontSize(8.5).fillColor('#475569').font('Helvetica')
       .text(`Placa: ${o.placa}`, 310, y0 + 34)
       .text(`Técnico: ${o.tecnico.nombre}`, 310, y0 + 46)

    doc.y = y0 + 95

    // ── SÍNTOMA Y DIAGNÓSTICO ─────────────────────────────────────────────
    doc.fontSize(8).fillColor('#64748b').font('Helvetica-Bold').text('SÍNTOMA REPORTADO')
    doc.fontSize(8.5).fillColor('#334155').font('Helvetica').text(diag.sintomaCliente, { indent: 8 }).moveDown(0.4)
    doc.fontSize(8).fillColor('#64748b').font('Helvetica-Bold').text('DIAGNÓSTICO TÉCNICO')
    doc.fontSize(8.5).fillColor('#334155').font('Helvetica').text(diag.diagnosticoTecnico, { indent: 8 }).moveDown(0.8)

    // ── TABLA ÍTEMS ───────────────────────────────────────────────────────
    const tableTop = doc.y
    const C = { desc: 50, tipo: 270, cant: 330, precio: 385, sub: 460 }

    doc.rect(50, tableTop, 495, 18).fill('#1e293b')
    doc.fontSize(7.5).fillColor('#fff').font('Helvetica-Bold')
    doc.text('DESCRIPCIÓN',  C.desc  + 4, tableTop + 5)
    doc.text('TIPO',         C.tipo  + 4, tableTop + 5)
    doc.text('CANT.',        C.cant  + 4, tableTop + 5)
    doc.text('P. UNIT.',     C.precio + 4, tableTop + 5)
    doc.text('SUBTOTAL',     C.sub   + 4, tableTop + 5)

    let rowY = tableTop + 18
    for (const [idx, item] of diag.items.entries()) {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f1f5f9'
      doc.rect(50, rowY, 495, 16).fill(bg)
      doc.fontSize(7.5).fillColor('#0f172a').font('Helvetica')
      doc.text(item.descripcion, C.desc + 4, rowY + 4, { width: 215, ellipsis: true })
      doc.text(item.tipo === 'MATERIAL' ? 'Material' : 'Mano obra', C.tipo + 4, rowY + 4)
      doc.text(String(Number(item.cantidad)), C.cant + 4, rowY + 4)
      doc.text(fmt(Number(item.precioUnitario)), C.precio + 4, rowY + 4)
      doc.text(fmt(Number(item.subtotal)), C.sub + 4, rowY + 4)
      rowY += 16
    }

    // Totales
    rowY += 6
    this.totalRow(doc, rowY, 'Materiales',  fmt(Number(diag.totalMateriales)));  rowY += 16
    this.totalRow(doc, rowY, 'Mano de Obra', fmt(Number(diag.totalManoObra)));   rowY += 16
    doc.rect(350, rowY, 195, 20).fill('#0f172a')
    doc.fontSize(9).fillColor('#fff').font('Helvetica-Bold')
       .text('TOTAL GENERAL', 356, rowY + 5)
       .text(fmt(Number(diag.totalGeneral)), 356, rowY + 5, { align: 'right', width: 183 })
    rowY += 28

    // ── QR + DISCLOSURE (lado a lado) ─────────────────────────────────────
    const sectionY = rowY + 10
    const qrSize = 90

    // QR (izquierda)
    doc.image(qrBuffer, 50, sectionY, { width: qrSize, height: qrSize })
    doc.fontSize(7).fillColor('#64748b').font('Helvetica')
       .text('Escanea para aprobar', 50, sectionY + qrSize + 3, { width: qrSize, align: 'center' })

    // Disclosure (derecha del QR)
    const discX = 50 + qrSize + 14
    const discW = 495 - qrSize - 14
    doc.rect(discX, sectionY, discW, 60).fill('#fefce8')
    doc.rect(discX, sectionY, 3, 60).fill('#eab308')
    doc.fontSize(8).fillColor('#713f12').font('Helvetica-Bold')
       .text('⚠  AVISO IMPORTANTE', discX + 10, sectionY + 8)
    doc.fontSize(8).fillColor('#78350f').font('Helvetica')
       .text(
         'Si la cotización no es aprobada, se cobrará el costo de diagnóstico por los servicios de evaluación realizados.',
         discX + 10, sectionY + 20, { width: discW - 18 },
       )

    // Link debajo del QR
    doc.fontSize(7).fillColor('#3b82f6').font('Helvetica')
       .text(linkAprobacion, 50, sectionY + qrSize + 15, { width: 495, align: 'center' })

    doc.end()
    return { stream: doc, filename }
  }

  private drawBox(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, fill: string) {
    doc.rect(x, y, w, h).fill(fill).strokeColor('#e2e8f0').lineWidth(0.5).stroke()
  }

  private totalRow(doc: PDFKit.PDFDocument, y: number, label: string, value: string) {
    doc.rect(350, y, 195, 18).fill('#f1f5f9')
    doc.fontSize(8).fillColor('#475569').font('Helvetica').text(label, 355, y + 5)
    doc.fontSize(8).fillColor('#0f172a').font('Helvetica-Bold').text(value, 450, y + 5, { align: 'right', width: 90 })
  }

  private fetchUrl(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http
      client.get(url, (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c: Buffer) => chunks.push(c))
        res.on('end', () => resolve(Buffer.concat(chunks)))
        res.on('error', reject)
      }).on('error', reject)
    })
  }
}

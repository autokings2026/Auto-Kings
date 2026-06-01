import { prisma } from '@/lib/prisma'
import { pdfToBuffer, fetchUrl } from '@/lib/pdf'
import { EstadoOT, FaseOT, TipoEventoOT } from '@kings/shared'
import PDFDocument from 'pdfkit'
import * as QRCode from 'qrcode'

// ── Datos públicos ─────────────────────────────────────────────────────────────

export async function findCotizacionByToken(token: string) {
  const diag = await prisma.diagnosticoCotizacion.findUnique({
    where: { tokenAprobacion: token },
    include: {
      items: { orderBy: { posicion: 'asc' } },
      orden: { include: { cliente: true, marca: true, modelo: true, tecnico: { select: { nombre: true } } } },
    },
  })
  if (!diag) return null

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

// ── Respuesta del cliente ─────────────────────────────────────────────────────

export async function responderCotizacion(token: string, aprobado: boolean, mensaje?: string) {
  const diag = await prisma.diagnosticoCotizacion.findUnique({
    where: { tokenAprobacion: token },
    include: { orden: { select: { id: true, tecnicoId: true } } },
  })
  if (!diag) return null

  if (diag.aprobado !== null) {
    throw new Error(diag.aprobado ? 'Cotización ya aprobada' : 'Cotización ya rechazada')
  }

  const ordenId = diag.ordenId

  return prisma.$transaction(async tx => {
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
          descripcion: `Cotización rechazada por el cliente.${mensaje ? ` Motivo: ${mensaje}` : ''}`,
        },
      })
    }

    return { ok: true, aprobado }
  })
}

// ── PDF ───────────────────────────────────────────────────────────────────────

export async function generarPdfCotizacion(token: string): Promise<{ buffer: Buffer; filename: string }> {
  const diag = await prisma.diagnosticoCotizacion.findUnique({
    where: { tokenAprobacion: token },
    include: {
      items: { orderBy: { posicion: 'asc' } },
      orden: { include: { cliente: true, marca: true, modelo: true, tecnico: { select: { nombre: true } } } },
    },
  })
  if (!diag) throw new Error('Cotización no encontrada')

  const o = diag.orden
  const config = await prisma.configuracionTaller.findFirst()
  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'
  const linkAprobacion = `${appUrl}/cotizacion/${token}`

  const qrBuffer = await QRCode.toBuffer(linkAprobacion, {
    width: 110, margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' },
  }).catch(() => null)

  let logoBuffer: Buffer | null = null
  if (config?.logoUrl) {
    logoBuffer = await fetchUrl(config.logoUrl).catch(() => null)
  }

  const doc = new PDFDocument({ margin: 50, size: 'A4' })
  const filename = `cotizacion-${o.numero}.pdf`
  const tallerNombre = config?.nombre ?? 'Kings Auto Diagnósticos'
  const fmt = (n: number) => `L. ${n.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

  if (logoBuffer) doc.image(logoBuffer, 50, 35, { height: 65, fit: [120, 65] })

  doc.fontSize(16).fillColor('#0f172a').font('Helvetica-Bold')
     .text(tallerNombre, 180, 38, { align: 'right', width: 365 })
  doc.fontSize(8.5).fillColor('#64748b').font('Helvetica')
  if (config?.telefono) doc.text(config.telefono, 180, 58, { align: 'right', width: 365 })
  if (config?.email)    doc.text(config.email,    180, 69, { align: 'right', width: 365 })
  if (config?.direccion) doc.text(config.direccion, 180, 80, { align: 'right', width: 365 })

  doc.moveTo(50, 108).lineTo(545, 108).strokeColor('#cbd5e1').lineWidth(0.8).stroke()

  doc.fontSize(13).fillColor('#0f172a').font('Helvetica-Bold')
     .text('COTIZACIÓN DE SERVICIO', 50, 118, { align: 'center' })
  doc.fontSize(9).fillColor('#64748b').font('Helvetica')
     .text(`${o.numero}  ·  ${new Date().toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' })}`, { align: 'center' })
  doc.moveDown(1)

  const y0 = doc.y
  drawBox(doc, 50, y0, 245, 85, '#f8fafc')
  doc.fontSize(7.5).fillColor('#64748b').font('Helvetica-Bold').text('CLIENTE', 60, y0 + 9)
  doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text(o.cliente.nombre, 60, y0 + 20)
  doc.fontSize(8.5).fillColor('#475569').font('Helvetica').text(o.cliente.telefono, 60, y0 + 34)

  drawBox(doc, 300, y0, 245, 85, '#f8fafc')
  doc.fontSize(7.5).fillColor('#64748b').font('Helvetica-Bold').text('VEHÍCULO', 310, y0 + 9)
  doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold')
     .text(`${o.marca.nombre} ${o.modelo.nombre} ${o.anio}`, 310, y0 + 20)
  doc.fontSize(8.5).fillColor('#475569').font('Helvetica')
     .text(`Placa: ${o.placa}`, 310, y0 + 34)
     .text(`Técnico: ${o.tecnico.nombre}`, 310, y0 + 46)

  doc.y = y0 + 95

  doc.fontSize(8).fillColor('#64748b').font('Helvetica-Bold').text('SÍNTOMA REPORTADO')
  doc.fontSize(8.5).fillColor('#334155').font('Helvetica').text(diag.sintomaCliente, { indent: 8 }).moveDown(0.4)
  doc.fontSize(8).fillColor('#64748b').font('Helvetica-Bold').text('DIAGNÓSTICO TÉCNICO')
  doc.fontSize(8.5).fillColor('#334155').font('Helvetica').text(diag.diagnosticoTecnico, { indent: 8 }).moveDown(0.8)

  const tableTop = doc.y
  const C = { desc: 50, tipo: 270, cant: 330, precio: 385, sub: 460 }

  doc.rect(50, tableTop, 495, 18).fill('#1e293b')
  doc.fontSize(7.5).fillColor('#fff').font('Helvetica-Bold')
  doc.text('DESCRIPCIÓN', C.desc + 4, tableTop + 5)
  doc.text('TIPO',        C.tipo + 4, tableTop + 5)
  doc.text('CANT.',       C.cant + 4, tableTop + 5)
  doc.text('P. UNIT.',    C.precio + 4, tableTop + 5)
  doc.text('SUBTOTAL',    C.sub + 4, tableTop + 5)

  let rowY = tableTop + 18
  for (let idx = 0; idx < diag.items.length; idx++) {
    const item = diag.items[idx]!
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

  rowY += 6
  totalRow(doc, rowY, 'Materiales',   fmt(Number(diag.totalMateriales))); rowY += 16
  totalRow(doc, rowY, 'Mano de Obra', fmt(Number(diag.totalManoObra)));   rowY += 16
  doc.rect(350, rowY, 195, 20).fill('#0f172a')
  doc.fontSize(9).fillColor('#fff').font('Helvetica-Bold')
     .text('TOTAL GENERAL', 356, rowY + 5)
     .text(fmt(Number(diag.totalGeneral)), 356, rowY + 5, { align: 'right', width: 183 })
  rowY += 28

  const sectionY = rowY + 10

  if (qrBuffer) {
    doc.image(qrBuffer, 50, sectionY, { width: 90, height: 90 })
    doc.fontSize(7).fillColor('#64748b').font('Helvetica')
       .text('Escanea para aprobar', 50, sectionY + 93, { width: 90, align: 'center' })
  }

  const discX = 154, discW = 391
  doc.rect(discX, sectionY, discW, 60).fill('#fefce8')
  doc.rect(discX, sectionY, 3, 60).fill('#eab308')
  doc.fontSize(8).fillColor('#713f12').font('Helvetica-Bold')
     .text('⚠  AVISO IMPORTANTE', discX + 10, sectionY + 8)
  doc.fontSize(8).fillColor('#78350f').font('Helvetica')
     .text('Si la cotización no es aprobada, se cobrará el costo de diagnóstico por los servicios de evaluación realizados.',
       discX + 10, sectionY + 20, { width: discW - 18 })

  doc.fontSize(7).fillColor('#3b82f6').font('Helvetica')
     .text(linkAprobacion, 50, sectionY + 107, { width: 495, align: 'center' })

  doc.end()
  const buffer = await pdfToBuffer(doc)
  return { buffer, filename }
}

function drawBox(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, fill: string) {
  doc.rect(x, y, w, h).fill(fill).strokeColor('#e2e8f0').lineWidth(0.5).stroke()
}

function totalRow(doc: PDFKit.PDFDocument, y: number, label: string, value: string) {
  doc.rect(350, y, 195, 18).fill('#f1f5f9')
  doc.fontSize(8).fillColor('#475569').font('Helvetica').text(label, 355, y + 5)
  doc.fontSize(8).fillColor('#0f172a').font('Helvetica-Bold').text(value, 450, y + 5, { align: 'right', width: 90 })
}

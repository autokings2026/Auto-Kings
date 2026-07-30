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
    aplicarISV: diag.aplicarISV,
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
    color: { dark: '#1e3a8a', light: '#ffffff' },
  }).catch(() => null)

  let logoBuffer: Buffer | null = null
  const logoSrc = config?.logoUrl ?? `${appUrl}/logo-dark.jpeg`
  logoBuffer = await fetchUrl(logoSrc).catch(() => null)

  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true })
  const filename = `cotizacion-${o.numero}.pdf`
  const tallerNombre = config?.nombre ?? 'Kings Auto Diagnosticos'
  const fmt = (n: number) => `L. ${n.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`

  // Layout constants
  const M  = 50
  const CW = 495

  // Brand palette
  const NAVY    = '#1e3a8a'
  const CYAN    = '#22d3ee'
  const WHITE   = '#ffffff'
  const DARK    = '#0f172a'
  const SLATE   = '#475569'
  const MUTED   = '#94a3b8'
  const LIGHT   = '#f8fafc'
  const BORDER  = '#e2e8f0'
  const AMBER   = '#d97706'
  const AMBER_BG = '#fffbeb'
  const AMBER_BD = '#fcd34d'

  // Section header bar
  const sectionBar = (title: string) => {
    doc.moveDown(0.7)
    const sy = doc.y
    doc.rect(M,     sy, 4,      20).fill(CYAN)
    doc.rect(M + 4, sy, CW - 4, 20).fill(NAVY)
    doc.fontSize(7.5).fillColor(WHITE).font('Helvetica-Bold')
       .text(title, M + 12, sy + 6, { width: CW - 20, lineBreak: false })
    doc.y = sy + 28
  }

  // Table cell helper
  const cell = (
    text: string, x: number, y: number, w: number,
    opts: { align?: 'left' | 'right'; bold?: boolean; color?: string; size?: number } = {},
  ) => {
    doc.fontSize(opts.size ?? 7.5).fillColor(opts.color ?? DARK)
       .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
       .text(text, x + 4, y + 5, { width: w - 8, lineBreak: false, align: opts.align ?? 'left', ellipsis: true })
  }

  // ── HEADER BANNER ─────────────────────────────────────────────────────────────
  const BANNER_H = 72
  const bannerY  = doc.y

  doc.rect(M, bannerY, CW, BANNER_H).fill(NAVY)
  doc.rect(M, bannerY + BANNER_H - 4, CW, 4).fill(CYAN)

  if (logoBuffer) {
    doc.image(logoBuffer, M + 10, bannerY + 9, { fit: [54, 54] })
    doc.moveTo(M + 74, bannerY + 14)
       .lineTo(M + 74, bannerY + BANNER_H - 14)
       .strokeColor('#2563eb').lineWidth(0.8).stroke()
    doc.fontSize(15).fillColor(WHITE).font('Helvetica-Bold')
       .text(tallerNombre, M + 84, bannerY + 14, { width: CW - 94, align: 'right', lineBreak: false })
    let infoY = bannerY + 35
    if (config?.telefono) {
      doc.fontSize(8).fillColor(CYAN).font('Helvetica')
         .text(config.telefono, M + 84, infoY, { width: CW - 94, align: 'right', lineBreak: false })
      infoY += 13
    }
    if (config?.email) {
      doc.fontSize(8).fillColor('#93c5fd').font('Helvetica')
         .text(config.email, M + 84, infoY, { width: CW - 94, align: 'right', lineBreak: false })
    }
  } else {
    doc.fontSize(16).fillColor(WHITE).font('Helvetica-Bold')
       .text(tallerNombre, M + 10, bannerY + 20, { width: CW - 20, align: 'center', lineBreak: false })
    if (config?.telefono) {
      doc.fontSize(8.5).fillColor(CYAN).font('Helvetica')
         .text(config.telefono, M + 10, bannerY + 42, { width: CW - 20, align: 'center', lineBreak: false })
    }
  }
  doc.y = bannerY + BANNER_H + 16

  // ── DOCUMENT TITLE ────────────────────────────────────────────────────────────
  doc.fontSize(13).fillColor(DARK).font('Helvetica-Bold')
     .text('COTIZACION DE SERVICIO', { align: 'center' })
  doc.moveDown(0.3)
  doc.fontSize(8.5).fillColor(SLATE).font('Helvetica')
     .text(
       `No. ${o.numero}  ·  ${new Date().toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' })}`,
       { align: 'center' },
     )
  doc.moveDown(0.5)
  doc.moveTo(M + 100, doc.y).lineTo(M + CW - 100, doc.y).strokeColor(CYAN).lineWidth(1.5).stroke()
  doc.moveDown(1.2)

  // ── INFO CARDS ────────────────────────────────────────────────────────────────
  const CARD_W = (CW - 12) / 2
  const CARD_H = 80
  const cardY  = doc.y

  // Cliente card
  doc.rect(M, cardY, CARD_W, CARD_H).fill(LIGHT).strokeColor(BORDER).lineWidth(0.5).stroke()
  doc.rect(M, cardY, 4, CARD_H).fill(CYAN)
  doc.fontSize(6.5).fillColor(MUTED).font('Helvetica-Bold')
     .text('CLIENTE', M + 10, cardY + 10, { width: CARD_W - 16, lineBreak: false })
  doc.fontSize(10.5).fillColor(DARK).font('Helvetica-Bold')
     .text(o.cliente.nombre, M + 10, cardY + 22, { width: CARD_W - 16, lineBreak: false, ellipsis: true })
  doc.fontSize(8.5).fillColor(SLATE).font('Helvetica')
     .text(o.cliente.telefono, M + 10, cardY + 38, { width: CARD_W - 16, lineBreak: false })
  if (o.cliente.email) {
    doc.fontSize(7.5).fillColor(MUTED).font('Helvetica')
       .text(o.cliente.email, M + 10, cardY + 52, { width: CARD_W - 16, lineBreak: false, ellipsis: true })
  }

  // Vehículo card
  const rX = M + CARD_W + 12
  doc.rect(rX, cardY, CARD_W, CARD_H).fill(LIGHT).strokeColor(BORDER).lineWidth(0.5).stroke()
  doc.rect(rX, cardY, 4, CARD_H).fill(NAVY)
  doc.fontSize(6.5).fillColor(MUTED).font('Helvetica-Bold')
     .text('VEHICULO', rX + 10, cardY + 10, { width: CARD_W - 16, lineBreak: false })
  doc.fontSize(10.5).fillColor(DARK).font('Helvetica-Bold')
     .text(`${o.marca.nombre} ${o.modelo.nombre} ${o.anio}`, rX + 10, cardY + 22, { width: CARD_W - 16, lineBreak: false, ellipsis: true })
  doc.fontSize(8.5).fillColor(SLATE).font('Helvetica')
     .text(`Placa: ${o.placa}`, rX + 10, cardY + 38, { width: CARD_W - 16, lineBreak: false })
  doc.fontSize(8.5).fillColor(SLATE).font('Helvetica')
     .text(`Tecnico: ${o.tecnico.nombre}`, rX + 10, cardY + 52, { width: CARD_W - 16, lineBreak: false, ellipsis: true })
  doc.y = cardY + CARD_H + 14

  // ── SINTOMA / DIAGNOSTICO ─────────────────────────────────────────────────────
  sectionBar('SINTOMA REPORTADO POR EL CLIENTE')
  doc.fontSize(9).fillColor('#334155').font('Helvetica')
     .text(diag.sintomaCliente, M + 12, doc.y, { width: CW - 24 })
  doc.moveDown(0.3)

  sectionBar('DIAGNOSTICO TECNICO')
  doc.fontSize(9).fillColor('#334155').font('Helvetica')
     .text(diag.diagnosticoTecnico, M + 12, doc.y, { width: CW - 24 })
  doc.moveDown(0.3)

  // ── ITEMS TABLE ───────────────────────────────────────────────────────────────
  sectionBar('TRABAJOS Y MATERIALES')

  const COLS = [
    { x: M,       w: 194, align: 'left'  as const, label: 'DESCRIPCION'  },
    { x: M + 198, w: 76,  align: 'left'  as const, label: 'TIPO'         },
    { x: M + 278, w: 38,  align: 'right' as const, label: 'CANT.'        },
    { x: M + 320, w: 88,  align: 'right' as const, label: 'P. UNITARIO'  },
    { x: M + 412, w: 83,  align: 'right' as const, label: 'SUBTOTAL'     },
  ] as const

  const HDR_H = 20, ROW_H = 18
  const tY = doc.y

  doc.rect(M, tY, CW, HDR_H).fill(NAVY)
  doc.rect(M, tY + HDR_H - 2, CW, 2).fill(CYAN)
  COLS.forEach(c => cell(c.label, c.x, tY, c.w, { align: c.align, bold: true, color: WHITE, size: 7.5 }))

  let rowY = tY + HDR_H
  for (let idx = 0; idx < diag.items.length; idx++) {
    const item = diag.items[idx]!
    doc.rect(M, rowY, CW, ROW_H).fill(idx % 2 === 0 ? WHITE : LIGHT)
    doc.moveTo(M, rowY + ROW_H).lineTo(M + CW, rowY + ROW_H).strokeColor(BORDER).lineWidth(0.3).stroke()
    const vals = [
      item.descripcion,
      item.tipo === 'MATERIAL' ? 'Material' : 'Mano de obra',
      String(Number(item.cantidad)),
      fmt(Number(item.precioUnitario)),
      fmt(Number(item.subtotal)),
    ]
    COLS.forEach((c, ci) =>
      cell(vals[ci]!, c.x, rowY, c.w, { align: c.align, color: ci === 0 ? DARK : SLATE }),
    )
    rowY += ROW_H
  }

  // Subtotals
  const totX = M + 308, totW = CW - 308
  const subtotalBase = Number(diag.totalMateriales) + Number(diag.totalManoObra)

  ;[
    { label: 'Materiales',   val: fmt(Number(diag.totalMateriales)) },
    { label: 'Mano de Obra', val: fmt(Number(diag.totalManoObra))   },
  ].forEach(t => {
    doc.rect(totX, rowY, totW, 18).fill(LIGHT).strokeColor(BORDER).lineWidth(0.3).stroke()
    doc.fontSize(8).fillColor(SLATE).font('Helvetica')
       .text(t.label, totX + 6, rowY + 5, { width: 90, lineBreak: false })
    doc.fontSize(8).fillColor(DARK).font('Helvetica-Bold')
       .text(t.val, totX + 98, rowY + 5, { width: totW - 106, align: 'right', lineBreak: false })
    rowY += 18
  })

  if (diag.aplicarISV) {
    ;[
      { label: 'Subtotal', val: fmt(subtotalBase) },
      { label: 'ISV (15%)', val: fmt(parseFloat((subtotalBase * 0.15).toFixed(2))) },
    ].forEach(t => {
      doc.rect(totX, rowY, totW, 18).fill(LIGHT).strokeColor(BORDER).lineWidth(0.3).stroke()
      doc.fontSize(8).fillColor(SLATE).font('Helvetica')
         .text(t.label, totX + 6, rowY + 5, { width: 90, lineBreak: false })
      doc.fontSize(8).fillColor(DARK).font('Helvetica-Bold')
         .text(t.val, totX + 98, rowY + 5, { width: totW - 106, align: 'right', lineBreak: false })
      rowY += 18
    })
  }

  // Grand total — navy + cyan accent
  doc.rect(totX, rowY, totW, 24).fill(NAVY)
  doc.rect(totX, rowY, 4, 24).fill(CYAN)
  doc.fontSize(9).fillColor(WHITE).font('Helvetica-Bold')
     .text('TOTAL GENERAL', totX + 10, rowY + 7, { width: 110, lineBreak: false })
  doc.fontSize(10).fillColor(CYAN).font('Helvetica-Bold')
     .text(fmt(Number(diag.totalGeneral)), totX + 122, rowY + 6, { width: totW - 130, align: 'right', lineBreak: false })
  rowY += 32

  // ── APROBACION SECTION ────────────────────────────────────────────────────────
  const secY = rowY + 12

  // QR code
  if (qrBuffer) {
    // QR container card
    doc.rect(M, secY, 96, 110).fill(LIGHT).strokeColor(BORDER).lineWidth(0.5).stroke()
    doc.rect(M, secY, 4, 110).fill(CYAN)
    doc.image(qrBuffer, M + 8, secY + 8, { width: 80, height: 80 })
    doc.fontSize(7).fillColor(SLATE).font('Helvetica')
       .text('Escanear para', M + 8, secY + 92, { width: 80, align: 'center', lineBreak: false })
    doc.fontSize(7).fillColor(NAVY).font('Helvetica-Bold')
       .text('aprobar o rechazar', M + 8, secY + 101, { width: 80, align: 'center', lineBreak: false })
  }

  // Aviso disclaimer
  const discX = qrBuffer ? M + 106 : M
  const discW = qrBuffer ? CW - 106 : CW
  doc.rect(discX, secY, discW, 60).fill(AMBER_BG).strokeColor(AMBER_BD).lineWidth(0.5).stroke()
  doc.rect(discX, secY, 4, 60).fill(AMBER)
  doc.fontSize(8).fillColor(AMBER).font('Helvetica-Bold')
     .text('AVISO IMPORTANTE', discX + 12, secY + 10, { width: discW - 20, lineBreak: false })
  doc.fontSize(8).fillColor('#78350f').font('Helvetica')
     .text(
       'Si la cotizacion no es aprobada, se cobrara el costo de diagnostico por los servicios de evaluacion realizados.',
       discX + 12, secY + 24, { width: discW - 20 },
     )

  // Approval link
  doc.fontSize(7.5).fillColor(NAVY).font('Helvetica')
     .text(linkAprobacion, M, secY + 116, { width: CW, align: 'center', lineBreak: false })

  // ── FOOTER ────────────────────────────────────────────────────────────────────
  // footY cae dentro del margen inferior de la pagina; sin desactivarlo
  // temporalmente, PDFKit interpreta esa posicion como "no cabe" y crea una
  // pagina en blanco nueva para el texto en cada iteracion.
  const range = doc.bufferedPageRange()
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i)
    const prevBottomMargin = doc.page.margins.bottom
    doc.page.margins.bottom = 0
    const footY = doc.page.height - 40
    doc.rect(M, footY - 10, CW, 2).fill(CYAN)
    doc.fontSize(7).fillColor(MUTED).font('Helvetica')
       .text(
         `${tallerNombre}  ·  Generado el ${new Date().toLocaleDateString('es-HN')}  ·  Pag. ${i - range.start + 1} de ${range.count}`,
         M, footY, { align: 'center', width: CW, lineBreak: false },
       )
    doc.page.margins.bottom = prevBottomMargin
  }

  doc.end()
  const buffer = await pdfToBuffer(doc)
  return { buffer, filename }
}

import { prisma } from '@/lib/prisma'
import { pdfToBuffer, fetchUrl } from '@/lib/pdf'
import { EstadoOT } from '@kings/shared'
import PDFDocument from 'pdfkit'

// ── Lista de OTs completadas ──────────────────────────────────────────────────

export async function getOrdenesCompletadas(params: {
  desde?: string; hasta?: string; tecnicoId?: string; page: number; pageSize: number
}) {
  const { desde, hasta, tecnicoId, page, pageSize } = params

  const where = {
    estado: EstadoOT.COMPLETADA,
    ...(desde || hasta ? {
      updatedAt: {
        ...(desde ? { gte: new Date(desde) } : {}),
        ...(hasta ? { lte: new Date(hasta + 'T23:59:59') } : {}),
      },
    } : {}),
    ...(tecnicoId ? { tecnicoId } : {}),
  }

  const [total, ordenes, config] = await Promise.all([
    prisma.ordenTrabajo.count({ where }),
    prisma.ordenTrabajo.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, numero: true, placa: true, anio: true, color: true,
        createdAt: true, updatedAt: true,
        cliente:    { select: { nombre: true, telefono: true } },
        marca:      { select: { nombre: true } },
        modelo:     { select: { nombre: true } },
        tecnico:    { select: { id: true, nombre: true } },
        diagnostico: { select: { totalGeneral: true, totalManoObra: true, aprobado: true } },
        entrega:    { select: { entregadoEn: true } },
        encuesta:   { select: { calidad: true, tiempo: true, atencion: true, respondidoEn: true } },
        _count:     { select: { fotos: true } },
      },
    }),
    prisma.configuracionTaller.findFirst({ select: { comisionTecnicoPct: true } }),
  ])

  const comisionPct = config?.comisionTecnicoPct ?? 8

  return {
    data: ordenes.map(o => {
      const manoObra = o.diagnostico?.totalManoObra ? Number(o.diagnostico.totalManoObra) : null
      return {
        id: o.id,
        numero: o.numero,
        placa: o.placa,
        anio: o.anio,
        color: o.color,
        clienteNombre: o.cliente.nombre,
        clienteTelefono: o.cliente.telefono,
        vehiculo: `${o.marca.nombre} ${o.modelo.nombre} ${o.anio}`,
        tecnicoNombre: o.tecnico.nombre,
        tecnicoId: o.tecnico.id,
        totalFacturado: o.diagnostico?.totalGeneral ? Number(o.diagnostico.totalGeneral) : null,
        totalManoObra: manoObra,
        comisionTecnico: manoObra !== null ? +(manoObra * comisionPct / 100).toFixed(2) : null,
        comisionPct,
        fechaIngreso: o.createdAt.toISOString(),
        fechaEntrega: o.entrega?.entregadoEn?.toISOString() ?? null,
        tieneFotos: o._count.fotos > 0,
        encuestaPromedio: o.encuesta?.calidad && o.encuesta?.tiempo && o.encuesta?.atencion
          ? +((o.encuesta.calidad + o.encuesta.tiempo + o.encuesta.atencion) / 3).toFixed(1)
          : null,
      }
    }),
    total, page, pageSize,
    totalPages: Math.ceil(total / pageSize),
    comisionPct,
  }
}

// ── Detalle de una OT ─────────────────────────────────────────────────────────

export async function getDetalleReporte(id: string) {
  const [o, config] = await Promise.all([
    prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        cliente: true, marca: true, modelo: true,
        tecnico:  { select: { nombre: true, email: true } },
        fotos:    { orderBy: { createdAt: 'asc' } },
        diagnostico: { include: { items: { orderBy: { posicion: 'asc' } } } },
        reparacion:  { include: { tecnico: { select: { nombre: true } } } },
        controlesCC: { orderBy: { revisadoEn: 'asc' }, include: { revisadoPor: { select: { nombre: true } } } },
        entrega:  { include: { registradoPor: { select: { nombre: true } } } },
        encuesta: true,
        eventos:  { orderBy: { createdAt: 'asc' }, include: { realizadoPor: { select: { nombre: true } } } },
      },
    }),
    prisma.configuracionTaller.findFirst({ select: { comisionTecnicoPct: true } }),
  ])
  if (!o) return null

  const comisionPct = config?.comisionTecnicoPct ?? 8
  const diag = o.diagnostico
  const manoObra = diag ? Number(diag.totalManoObra) : null
  return {
    id: o.id, numero: o.numero, placa: o.placa, anio: o.anio, color: o.color,
    combustible: o.combustible, kilometraje: o.kilometraje,
    fechaIngreso: o.createdAt.toISOString(),
    cliente: { nombre: o.cliente.nombre, telefono: o.cliente.telefono, email: o.cliente.email },
    vehiculo: `${o.marca.nombre} ${o.modelo.nombre} ${o.anio}`,
    marca: o.marca.nombre, modelo: o.modelo.nombre, tecnico: o.tecnico.nombre,
    fotos: o.fotos.map(f => ({ id: f.id, url: f.url, createdAt: f.createdAt.toISOString() })),
    comisionPct,
    comisionTecnico: manoObra !== null ? +(manoObra * comisionPct / 100).toFixed(2) : null,
    diagnostico: diag ? {
      sintomaCliente: diag.sintomaCliente,
      diagnosticoTecnico: diag.diagnosticoTecnico,
      items: diag.items.map(i => ({
        descripcion: i.descripcion, tipo: i.tipo,
        cantidad: Number(i.cantidad), precioUnitario: Number(i.precioUnitario), subtotal: Number(i.subtotal),
      })),
      totalMateriales: Number(diag.totalMateriales),
      totalManoObra: Number(diag.totalManoObra),
      totalGeneral: Number(diag.totalGeneral),
    } : null,
    reparacion: o.reparacion ? {
      tecnico: o.reparacion.tecnico.nombre,
      notas: o.reparacion.notas,
      iniciadaEn: o.reparacion.iniciadaEn?.toISOString() ?? null,
      finalizadaEn: o.reparacion.finalizadaEn?.toISOString() ?? null,
    } : null,
    controlesCC: o.controlesCC.map(cc => ({
      aprobado: cc.aprobado, observaciones: cc.observaciones,
      revisadoPor: cc.revisadoPor.nombre, revisadoEn: cc.revisadoEn.toISOString(),
    })),
    entrega: o.entrega ? {
      entregadoEn: o.entrega.entregadoEn?.toISOString() ?? null,
      registradoPor: o.entrega.registradoPor.nombre,
    } : null,
    encuesta: o.encuesta ? {
      calidad: o.encuesta.calidad, tiempo: o.encuesta.tiempo, atencion: o.encuesta.atencion,
      comentario: o.encuesta.comentario, respondidoEn: o.encuesta.respondidoEn?.toISOString() ?? null,
    } : null,
  }
}

// ── PDF ───────────────────────────────────────────────────────────────────────

export async function generarPdfReporte(id: string): Promise<{ buffer: Buffer; filename: string }> {
  const r = await getDetalleReporte(id)
  if (!r) throw new Error('OT no encontrada')

  const config = await prisma.configuracionTaller.findFirst()

  let validFotos: Buffer[] = []
  if (r.fotos.length > 0) {
    const bufs = await Promise.all(r.fotos.slice(0, 6).map(f => fetchUrl(f.url).catch(() => null)))
    validFotos = bufs.filter((b): b is Buffer => b !== null)
  }

  let logoBuffer: Buffer | null = null
  if (config?.logoUrl) logoBuffer = await fetchUrl(config.logoUrl).catch(() => null)

  const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: true, bufferPages: true })
  const filename = `reporte-${r.numero}.pdf`
  const tallerNombre = config?.nombre ?? 'Kings Auto Diagnosticos'

  // Layout constants
  const M  = 50   // margin
  const CW = 495  // content width

  // Brand palette
  const NAVY    = '#1e3a8a'
  const CYAN    = '#22d3ee'
  const WHITE   = '#ffffff'
  const DARK    = '#0f172a'
  const SLATE   = '#475569'
  const MUTED   = '#94a3b8'
  const LIGHT   = '#f8fafc'
  const BORDER  = '#e2e8f0'
  const GREEN   = '#16a34a'
  const GREEN_BG = '#f0fdf4'
  const GREEN_BD = '#86efac'
  const RED     = '#dc2626'
  const RED_BG  = '#fef2f2'
  const RED_BD  = '#fca5a5'

  const fmtM = (n: number) => `L. ${n.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
  const fmtD = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' }) : '---'

  // Section header bar: cyan 4px accent + navy background + white text
  const sectionBar = (title: string) => {
    doc.moveDown(0.8)
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
    opts: { align?: 'left' | 'right' | 'center'; bold?: boolean; color?: string; size?: number } = {},
  ) => {
    doc.fontSize(opts.size ?? 8).fillColor(opts.color ?? DARK)
       .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
       .text(text, x + 4, y + 5, { width: w - 8, lineBreak: false, align: opts.align ?? 'left', ellipsis: true })
  }

  // ── HEADER BANNER ─────────────────────────────────────────────────────────────
  const BANNER_H = 72
  const bannerY  = doc.y

  doc.rect(M, bannerY, CW, BANNER_H).fill(NAVY)
  // cyan accent stripe at bottom of banner
  doc.rect(M, bannerY + BANNER_H - 4, CW, 4).fill(CYAN)

  if (logoBuffer) {
    doc.image(logoBuffer, M + 10, bannerY + 9, { fit: [54, 54] })
    // vertical separator
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
     .text('REPORTE DE ORDEN DE TRABAJO', { align: 'center' })
  doc.moveDown(0.3)
  doc.fontSize(8.5).fillColor(SLATE).font('Helvetica')
     .text(
       `No. ${r.numero}  ·  Ingreso: ${fmtD(r.fechaIngreso)}  ·  Entrega: ${fmtD(r.entrega?.entregadoEn ?? null)}`,
       { align: 'center' },
     )
  doc.moveDown(0.5)
  // decorative cyan underline (centered, shorter than full width)
  const lineX = M + 100
  doc.moveTo(lineX, doc.y).lineTo(M + CW - 100, doc.y).strokeColor(CYAN).lineWidth(1.5).stroke()
  doc.moveDown(1.2)

  // ── INFO CARDS ────────────────────────────────────────────────────────────────
  const CARD_W = (CW - 12) / 2
  const CARD_H = 84
  const cardY  = doc.y

  // Cliente card — cyan left accent
  doc.rect(M, cardY, CARD_W, CARD_H).fill(LIGHT).strokeColor(BORDER).lineWidth(0.5).stroke()
  doc.rect(M, cardY, 4, CARD_H).fill(CYAN)
  doc.fontSize(6.5).fillColor(MUTED).font('Helvetica-Bold')
     .text('CLIENTE', M + 10, cardY + 10, { width: CARD_W - 16, lineBreak: false })
  doc.fontSize(10.5).fillColor(DARK).font('Helvetica-Bold')
     .text(r.cliente.nombre, M + 10, cardY + 22, { width: CARD_W - 16, lineBreak: false, ellipsis: true })
  doc.fontSize(8.5).fillColor(SLATE).font('Helvetica')
     .text(r.cliente.telefono, M + 10, cardY + 38, { width: CARD_W - 16, lineBreak: false })
  if (r.cliente.email) {
    doc.fontSize(7.5).fillColor(MUTED).font('Helvetica')
       .text(r.cliente.email, M + 10, cardY + 52, { width: CARD_W - 16, lineBreak: false, ellipsis: true })
  }

  // Vehículo card — navy left accent
  const rX = M + CARD_W + 12
  doc.rect(rX, cardY, CARD_W, CARD_H).fill(LIGHT).strokeColor(BORDER).lineWidth(0.5).stroke()
  doc.rect(rX, cardY, 4, CARD_H).fill(NAVY)
  doc.fontSize(6.5).fillColor(MUTED).font('Helvetica-Bold')
     .text('VEHICULO', rX + 10, cardY + 10, { width: CARD_W - 16, lineBreak: false })
  doc.fontSize(10.5).fillColor(DARK).font('Helvetica-Bold')
     .text(r.vehiculo, rX + 10, cardY + 22, { width: CARD_W - 16, lineBreak: false, ellipsis: true })
  doc.fontSize(8.5).fillColor(SLATE).font('Helvetica')
     .text(`Placa: ${r.placa}  ·  Color: ${r.color}`, rX + 10, cardY + 38, { width: CARD_W - 16, lineBreak: false })
  doc.fontSize(8.5).fillColor(SLATE).font('Helvetica')
     .text(
       `Km: ${r.kilometraje.toLocaleString('es-HN')}  ·  Tecnico: ${r.tecnico}`,
       rX + 10, cardY + 52, { width: CARD_W - 16, lineBreak: false, ellipsis: true },
     )
  doc.y = cardY + CARD_H + 16

  // ── DIAGNOSTICO ───────────────────────────────────────────────────────────────
  if (r.diagnostico) {
    sectionBar('SINTOMA REPORTADO POR EL CLIENTE')
    doc.fontSize(9).fillColor('#334155').font('Helvetica')
       .text(r.diagnostico.sintomaCliente, M + 12, doc.y, { width: CW - 24 })
    doc.moveDown(0.4)

    sectionBar('DIAGNOSTICO TECNICO')
    doc.fontSize(9).fillColor('#334155').font('Helvetica')
       .text(r.diagnostico.diagnosticoTecnico, M + 12, doc.y, { width: CW - 24 })
    doc.moveDown(0.4)

    sectionBar('TRABAJOS Y MATERIALES')

    const COLS = [
      { x: M,       w: 194, align: 'left'   as const, label: 'DESCRIPCION'  },
      { x: M + 198, w: 78,  align: 'left'   as const, label: 'TIPO'         },
      { x: M + 280, w: 38,  align: 'right'  as const, label: 'CANT.'        },
      { x: M + 322, w: 86,  align: 'right'  as const, label: 'P. UNITARIO'  },
      { x: M + 412, w: 83,  align: 'right'  as const, label: 'SUBTOTAL'     },
    ] as const

    const HDR_H = 20, ROW_H = 18
    const tY = doc.y

    // Table header — navy background + cyan bottom accent
    doc.rect(M, tY, CW, HDR_H).fill(NAVY)
    doc.rect(M, tY + HDR_H - 2, CW, 2).fill(CYAN)
    COLS.forEach(c => cell(c.label, c.x, tY, c.w, { align: c.align, bold: true, color: WHITE, size: 7.5 }))

    let ry = tY + HDR_H
    for (let i = 0; i < r.diagnostico.items.length; i++) {
      const item = r.diagnostico.items[i]!
      doc.rect(M, ry, CW, ROW_H).fill(i % 2 === 0 ? WHITE : LIGHT)
      doc.moveTo(M, ry + ROW_H).lineTo(M + CW, ry + ROW_H).strokeColor(BORDER).lineWidth(0.3).stroke()
      const vals = [
        item.descripcion,
        item.tipo === 'MATERIAL' ? 'Material' : 'Mano de obra',
        String(item.cantidad),
        fmtM(item.precioUnitario),
        fmtM(item.subtotal),
      ]
      COLS.forEach((c, ci) =>
        cell(vals[ci]!, c.x, ry, c.w, { align: c.align, color: ci === 0 ? DARK : SLATE }),
      )
      ry += ROW_H
    }

    // Subtotals
    const totX = M + 308, totW = CW - 308
    ;[
      { label: 'Materiales',   val: fmtM(r.diagnostico.totalMateriales) },
      { label: 'Mano de Obra', val: fmtM(r.diagnostico.totalManoObra)   },
    ].forEach(t => {
      doc.rect(totX, ry, totW, 18).fill(LIGHT).strokeColor(BORDER).lineWidth(0.3).stroke()
      doc.fontSize(8).fillColor(SLATE).font('Helvetica')
         .text(t.label, totX + 6, ry + 5, { width: 90, lineBreak: false })
      doc.fontSize(8).fillColor(DARK).font('Helvetica-Bold')
         .text(t.val, totX + 98, ry + 5, { width: totW - 106, align: 'right', lineBreak: false })
      ry += 18
    })

    // Grand total row — navy + cyan left accent
    doc.rect(totX, ry, totW, 24).fill(NAVY)
    doc.rect(totX, ry, 4, 24).fill(CYAN)
    doc.fontSize(9).fillColor(WHITE).font('Helvetica-Bold')
       .text('TOTAL GENERAL', totX + 10, ry + 7, { width: 110, lineBreak: false })
    doc.fontSize(10).fillColor(CYAN).font('Helvetica-Bold')
       .text(fmtM(r.diagnostico.totalGeneral), totX + 122, ry + 6, { width: totW - 130, align: 'right', lineBreak: false })
    doc.y = ry + 32
  }

  // ── NOTAS DEL TECNICO ─────────────────────────────────────────────────────────
  if (r.reparacion?.notas) {
    sectionBar('NOTAS DEL TECNICO')
    doc.fontSize(9).fillColor('#334155').font('Helvetica')
       .text(r.reparacion.notas, M + 12, doc.y, { width: CW - 24 })
    doc.moveDown(0.4)
  }

  // ── CONTROL DE CALIDAD ────────────────────────────────────────────────────────
  if (r.controlesCC.length > 0) {
    const lastCC = r.controlesCC[r.controlesCC.length - 1]!
    sectionBar('CONTROL DE CALIDAD')

    const aprobado = lastCC.aprobado
    const ccBg  = aprobado ? GREEN_BG  : RED_BG
    const ccAcc = aprobado ? GREEN     : RED
    const ccBdr = aprobado ? GREEN_BD  : RED_BD
    const ccH   = lastCC.observaciones ? 62 : 46
    const ccY   = doc.y

    doc.rect(M, ccY, CW, ccH).fill(ccBg).strokeColor(ccBdr).lineWidth(0.5).stroke()
    doc.rect(M, ccY, 4, ccH).fill(ccAcc)
    doc.fontSize(10.5).fillColor(ccAcc).font('Helvetica-Bold')
       .text(aprobado ? 'APROBADO' : 'RECHAZADO', M + 14, ccY + 11, { width: CW - 24, lineBreak: false })
    doc.fontSize(8.5).fillColor(SLATE).font('Helvetica')
       .text(
         `Revisado por: ${lastCC.revisadoPor}  ·  ${fmtD(lastCC.revisadoEn)}`,
         M + 14, ccY + 27, { width: CW - 24, lineBreak: false },
       )
    if (lastCC.observaciones) {
      doc.fontSize(8).fillColor(SLATE).font('Helvetica-Bold')
         .text('Obs: ', M + 14, ccY + 43, { continued: true, lineBreak: false })
      doc.font('Helvetica').text(lastCC.observaciones, { width: CW - 30 })
    }
    doc.y = ccY + ccH + 14
  }

  // ── ENCUESTA DE SATISFACCION ──────────────────────────────────────────────────
  if (r.encuesta?.respondidoEn) {
    sectionBar('ENCUESTA DE SATISFACCION')
    const enc = r.encuesta
    const eY  = doc.y

    ;[
      { label: 'Calidad',  val: enc.calidad!  },
      { label: 'Tiempo',   val: enc.tiempo!   },
      { label: 'Atencion', val: enc.atencion! },
    ].forEach(({ label, val }, idx) => {
      const rowY = eY + idx * 20
      doc.fontSize(8.5).fillColor(SLATE).font('Helvetica')
         .text(`${label}:`, M + 12, rowY, { width: 60, lineBreak: false })
      // Draw rating dots
      for (let d = 1; d <= 5; d++) {
        doc.fillColor(d <= val ? NAVY : BORDER)
           .circle(M + 78 + (d - 1) * 14, rowY + 5, 4).fill()
      }
      doc.fontSize(8.5).fillColor(DARK).font('Helvetica-Bold')
         .text(`${val}/5`, M + 154, rowY, { width: 30, lineBreak: false })
    })

    // Average block
    const avg  = +((enc.calidad! + enc.tiempo! + enc.atencion!) / 3).toFixed(1)
    const avgY = eY + 64
    doc.rect(M + 12, avgY, 190, 24).fill(NAVY)
    doc.rect(M + 12, avgY, 4, 24).fill(CYAN)
    doc.fontSize(8.5).fillColor(WHITE).font('Helvetica-Bold')
       .text('PROMEDIO GENERAL:', M + 22, avgY + 7, { width: 128, lineBreak: false })
    doc.fontSize(10).fillColor(CYAN).font('Helvetica-Bold')
       .text(`${avg} / 5`, M + 152, avgY + 6, { width: 46, lineBreak: false })
    doc.y = avgY + 34

    if (enc.comentario) {
      doc.fontSize(8.5).fillColor(SLATE).font('Helvetica-Bold')
         .text('"', M + 12, doc.y, { continued: true, lineBreak: false })
      doc.font('Helvetica').fillColor(SLATE)
         .text(`${enc.comentario}"`, { width: CW - 30 })
      doc.moveDown(0.3)
    }
  }

  // ── FOTOS ─────────────────────────────────────────────────────────────────────
  if (validFotos.length > 0) {
    doc.addPage()
    const pY = doc.page.margins.top

    doc.rect(M, pY, CW, 24).fill(NAVY)
    doc.rect(M, pY, 4, 24).fill(CYAN)
    doc.fontSize(9).fillColor(WHITE).font('Helvetica-Bold')
       .text(`FOTOS DE INGRESO (${validFotos.length})`, M + 12, pY + 8, { width: CW - 20, lineBreak: false })

    const imgW = 151, imgH = 113, gap = 9
    let fx = M, fy = pY + 34
    for (const buf of validFotos) {
      try {
        doc.rect(fx - 1, fy - 1, imgW + 2, imgH + 2).fill(BORDER)
        doc.image(buf, fx, fy, { width: imgW, height: imgH })
      } catch { /* skip corrupted image */ }
      fx += imgW + gap
      if (fx + imgW > M + CW) { fx = M; fy += imgH + gap }
    }
  }

  // ── FOOTER (all pages) ────────────────────────────────────────────────────────
  // El texto del pie va dentro del margen inferior de la pagina (footY cae por
  // debajo del limite de contenido). Sin desactivar temporalmente el margen,
  // PDFKit interpreta esa posicion como "no cabe" y crea una pagina en blanco
  // nueva para el texto en cada iteracion — dejando paginas fantasma vacias.
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

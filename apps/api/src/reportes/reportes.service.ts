import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { EstadoOT } from '@kings/shared'
import PDFDocument from 'pdfkit'
import * as https from 'https'
import * as http from 'http'
import * as path from 'path'
import * as fs from 'fs'

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  // ── Lista de OTs completadas ──────────────────────────────────────────────

  async getOrdenesCompletadas(params: {
    desde?: string
    hasta?: string
    tecnicoId?: string
    page: number
    pageSize: number
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

    const [total, ordenes] = await Promise.all([
      this.prisma.ordenTrabajo.count({ where }),
      this.prisma.ordenTrabajo.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          numero: true,
          placa: true,
          anio: true,
          color: true,
          createdAt: true,
          updatedAt: true,
          cliente: { select: { nombre: true, telefono: true } },
          marca:   { select: { nombre: true } },
          modelo:  { select: { nombre: true } },
          tecnico: { select: { id: true, nombre: true } },
          diagnostico: { select: { totalGeneral: true, aprobado: true } },
          entrega: { select: { entregadoEn: true } },
          encuesta: { select: { calidad: true, tiempo: true, atencion: true, respondidoEn: true } },
          _count: { select: { fotos: true } },
        },
      }),
    ])

    return {
      data: ordenes.map(o => ({
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
        fechaIngreso: o.createdAt.toISOString(),
        fechaEntrega: o.entrega?.entregadoEn?.toISOString() ?? null,
        tieneFotos: o._count.fotos > 0,
        encuestaPromedio: o.encuesta?.calidad && o.encuesta?.tiempo && o.encuesta?.atencion
          ? +((o.encuesta.calidad + o.encuesta.tiempo + o.encuesta.atencion) / 3).toFixed(1)
          : null,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  // ── Detalle completo de una OT para el reporte ────────────────────────────

  async getDetalleReporte(id: string) {
    const o = await this.prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        cliente:  true,
        marca:    true,
        modelo:   true,
        tecnico:  { select: { nombre: true, email: true } },
        fotos:    { orderBy: { createdAt: 'asc' } },
        diagnostico: { include: { items: { orderBy: { posicion: 'asc' } } } },
        reparacion:  { include: { tecnico: { select: { nombre: true } } } },
        controlesCC: {
          orderBy: { revisadoEn: 'asc' },
          include: { revisadoPor: { select: { nombre: true } } },
        },
        entrega:  { include: { registradoPor: { select: { nombre: true } } } },
        encuesta: true,
        eventos:  { orderBy: { createdAt: 'asc' }, include: { realizadoPor: { select: { nombre: true } } } },
      },
    })

    if (!o) throw new NotFoundException('OT no encontrada')

    const diag = o.diagnostico
    return {
      id: o.id,
      numero: o.numero,
      placa: o.placa,
      anio: o.anio,
      color: o.color,
      combustible: o.combustible,
      kilometraje: o.kilometraje,
      fechaIngreso: o.createdAt.toISOString(),
      cliente: { nombre: o.cliente.nombre, telefono: o.cliente.telefono, email: o.cliente.email },
      vehiculo: `${o.marca.nombre} ${o.modelo.nombre} ${o.anio}`,
      marca: o.marca.nombre,
      modelo: o.modelo.nombre,
      tecnico: o.tecnico.nombre,
      fotos: o.fotos.map(f => ({ id: f.id, url: f.url, createdAt: f.createdAt.toISOString() })),
      diagnostico: diag ? {
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
      } : null,
      reparacion: o.reparacion ? {
        tecnico: o.reparacion.tecnico.nombre,
        notas: o.reparacion.notas,
        iniciadaEn: o.reparacion.iniciadaEn?.toISOString() ?? null,
        finalizadaEn: o.reparacion.finalizadaEn?.toISOString() ?? null,
      } : null,
      controlesCC: o.controlesCC.map(cc => ({
        aprobado: cc.aprobado,
        observaciones: cc.observaciones,
        revisadoPor: cc.revisadoPor.nombre,
        revisadoEn: cc.revisadoEn.toISOString(),
      })),
      entrega: o.entrega ? {
        entregadoEn: o.entrega.entregadoEn?.toISOString() ?? null,
        registradoPor: o.entrega.registradoPor.nombre,
      } : null,
      encuesta: o.encuesta ? {
        calidad: o.encuesta.calidad,
        tiempo: o.encuesta.tiempo,
        atencion: o.encuesta.atencion,
        comentario: o.encuesta.comentario,
        respondidoEn: o.encuesta.respondidoEn?.toISOString() ?? null,
      } : null,
    }
  }

  // ── PDF del reporte ───────────────────────────────────────────────────────

  async generarPdfReporte(id: string) {
    const r = await this.getDetalleReporte(id)
    const config = await this.prisma.configuracionTaller.findFirst()

    // Pre-fetch everything before the doc is created
    let validFotos: Buffer[] = []
    if (r.fotos.length > 0) {
      const bufs = await Promise.all(r.fotos.slice(0, 6).map(f => this.fetchUrl(f.url).catch(() => null)))
      validFotos = bufs.filter((b): b is Buffer => b !== null)
    }

    let logoBuffer: Buffer | null = null
    if (config?.logoUrl) {
      try { logoBuffer = await this.fetchUrl(config.logoUrl) } catch { /* noop */ }
    }
    if (!logoBuffer) {
      // Look for any .jpeg/.jpg/.png in the project-root Logo folder
      const logoDir = path.join(__dirname, '..', '..', '..', '..', 'Logo')
      if (fs.existsSync(logoDir)) {
        const logoFile = fs.readdirSync(logoDir).find(f => /\.(jpe?g|png)$/i.test(f))
        if (logoFile) logoBuffer = fs.readFileSync(path.join(logoDir, logoFile))
      }
    }
    if (!logoBuffer) {
      const local = path.join(__dirname, '..', 'cotizacion', 'logo.jpeg')
      if (fs.existsSync(local)) logoBuffer = fs.readFileSync(local)
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: true, bufferPages: true })
    const filename = `reporte-${r.numero}.pdf`
    const tallerNombre = config?.nombre ?? 'Kings Auto Diagnosticos'
    const M = 50, CW = 495
    const fmtM = (n: number) => `L. ${n.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
    const fmtD = (iso: string | null) =>
      iso ? new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' }) : '---'

    // ── Helper: grey label bar above each section ──────────────────────────
    const sectionBar = (title: string) => {
      doc.moveDown(0.8)
      const sy = doc.y
      doc.rect(M, sy, CW, 16).fill('#e2e8f0')
      doc.fontSize(7.5).fillColor('#334155').font('Helvetica-Bold')
         .text(title, M + 6, sy + 4, { width: CW - 12, lineBreak: false })
      doc.y = sy + 20
    }

    // ── Helper: draw a table cell without advancing the line cursor ────────
    const cell = (
      text: string, x: number, y: number, w: number,
      opts: { align?: 'left' | 'right'; bold?: boolean; color?: string; size?: number } = {},
    ) => {
      doc.fontSize(opts.size ?? 8).fillColor(opts.color ?? '#0f172a')
         .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
         .text(text, x + 3, y + 4, { width: w - 6, lineBreak: false, align: opts.align ?? 'left', ellipsis: true })
    }

    // ── ENCABEZADO ─────────────────────────────────────────────────────────
    const hY = doc.y
    if (logoBuffer) {
      doc.image(logoBuffer, M, hY, { fit: [80, 50] })
      doc.fontSize(14).fillColor('#0f172a').font('Helvetica-Bold')
         .text(tallerNombre, M + 90, hY, { width: CW - 90, align: 'right', lineBreak: false })
      let infoY = hY + 18
      if (config?.telefono) { doc.fontSize(8).fillColor('#64748b').font('Helvetica').text(config.telefono, M + 90, infoY, { width: CW - 90, align: 'right', lineBreak: false }); infoY += 12 }
      if (config?.email)    { doc.fontSize(8).fillColor('#64748b').font('Helvetica').text(config.email,    M + 90, infoY, { width: CW - 90, align: 'right', lineBreak: false }) }
      doc.y = hY + 58
    } else {
      doc.fontSize(14).fillColor('#0f172a').font('Helvetica-Bold').text(tallerNombre, { align: 'center' })
      if (config?.telefono) doc.fontSize(8).fillColor('#64748b').font('Helvetica').text(config.telefono, { align: 'center' })
      if (config?.email)    doc.fontSize(8).fillColor('#64748b').font('Helvetica').text(config.email,    { align: 'center' })
      doc.moveDown(0.5)
    }

    doc.moveTo(M, doc.y).lineTo(M + CW, doc.y).strokeColor('#cbd5e1').lineWidth(0.8).stroke()
    doc.moveDown(1)

    doc.fontSize(13).fillColor('#0f172a').font('Helvetica-Bold').text('REPORTE DE ORDEN DE TRABAJO', { align: 'center' })
    doc.moveDown(0.3)
    doc.fontSize(9).fillColor('#64748b').font('Helvetica')
       .text(`No. ${r.numero}  |  Ingreso: ${fmtD(r.fechaIngreso)}  |  Entrega: ${fmtD(r.entrega?.entregadoEn ?? null)}`, { align: 'center' })
    doc.moveDown(1.5)

    // ── CLIENTE / VEHÍCULO ─────────────────────────────────────────────────
    const bW = (CW - 12) / 2   // ~241
    const bH = 75
    const bY = doc.y

    doc.rect(M, bY, bW, bH).fill('#f8fafc').strokeColor('#e2e8f0').lineWidth(0.5).stroke()
    doc.fontSize(6.5).fillColor('#94a3b8').font('Helvetica-Bold').text('CLIENTE',          M + 8, bY + 7,  { width: bW - 16, lineBreak: false })
    doc.fontSize(10) .fillColor('#0f172a') .font('Helvetica-Bold').text(r.cliente.nombre,   M + 8, bY + 18, { width: bW - 16, lineBreak: false, ellipsis: true })
    doc.fontSize(8.5).fillColor('#475569') .font('Helvetica')      .text(r.cliente.telefono, M + 8, bY + 32, { width: bW - 16, lineBreak: false })
    if (r.cliente.email) doc.fontSize(8).fillColor('#475569').font('Helvetica').text(r.cliente.email, M + 8, bY + 44, { width: bW - 16, lineBreak: false, ellipsis: true })

    const rX = M + bW + 12
    doc.rect(rX, bY, bW, bH).fill('#f8fafc').strokeColor('#e2e8f0').lineWidth(0.5).stroke()
    doc.fontSize(6.5).fillColor('#94a3b8').font('Helvetica-Bold').text('VEHICULO',                      rX + 8, bY + 7,  { width: bW - 16, lineBreak: false })
    doc.fontSize(10) .fillColor('#0f172a') .font('Helvetica-Bold').text(r.vehiculo,                     rX + 8, bY + 18, { width: bW - 16, lineBreak: false, ellipsis: true })
    doc.fontSize(8.5).fillColor('#475569') .font('Helvetica')      .text(`Placa: ${r.placa}  |  Color: ${r.color}`,         rX + 8, bY + 32, { width: bW - 16, lineBreak: false })
    doc.fontSize(8.5).fillColor('#475569') .font('Helvetica')      .text(`Km: ${r.kilometraje.toLocaleString('es-HN')}  |  Tecnico: ${r.tecnico}`, rX + 8, bY + 44, { width: bW - 16, lineBreak: false, ellipsis: true })

    doc.y = bY + bH + 16

    // ── SÍNTOMA Y DIAGNÓSTICO ──────────────────────────────────────────────
    if (r.diagnostico) {
      sectionBar('SINTOMA REPORTADO POR EL CLIENTE')
      doc.fontSize(9).fillColor('#334155').font('Helvetica')
         .text(r.diagnostico.sintomaCliente, M + 6, doc.y, { width: CW - 12 })
      doc.moveDown(0.4)

      sectionBar('DIAGNOSTICO TECNICO')
      doc.fontSize(9).fillColor('#334155').font('Helvetica')
         .text(r.diagnostico.diagnosticoTecnico, M + 6, doc.y, { width: CW - 12 })
      doc.moveDown(0.4)

      sectionBar('TRABAJOS Y MATERIALES')

      // Column layout: [x, width, align]
      const COLS = [
        { x: M,        w: 196, align: 'left'  as const },  // descripcion
        { x: M + 200,  w: 76,  align: 'left'  as const },  // tipo
        { x: M + 280,  w: 38,  align: 'right' as const },  // cant
        { x: M + 322,  w: 86,  align: 'right' as const },  // precio
        { x: M + 412,  w: 83,  align: 'right' as const },  // subtotal
      ] as const
      const HDR_H = 18, ROW_H = 17

      // Header
      const tY = doc.y
      doc.rect(M, tY, CW, HDR_H).fill('#1e293b')
      const hdrLabels = ['DESCRIPCION', 'TIPO', 'CANT.', 'P. UNIT.', 'SUBTOTAL']
      COLS.forEach((c, i) => cell(hdrLabels[i]!, c.x, tY, c.w, { align: c.align, bold: true, color: '#ffffff', size: 7 }))

      // Rows
      let ry = tY + HDR_H
      for (const [i, item] of r.diagnostico.items.entries()) {
        doc.rect(M, ry, CW, ROW_H).fill(i % 2 === 0 ? '#ffffff' : '#f8fafc')
        const vals = [item.descripcion, item.tipo === 'MATERIAL' ? 'Material' : 'Mano de obra', String(item.cantidad), fmtM(item.precioUnitario), fmtM(item.subtotal)]
        COLS.forEach((c, ci) => cell(vals[ci]!, c.x, ry, c.w, { align: c.align }))
        ry += ROW_H
      }

      // Subtotals
      const totX = M + 308, totW = CW - 308
      ;[
        { label: 'Materiales',   val: fmtM(r.diagnostico.totalMateriales), bg: '#f1f5f9', bold: false },
        { label: 'Mano de Obra', val: fmtM(r.diagnostico.totalManoObra),   bg: '#f1f5f9', bold: false },
      ].forEach(t => {
        doc.rect(totX, ry, totW, 16).fill(t.bg)
        doc.fontSize(8).fillColor('#64748b').font('Helvetica').text(t.label, totX + 5, ry + 4, { width: 90, lineBreak: false })
        doc.fontSize(8).fillColor('#0f172a').font('Helvetica-Bold').text(t.val, totX + 100, ry + 4, { width: totW - 108, align: 'right', lineBreak: false })
        ry += 16
      })
      doc.rect(totX, ry, totW, 20).fill('#0f172a')
      doc.fontSize(9).fillColor('#ffffff').font('Helvetica-Bold').text('TOTAL GENERAL', totX + 5, ry + 5, { width: 100, lineBreak: false })
      doc.fontSize(9).fillColor('#ffffff').font('Helvetica-Bold').text(fmtM(r.diagnostico.totalGeneral), totX + 108, ry + 5, { width: totW - 116, align: 'right', lineBreak: false })
      doc.y = ry + 26
    }

    // ── NOTAS DEL TÉCNICO ─────────────────────────────────────────────────
    if (r.reparacion?.notas) {
      sectionBar('NOTAS DEL TECNICO')
      doc.fontSize(9).fillColor('#334155').font('Helvetica')
         .text(r.reparacion.notas, M + 6, doc.y, { width: CW - 12 })
      doc.moveDown(0.4)
    }

    // ── CONTROL DE CALIDAD ────────────────────────────────────────────────
    if (r.controlesCC.length > 0) {
      const lastCC = r.controlesCC[r.controlesCC.length - 1]!
      sectionBar('CONTROL DE CALIDAD')
      const ccBg    = lastCC.aprobado ? '#f0fdf4' : '#fef2f2'
      const ccBdr   = lastCC.aprobado ? '#86efac' : '#fca5a5'
      const ccColor = lastCC.aprobado ? '#16a34a' : '#dc2626'
      const ccH = lastCC.observaciones ? 54 : 40
      const ccY = doc.y
      doc.rect(M, ccY, CW, ccH).fill(ccBg).strokeColor(ccBdr).lineWidth(0.5).stroke()
      doc.fontSize(10).fillColor(ccColor).font('Helvetica-Bold').text(lastCC.aprobado ? 'APROBADO' : 'RECHAZADO', M + 10, ccY + 9, { width: CW - 20, lineBreak: false })
      doc.fontSize(8.5).fillColor('#475569').font('Helvetica').text(`Revisado por: ${lastCC.revisadoPor}  |  ${fmtD(lastCC.revisadoEn)}`, M + 10, ccY + 23, { width: CW - 20 })
      if (lastCC.observaciones) doc.text(`Obs: ${lastCC.observaciones}`, M + 10, ccY + 37, { width: CW - 20 })
      doc.y = ccY + ccH + 12
    }

    // ── ENCUESTA ──────────────────────────────────────────────────────────
    if (r.encuesta?.respondidoEn) {
      sectionBar('ENCUESTA DE SATISFACCION')
      const enc = r.encuesta
      const prom = ((enc.calidad! + enc.tiempo! + enc.atencion!) / 3).toFixed(1)
      const stars = (v: number) => '[' + '*'.repeat(v) + '-'.repeat(5 - v) + ']'
      const eY = doc.y
      doc.fontSize(9).fillColor('#334155').font('Helvetica')
         .text(`Calidad del trabajo:  ${stars(enc.calidad!)}  ${enc.calidad}/5`, M + 6, eY,      { width: CW - 12, lineBreak: false })
         .text(`Tiempo de entrega:    ${stars(enc.tiempo!)}  ${enc.tiempo}/5`,   M + 6, eY + 14, { width: CW - 12, lineBreak: false })
         .text(`Atencion al cliente:  ${stars(enc.atencion!)}  ${enc.atencion}/5`, M + 6, eY + 28, { width: CW - 12, lineBreak: false })
      doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold')
         .text(`Promedio general: ${prom} / 5`, M + 6, eY + 44, { width: CW - 12, lineBreak: false })
      doc.y = eY + 58
      if (enc.comentario) {
        doc.fontSize(8.5).fillColor('#64748b').font('Helvetica')
           .text(`"${enc.comentario}"`, M + 6, doc.y, { width: CW - 12 })
        doc.moveDown(0.4)
      }
      doc.moveDown(0.4)
    }

    // ── FOTOS ─────────────────────────────────────────────────────────────
    if (validFotos.length > 0) {
      doc.addPage()
      const pY = doc.page.margins.top
      doc.rect(M, pY, CW, 18).fill('#e2e8f0')
      doc.fontSize(8).fillColor('#334155').font('Helvetica-Bold')
         .text(`FOTOS DE INGRESO (${validFotos.length})`, M + 6, pY + 5, { width: CW - 12, lineBreak: false })
      const imgW = 152, imgH = 114, gap = 9
      let fx = M, fy = pY + 26
      for (const buf of validFotos) {
        try { doc.image(buf, fx, fy, { width: imgW, height: imgH }) } catch { /* skip */ }
        fx += imgW + gap
        if (fx + imgW > M + CW) { fx = M; fy += imgH + gap }
      }
    }

    // ── PIE DE PÁGINA ─────────────────────────────────────────────────────
    const range = doc.bufferedPageRange()
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i)
      const footY = doc.page.height - 38
      doc.moveTo(M, footY - 6).lineTo(M + CW, footY - 6).strokeColor('#e2e8f0').lineWidth(0.5).stroke()
      doc.fontSize(7).fillColor('#94a3b8').font('Helvetica')
         .text(
           `${tallerNombre}  |  Generado el ${new Date().toLocaleDateString('es-HN')}  |  Pag. ${i - range.start + 1} de ${range.count}`,
           M, footY, { align: 'center', width: CW },
         )
    }

    doc.end()
    return { stream: doc, filename }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

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

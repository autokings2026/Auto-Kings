import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common'
import { Response } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ReportesService } from './reportes.service'

@Controller('reportes')
@UseGuards(JwtAuthGuard)
export class ReportesController {
  constructor(private svc: ReportesService) {}

  /** GET /reportes/ordenes — lista paginada de OTs completadas */
  @Get('ordenes')
  getOrdenes(
    @Query('page')      page      = '1',
    @Query('pageSize')  pageSize  = '20',
    @Query('desde')     desde?: string,
    @Query('hasta')     hasta?: string,
    @Query('tecnicoId') tecnicoId?: string,
  ) {
    return this.svc.getOrdenesCompletadas({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      desde,
      hasta,
      tecnicoId,
    })
  }

  /** GET /reportes/ordenes/:id — detalle completo para pantalla */
  @Get('ordenes/:id')
  getDetalle(@Param('id') id: string) {
    return this.svc.getDetalleReporte(id)
  }

  /** GET /reportes/ordenes/:id/pdf — descarga PDF */
  @Get('ordenes/:id/pdf')
  async getPdf(@Param('id') id: string, @Res() res: Response) {
    const { stream, filename } = await this.svc.generarPdfReporte(id)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    stream.pipe(res)
  }
}

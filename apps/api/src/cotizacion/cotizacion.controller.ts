import { Controller, Get, Post, Body, Param, Res, BadRequestException } from '@nestjs/common'
import { IsBoolean, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { CotizacionService } from './cotizacion.service'

class ResponderDto {
  @IsBoolean()
  aprobado!: boolean

  @IsOptional()
  @IsString()
  mensaje?: string
}

@Controller('cotizacion')
export class CotizacionController {
  constructor(private svc: CotizacionService) {}

  /** GET /cotizacion/public/:token — datos para la página pública */
  @Get('public/:token')
  getPublic(@Param('token') token: string) {
    return this.svc.findByToken(token)
  }

  /** POST /cotizacion/public/:token/responder — cliente aprueba o rechaza */
  @Post('public/:token/responder')
  responder(@Param('token') token: string, @Body() body: ResponderDto) {
    if (typeof body.aprobado !== 'boolean') throw new BadRequestException('aprobado requerido')
    return this.svc.responder(token, body.aprobado, body.mensaje)
  }

  /** GET /cotizacion/pdf/:token — descarga PDF (también público para que el cliente lo vea) */
  @Get('pdf/:token')
  async descargarPdf(@Param('token') token: string, @Res() res: Response) {
    const { stream, filename } = await this.svc.generarPdf(token)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    stream.pipe(res)
  }
}

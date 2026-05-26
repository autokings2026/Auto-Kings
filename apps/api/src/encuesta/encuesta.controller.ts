import { Controller, Get, Post, Body, Param, BadRequestException } from '@nestjs/common'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { EncuestaService } from './encuesta.service'

class SubmitEncuestaDto {
  @IsInt() @Min(1) @Max(5)
  calidad!: number

  @IsInt() @Min(1) @Max(5)
  tiempo!: number

  @IsInt() @Min(1) @Max(5)
  atencion!: number

  @IsOptional()
  @IsString()
  comentario?: string
}

@Controller('encuesta')
export class EncuestaController {
  constructor(private svc: EncuestaService) {}

  /** GET /encuesta/:token — datos públicos de la encuesta */
  @Get(':token')
  findByToken(@Param('token') token: string) {
    return this.svc.findByToken(token)
  }

  /** POST /encuesta/:token — cliente envía sus respuestas */
  @Post(':token')
  responder(@Param('token') token: string, @Body() dto: SubmitEncuestaDto) {
    return this.svc.responder(token, dto)
  }
}

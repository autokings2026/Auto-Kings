import { Module } from '@nestjs/common'
import { EncuestaController } from './encuesta.controller'
import { EncuestaService } from './encuesta.service'

@Module({ controllers: [EncuestaController], providers: [EncuestaService] })
export class EncuestaModule {}

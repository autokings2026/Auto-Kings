import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common'
import { IsBoolean, IsOptional, IsString } from 'class-validator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { InboxService } from './inbox.service'
import type { SessionUser } from '@kings/shared'
import { TipoPlantillaWA } from '@kings/shared'

class EnviarMensajeDto {
  @IsString() clienteId!: string
  @IsString() texto!: string
  @IsOptional() @IsString() plantillaUsada?: TipoPlantillaWA
  @IsOptional() @IsString() ordenId?: string
}

class EntranteDto {
  @IsString() clienteId!: string
  @IsString() texto!: string
}

class UpsertPlantillaDto {
  @IsString() nombre!: string
  @IsString() contenido!: string
  @IsBoolean() activa!: boolean
}

@Controller('inbox')
@UseGuards(JwtAuthGuard)
export class InboxController {
  constructor(private svc: InboxService) {}

  /** GET /inbox/conversaciones — lista de clientes con último mensaje */
  @Get('conversaciones')
  getConversaciones() {
    return this.svc.getConversaciones()
  }

  /** GET /inbox/conversaciones/:clienteId — hilo de mensajes */
  @Get('conversaciones/:clienteId')
  getMensajes(@Param('clienteId') clienteId: string) {
    return this.svc.getMensajes(clienteId)
  }

  /** POST /inbox/mensajes — registrar saliente + obtener wa.me link */
  @Post('mensajes')
  enviarMensaje(@Body() dto: EnviarMensajeDto, @CurrentUser() user: SessionUser) {
    return this.svc.enviarMensaje({ ...dto, userId: user.id })
  }

  /** POST /inbox/mensajes/entrante — registrar respuesta del cliente */
  @Post('mensajes/entrante')
  registrarEntrante(@Body() dto: EntranteDto, @CurrentUser() user: SessionUser) {
    return this.svc.registrarEntrante({ ...dto, userId: user.id })
  }

  /** GET /inbox/plantillas — todas las plantillas */
  @Get('plantillas')
  getPlantillas() {
    return this.svc.getPlantillas()
  }

  /** PATCH /inbox/plantillas/:tipo — crear o actualizar plantilla por tipo */
  @Patch('plantillas/:tipo')
  upsertPlantilla(@Param('tipo') tipo: TipoPlantillaWA, @Body() dto: UpsertPlantillaDto) {
    return this.svc.upsertPlantilla(tipo, dto)
  }
}

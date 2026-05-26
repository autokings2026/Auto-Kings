import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common'
import { Type } from 'class-transformer'
import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { Prisma } from '@kings/database'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { RolUsuario } from '@kings/shared'
import { ConfigTallerService } from './config-taller.service'

class UpdateConfigDto {
  @IsOptional() @IsString()  nombre?: string
  @IsOptional() @IsString()  telefono?: string
  @IsOptional() @IsString()  email?: string
  @IsOptional() @IsString()  direccion?: string
  @IsOptional() @IsString()  logoUrl?: string
  @IsOptional() @IsArray()   horariosAtencion?: Prisma.InputJsonArray
  @IsOptional() @IsNumber() @Min(15) @Type(() => Number) duracionSlotMinutos?: number
  @IsOptional() @IsNumber() @Min(1)  @Type(() => Number) maxCitasPorSlot?: number
  @IsOptional() @IsNumber() @Min(1)  @Type(() => Number) alertaAmarillaMinutos?: number
  @IsOptional() @IsNumber() @Min(1)  @Type(() => Number) alertaRojaMinutos?: number
}

@Controller('config')
@UseGuards(JwtAuthGuard)
export class ConfigTallerController {
  constructor(private svc: ConfigTallerService) {}

  /** GET /config/taller */
  @Get('taller')
  get() {
    return this.svc.get()
  }

  /** PATCH /config/taller — solo ADMIN */
  @Patch('taller')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  update(@Body() dto: UpdateConfigDto) {
    return this.svc.update(dto)
  }
}

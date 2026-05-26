import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { CitasService } from './citas.service'
import { CreateCitaDto } from './dto/create-cita.dto'
import { QueryCitasDto, SlotQueryDto } from './dto/query-citas.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { EstadoCita } from '@kings/shared'
import { IsEnum } from 'class-validator'

class UpdateEstadoDto {
  @IsEnum(EstadoCita)
  estado!: EstadoCita
}

@Controller('citas')
export class CitasController {
  constructor(private citasService: CitasService) {}

  // ── Rutas públicas (sin autenticación) ────────────────────────────────────

  /** GET /citas/slots?fecha=YYYY-MM-DD — slots disponibles para una fecha */
  @Get('slots')
  getSlotsDisponibles(@Query() query: SlotQueryDto) {
    return this.citasService.getSlotsDisponibles(query.fecha)
  }

  /** POST /citas — crear cita desde el formulario público /reservar */
  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateCitaDto) {
    return this.citasService.create(dto)
  }

  // ── Rutas internas (requieren JWT) ────────────────────────────────────────

  /** GET /citas — lista paginada para empleados */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: QueryCitasDto) {
    return this.citasService.findAll(query)
  }

  /** GET /citas/:id — detalle de una cita */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.citasService.findOne(id)
  }

  /** PATCH /citas/:id/estado — confirmar, cancelar, no asistió */
  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard)
  updateEstado(@Param('id') id: string, @Body() dto: UpdateEstadoDto) {
    return this.citasService.updateEstado(id, dto.estado)
  }
}

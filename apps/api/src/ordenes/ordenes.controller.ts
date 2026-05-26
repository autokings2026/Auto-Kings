import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { OrdenesService } from './ordenes.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { CreateOrdenDto } from './dto/create-orden.dto'
import { QueryOrdenesDto } from './dto/query-ordenes.dto'
import {
  AddFotoDto,
  AprobacionCotizacionDto,
  CreateCCDto,
  NotaInternaDto,
  RegistrarEntregaDto,
  SaveDiagnosticoDto,
  SaveReparacionDto,
} from './dto/fase-dtos'
import type { SessionUser } from '@kings/shared'
import { RolUsuario } from '@kings/shared'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('ordenes')
@UseGuards(JwtAuthGuard)
export class OrdenesController {
  constructor(private ordenesService: OrdenesService) {}

  // ── CRUD base ──────────────────────────────────────────────────────────────

  /** POST /ordenes — crear OT desde cita o directa */
  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateOrdenDto, @CurrentUser() user: SessionUser) {
    return this.ordenesService.create(dto, user.id)
  }

  /** GET /ordenes — lista paginada */
  @Get()
  findAll(@Query() query: QueryOrdenesDto) {
    return this.ordenesService.findAll(query)
  }

  /** GET /ordenes/stats — stats para dashboard */
  @Get('stats')
  getStats() {
    return this.ordenesService.getDashboardStats()
  }

  /** GET /ordenes/:id — detalle completo */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordenesService.findOne(id)
  }

  // ── State machine ──────────────────────────────────────────────────────────

  /** PATCH /ordenes/:id/avanzar — avanzar a siguiente fase */
  @Patch(':id/avanzar')
  avanzarFase(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    return this.ordenesService.avanzarFase(id, user.id)
  }

  // ── Fase 1: Fotos ──────────────────────────────────────────────────────────

  /** POST /ordenes/:id/fotos */
  @Post(':id/fotos')
  @HttpCode(201)
  addFoto(
    @Param('id') id: string,
    @Body() dto: AddFotoDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.ordenesService.addFoto(id, dto, user.id)
  }

  /** DELETE /ordenes/:id/fotos/:fotoId */
  @Delete(':id/fotos/:fotoId')
  deleteFoto(@Param('id') id: string, @Param('fotoId') fotoId: string) {
    return this.ordenesService.deleteFoto(id, fotoId)
  }

  // ── Fase 2: Diagnóstico + Cotización ──────────────────────────────────────

  /** PUT /ordenes/:id/diagnostico — guardar/actualizar diagnóstico */
  @Put(':id/diagnostico')
  saveDiagnostico(
    @Param('id') id: string,
    @Body() dto: SaveDiagnosticoDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.ordenesService.saveDiagnostico(id, dto, user.id)
  }

  /** PATCH /ordenes/:id/diagnostico/aprobacion — registrar respuesta del cliente */
  @Patch(':id/diagnostico/aprobacion')
  registrarAprobacion(
    @Param('id') id: string,
    @Body() dto: AprobacionCotizacionDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.ordenesService.registrarAprobacion(id, dto, user.id)
  }

  // ── Fase 3: Reparación ────────────────────────────────────────────────────

  /** PUT /ordenes/:id/reparacion — guardar notas; {finalizada:true} avanza a CC */
  @Put(':id/reparacion')
  saveReparacion(
    @Param('id') id: string,
    @Body() dto: SaveReparacionDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.ordenesService.saveReparacion(id, dto, user.id)
  }

  // ── Fase 4: Control de Calidad ────────────────────────────────────────────

  /** POST /ordenes/:id/cc — registrar resultado CC (solo ADMIN y CONTROL_CALIDAD) */
  @Post(':id/cc')
  @HttpCode(201)
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.CONTROL_CALIDAD)
  registrarCC(
    @Param('id') id: string,
    @Body() dto: CreateCCDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.ordenesService.registrarCC(id, dto, user.id)
  }

  // ── Fase 5: Entrega ───────────────────────────────────────────────────────

  /** PATCH /ordenes/:id/entrega — registrar entrega al cliente */
  @Patch(':id/entrega')
  registrarEntrega(
    @Param('id') id: string,
    @Body() dto: RegistrarEntregaDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.ordenesService.registrarEntrega(id, dto, user.id)
  }

  // ── Utilidades ────────────────────────────────────────────────────────────

  /** POST /ordenes/:id/notas — agregar nota interna */
  @Post(':id/notas')
  @HttpCode(201)
  agregarNota(
    @Param('id') id: string,
    @Body() dto: NotaInternaDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.ordenesService.agregarNota(id, dto, user.id)
  }

  /** GET /ordenes/:id/eventos — línea de tiempo */
  @Get(':id/eventos')
  getEventos(@Param('id') id: string) {
    return this.ordenesService.getEventos(id)
  }

  /** GET /ordenes/:id/whatsapp/cotizacion — genera link wa.me con mensaje pre-llenado */
  @Get(':id/whatsapp/cotizacion')
  getWhatsappCotizacion(@Param('id') id: string) {
    return this.ordenesService.getWhatsappCotizacion(id)
  }
}

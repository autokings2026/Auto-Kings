import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { TipoItemCotizacion } from '@kings/shared'

// ── Fase 1: Fotos ──────────────────────────────────────────────────────────────

export class AddFotoDto {
  @IsString()
  url!: string

  @IsString()
  publicId!: string
}

// ── Fase 2: Diagnóstico + Cotización ──────────────────────────────────────────

export class ItemCotizacionDto {
  @IsString()
  descripcion!: string

  @IsEnum(TipoItemCotizacion)
  tipo!: TipoItemCotizacion

  @IsNumber()
  @Min(0)
  cantidad!: number

  @IsNumber()
  @Min(0)
  precioUnitario!: number

  @IsOptional()
  @IsInt()
  posicion?: number
}

export class SaveDiagnosticoDto {
  @IsString()
  sintomaCliente!: string

  @IsString()
  diagnosticoTecnico!: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemCotizacionDto)
  items!: ItemCotizacionDto[]
}

export class AprobacionCotizacionDto {
  @IsBoolean()
  aprobado!: boolean

  @IsOptional()
  @IsString()
  mensajeAprobacion?: string
}

// ── Fase 3: Reparación ────────────────────────────────────────────────────────

export class SaveReparacionDto {
  @IsOptional()
  @IsString()
  notas?: string

  // true = marcar como finalizada y avanzar automáticamente a CC
  @IsOptional()
  @IsBoolean()
  finalizada?: boolean
}

// ── Fase 4: Control de calidad ────────────────────────────────────────────────

export class CreateCCDto {
  @IsBoolean()
  aprobado!: boolean

  @IsOptional()
  @IsString()
  observaciones?: string
}

// ── Fase 5: Entrega ───────────────────────────────────────────────────────────

export class RegistrarEntregaDto {
  // Si se omite, se usa new Date()
  @IsOptional()
  @IsString()
  entregadoEn?: string
}

// ── Nota interna ──────────────────────────────────────────────────────────────

export class NotaInternaDto {
  @IsString()
  texto!: string
}

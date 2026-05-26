import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  MinLength,
} from 'class-validator'
import { TipoCombustible } from '@kings/shared'

export class CreateOrdenDto {
  // Opcional: crear OT desde una cita existente
  @IsOptional()
  @IsString()
  citaId?: string

  // Requeridos solo si no hay citaId (walk-in directo)
  @IsOptional()
  @IsString()
  clienteId?: string

  @IsOptional()
  @IsString()
  marcaId?: string

  @IsOptional()
  @IsString()
  modeloId?: string

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2026)
  anio?: number

  @IsOptional()
  @IsString()
  @MinLength(2)
  placa?: string

  // Siempre requeridos
  @IsString()
  tecnicoId!: string

  @IsString()
  @MinLength(1)
  color!: string

  @IsEnum(TipoCombustible)
  combustible!: TipoCombustible

  @IsInt()
  @Min(0)
  kilometraje!: number
}

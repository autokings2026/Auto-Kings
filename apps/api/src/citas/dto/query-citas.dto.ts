import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { EstadoCita } from '@kings/shared'

export class QueryCitasDto {
  @IsOptional()
  @IsEnum(['hoy', 'semana', 'mes', 'todas'])
  rango?: 'hoy' | 'semana' | 'mes' | 'todas'

  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsEnum(EstadoCita)
  estado?: EstadoCita

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number
}

export class SlotQueryDto {
  @IsString()
  fecha!: string // YYYY-MM-DD
}

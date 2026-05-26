import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { FaseOT, EstadoOT } from '@kings/shared'

export class QueryOrdenesDto {
  @IsOptional()
  @IsEnum(FaseOT)
  fase?: FaseOT

  @IsOptional()
  @IsEnum(EstadoOT)
  estado?: EstadoOT

  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsString()
  tecnicoId?: string

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

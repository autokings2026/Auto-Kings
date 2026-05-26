import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator'

export class CreateCitaDto {
  // Datos del cliente
  @IsString()
  @MinLength(2)
  nombre!: string

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string

  @IsString()
  @MinLength(8, { message: 'Teléfono inválido' })
  telefono!: string

  // Datos del vehículo
  @IsString()
  marcaId!: string

  @IsString()
  modeloId!: string

  @IsInt()
  @Min(2000)
  @Max(2026)
  anio!: number

  @IsString()
  @MinLength(2)
  placa!: string

  // Fecha y hora
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha debe ser YYYY-MM-DD' })
  fecha!: string

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Hora debe ser HH:MM' })
  hora!: string

  @IsOptional()
  @IsString()
  comentarios?: string
}

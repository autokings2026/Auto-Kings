import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateClienteDto {
  @IsString()
  @MinLength(2)
  nombre!: string

  @IsString()
  @MinLength(8)
  telefono!: string

  @IsOptional()
  @IsEmail()
  email?: string
}

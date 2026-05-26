import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { JwtPayload, RolUsuario } from '@kings/shared'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    })

    if (!user || !user.activo) {
      throw new UnauthorizedException('Credenciales inválidas')
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password)
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas')
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol as RolUsuario,
    }

    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol as RolUsuario,
      },
    }
  }

  async findAllUsuarios() {
    return this.prisma.user.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, email: true, rol: true },
      orderBy: { nombre: 'asc' },
    })
  }

  async validateToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
    })
    if (!user || !user.activo) throw new UnauthorizedException()
    return user
  }
}

import { Controller, Post, Get, Body, HttpCode, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { CurrentUser } from './decorators/current-user.decorator'
import { SessionUser } from '@kings/shared'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: SessionUser) {
    return user
  }

  @Get('usuarios')
  @UseGuards(JwtAuthGuard)
  getUsuarios() {
    return this.authService.findAllUsuarios()
  }
}

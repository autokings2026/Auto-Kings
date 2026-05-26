import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common'
import { ClientesService } from './clientes.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClientesController {
  constructor(private clientesService: ClientesService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.clientesService.findAll(search)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientesService.findOne(id)
  }
}

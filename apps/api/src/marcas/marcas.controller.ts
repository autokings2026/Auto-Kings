import { Controller, Get, Param } from '@nestjs/common'
import { MarcasService } from './marcas.service'

@Controller('marcas')
export class MarcasController {
  constructor(private marcasService: MarcasService) {}

  @Get()
  findAll() {
    return this.marcasService.findAll()
  }

  @Get(':id/modelos')
  findModelos(@Param('id') id: string) {
    return this.marcasService.findModelosByMarca(id)
  }
}

import { Module } from '@nestjs/common'
import { CitasController } from './citas.controller'
import { CitasService } from './citas.service'
import { ClientesModule } from '../clientes/clientes.module'

@Module({
  imports: [ClientesModule],
  controllers: [CitasController],
  providers: [CitasService],
  exports: [CitasService],
})
export class CitasModule {}

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { MarcasModule } from './marcas/marcas.module'
import { ClientesModule } from './clientes/clientes.module'
import { CitasModule } from './citas/citas.module'
import { EmailModule } from './email/email.module'
import { OrdenesModule } from './ordenes/ordenes.module'
import { CloudinaryModule } from './cloudinary/cloudinary.module'
import { CotizacionModule } from './cotizacion/cotizacion.module'
import { EncuestaModule } from './encuesta/encuesta.module'
import { InboxModule } from './inbox/inbox.module'
import { ReportesModule } from './reportes/reportes.module'
import { ConfigTallerModule } from './config-taller/config-taller.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    EmailModule,
    AuthModule,
    MarcasModule,
    ClientesModule,
    CitasModule,
    OrdenesModule,
    CloudinaryModule,
    CotizacionModule,
    EncuestaModule,
    InboxModule,
    ReportesModule,
    ConfigTallerModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common'
import { ConfigTallerController } from './config-taller.controller'
import { ConfigTallerService } from './config-taller.service'

@Module({ controllers: [ConfigTallerController], providers: [ConfigTallerService] })
export class ConfigTallerModule {}

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v2 as cloudinary } from 'cloudinary'

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name)

  constructor(config: ConfigService) {
    cloudinary.config({
      cloud_name: config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: config.get<string>('CLOUDINARY_API_SECRET'),
    })
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId)
    } catch (err) {
      this.logger.error(`Error al borrar imagen ${publicId}: ${err}`)
    }
  }

  /** Genera una URL optimizada con transformaciones básicas */
  getOptimizedUrl(publicId: string, width = 800): string {
    return cloudinary.url(publicId, {
      transformation: [
        { width, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
      ],
    })
  }
}

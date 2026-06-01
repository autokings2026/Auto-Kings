import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env['CLOUDINARY_CLOUD_NAME'],
  api_key:    process.env['CLOUDINARY_API_KEY'],
  api_secret: process.env['CLOUDINARY_API_SECRET'],
})

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId).catch(() => null)
}

export function getOptimizedUrl(publicId: string, width = 800): string {
  return cloudinary.url(publicId, {
    transformation: [{ width, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
  })
}

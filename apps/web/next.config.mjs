import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.join(__dirname, '../../')

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@kings/shared'],
  experimental: {
    outputFileTracingRoot: monorepoRoot,
    // pdfkit y fontkit usan __dirname para leer fuentes en disco;
    // si se bundlean el __dirname apunta al chunk incorrecto.
    serverComponentsExternalPackages: ['pdfkit', 'fontkit', 'linebreak'],
    outputFileTracingIncludes: {
      // Incluir archivos de datos de pdfkit para las rutas de PDF
      '**': [
        'node_modules/.pnpm/pdfkit@0.18.0/node_modules/pdfkit/js/data/**',
        'node_modules/.pnpm/pdfkit@0.18.0/node_modules/pdfkit/js/font/**',
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async redirects() {
    return [
      // Dominio antiguo de Vercel → dominio propio (redirect permanente)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'auto-kings-web.vercel.app' }],
        destination: 'https://www.auto-kings.com/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig

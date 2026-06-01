import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.join(__dirname, '../../')

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@kings/shared'],
  experimental: {
    outputFileTracingRoot: monorepoRoot,
    outputFileTracingIncludes: {
      '/api/(.*)': [
        'packages/database/generated/client/**/*.node',
        'packages/database/generated/client/**/*.so.node',
        'packages/database/generated/client/index.js',
        'packages/database/generated/client/index.d.ts',
        'packages/database/generated/client/runtime/**',
      ],
    },
    serverComponentsExternalPackages: ['@prisma/client', '@kings/database'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
}

export default nextConfig

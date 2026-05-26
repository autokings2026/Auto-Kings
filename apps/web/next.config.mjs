/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@kings/shared'],
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

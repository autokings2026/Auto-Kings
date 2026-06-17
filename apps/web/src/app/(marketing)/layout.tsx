import type { Metadata } from 'next'
import { Orbitron } from 'next/font/google'
import { KingsNavBar } from '@/components/marketing/KingsNavBar'
import { KingsFooter } from '@/components/marketing/KingsFooter'
import { WAFloatButton } from '@/components/marketing/WAFloatButton'
import { prisma } from '@/lib/prisma'

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Kings Auto Diagnósticos | Cofradía, Cortés, Honduras',
    template: '%s | Kings Auto Diagnósticos',
  },
  description:
    'Cadena de centros de diagnóstico y reparación automotriz en Cofradía, Cortés. Personal certificado por Ford, GM, Lear e IATF, ingeniería aplicada y seguimiento digital de tu vehículo en tiempo real.',
  keywords: [
    'taller mecánico Cofradía',
    'diagnóstico automotriz Honduras',
    'taller Cortés Honduras',
    'mecánico Cofradía',
    'Kings Auto',
    'reparación autos Honduras',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_HN',
    siteName: 'Kings Auto Diagnósticos',
    images: [{ url: '/logo-dark.jpeg' }],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AutoRepair',
  name: 'Kings Auto Diagnósticos',
  description: 'Centro de servicio automotriz con diagnóstico computarizado en Cofradía, Cortés, Honduras.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Cofradía',
    addressRegion: 'Cortés',
    addressCountry: 'HN',
  },
  openingHours: ['Mo-Fr 07:00-18:00', 'Sa 08:00-14:00'],
  priceRange: 'L.',
}

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const config = await prisma.configuracionTaller.findFirst({
    select: { whatsapp: true, telefono: true, direccion: true, email: true },
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className={`${orbitron.variable} flex flex-col min-h-screen`}>
        <KingsNavBar telefono={config?.telefono} whatsapp={config?.whatsapp} />
        <main className="flex-1">
          {children}
        </main>
        <KingsFooter
          direccion={config?.direccion}
          telefono={config?.telefono}
          email={config?.email}
        />
        <WAFloatButton
          numero={config?.whatsapp ?? ''}
          mensaje="Hola Kings Auto, me gustaría consultar sobre sus servicios."
        />
      </div>
    </>
  )
}

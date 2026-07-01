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
    default: 'Kings Auto Diagnósticos | Res. Montelimar, KM 24, Honduras',
    template: '%s | Kings Auto Diagnósticos',
  },
  description:
    'Centro de diagnóstico y reparación automotriz en Res. Montelimar, KM 24 Carretera hacia Occidente, Honduras. Ingeniería aplicada, equipo de última generación y seguimiento digital de tu vehículo.',
  keywords: [
    'diagnóstico automotriz Honduras',
    'reparación eléctrica automotriz',
    'calibración ADAS Honduras',
    'asesoría compra vehículo usado',
    'Kings Auto',
    'alineamiento balanceo Honduras',
    'rectificación discos frenos',
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
  description: 'Centro de diagnóstico y reparación automotriz con tecnología de punta en Res. Montelimar, KM 24 Carretera hacia Occidente, Honduras.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Res. Montelimar, KM 24 Carretera hacia Occidente',
    addressRegion: 'Cortés',
    addressCountry: 'HN',
  },
  openingHours: ['Mo-Fr 08:00-17:00', 'Sa 08:00-12:00'],
  priceRange: 'L.',
}

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const config = await prisma.configuracionTaller.findFirst({
    select: { whatsapp: true, telefono: true, direccion: true, email: true, horariosAtencion: true },
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
          horarios={config?.horariosAtencion}
        />
        <WAFloatButton
          numero={config?.whatsapp ?? ''}
          mensaje="Hola Kings Auto, me gustaría consultar sobre sus servicios."
        />
      </div>
    </>
  )
}

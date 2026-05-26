import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { auth } from '@/auth'
import { AuthSessionProvider } from '@/components/providers/session-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Kings Auto Diagnósticos',
    template: '%s — Kings Auto Diagnósticos',
  },
  description: 'Sistema de gestión del taller mecánico Kings Auto Diagnósticos',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <html lang="es" className="dark">
      <body className={inter.className}>
        <AuthSessionProvider session={session}>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  )
}

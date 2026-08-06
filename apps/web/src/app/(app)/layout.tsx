import type { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'

// Manifest propio del panel admin: al "Agregar a inicio" desde estas
// pantallas, el ícono debe abrir directamente el dashboard (no la landing
// pública, que usa /manifest.json con start_url "/").
export const metadata: Metadata = {
  title: 'Panel',
  manifest: '/manifest-app.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kings Auto Panel',
  },
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.rol) redirect('/login')

  return <AppShell user={session.user}>{children}</AppShell>
}

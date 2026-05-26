import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/layout/app-sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.rol) redirect('/login')

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar user={session.user} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

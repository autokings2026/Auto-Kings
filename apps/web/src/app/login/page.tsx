import { Suspense } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/components/auth/login-form'

// Usa el manifest del panel (start_url "/dashboard") — si alguien agrega
// esta pantalla a su inicio antes de iniciar sesión, el ícono debe abrir el
// panel (que redirige a /login automáticamente si no hay sesión), no la
// landing pública.
export const metadata = {
  title: 'Iniciar sesión — Kings Auto Diagnósticos',
  manifest: '/manifest-app.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent' as const,
    title: 'Kings Auto Panel',
  },
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Gradientes decorativos */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/logo-dark.jpeg"
            alt="Kings Auto Diagnósticos"
            width={260}
            height={130}
            priority
            className="rounded-xl"
          />
        </div>

        {/* Card de login */}
        <Card className="border-border/60 shadow-2xl shadow-black/40">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Bienvenido</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Kings Auto Diagnósticos · Honduras
        </p>
      </div>
    </main>
  )
}

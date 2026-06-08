import Image from 'next/image'
import { BookingForm } from '@/components/reservar/booking-form'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Reservar Cita | Kings Auto Diagnósticos' }

export default async function ReservarPage() {
  const config = await prisma.configuracionTaller.findFirst({
    select: { nombre: true, direccion: true },
  })
  const nombreTaller = config?.nombre ?? 'Kings Auto Diagnósticos'
  const ubicacion = config?.direccion ?? 'Honduras'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-surface-2 bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <Image src="/logo-dark.jpeg" alt="Kings Auto" width={120} height={60} className="rounded" />
          <div className="h-6 w-px bg-surface-2" />
          <span className="text-sm text-muted-foreground">Reserva tu cita en línea</span>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Agenda tu diagnóstico</h1>
          <p className="text-muted-foreground mt-1">
            Completa el formulario y recibirás la confirmación por correo electrónico.
          </p>
        </div>
        <BookingForm />
      </main>

      <footer className="text-center py-4 text-xs text-muted-foreground border-t border-surface-2">
        © {new Date().getFullYear()} {nombreTaller} · {ubicacion}
      </footer>
    </div>
  )
}

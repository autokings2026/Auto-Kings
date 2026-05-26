import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { OrdenesTable } from '@/components/ordenes/ordenes-table'

export const metadata = { title: 'Órdenes de Trabajo | Kings Auto' }

export default function OrdenesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Órdenes de Trabajo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Seguimiento de vehículos en taller por fase.
        </p>
      </div>
      <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-secondary" /></div>}>
        <OrdenesTable />
      </Suspense>
    </div>
  )
}

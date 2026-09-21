import { ClientesTable } from '@/components/clientes/clientes-table'

export const metadata = { title: 'Clientes | Kings Auto Diagnósticos' }

export default function ClientesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Clientes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Directorio de clientes, con sus reservas por hacer y ya hechas.
        </p>
      </div>
      <ClientesTable />
    </div>
  )
}

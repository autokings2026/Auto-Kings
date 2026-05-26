import { CitasTable } from '@/components/citas/citas-table'

export const metadata = { title: 'Citas | Kings Auto Diagnósticos' }

export default function CitasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Citas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona las citas agendadas y convierte a orden de trabajo.
        </p>
      </div>
      <CitasTable />
    </div>
  )
}

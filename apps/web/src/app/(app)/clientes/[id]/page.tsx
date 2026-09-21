import { ClienteDetail } from '@/components/clientes/cliente-detail'

export const metadata = { title: 'Cliente | Kings Auto Diagnósticos' }

export default function ClienteDetailPage({ params }: { params: { id: string } }) {
  return <ClienteDetail clienteId={params.id} />
}

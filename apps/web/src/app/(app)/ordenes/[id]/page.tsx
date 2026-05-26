import { OtDetail } from '@/components/ordenes/ot-detail'

export const metadata = { title: 'Orden de Trabajo | Kings Auto' }

export default function OtPage({ params }: { params: { id: string } }) {
  return <OtDetail ordenId={params.id} />
}

import { Metadata } from 'next'
import { AceptacionView } from './aceptacion-view'

export const metadata: Metadata = { title: 'Checklist de Recepción | Kings Auto' }

export default function ChecklistPage({ params }: { params: { token: string } }) {
  return <AceptacionView token={params.token} />
}

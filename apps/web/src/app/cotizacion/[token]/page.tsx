import { Metadata } from 'next'
import { AprobacionView } from './aprobacion-view'

export const metadata: Metadata = { title: 'Cotización de Servicio | Kings Auto' }

export default function CotizacionPage({ params }: { params: { token: string } }) {
  return <AprobacionView token={params.token} />
}

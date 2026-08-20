import { Metadata } from 'next'
import { AprobacionAdicionalView } from './aprobacion-adicional-view'

export const metadata: Metadata = { title: 'Cotización Adicional | Kings Auto' }

export default function CotizacionAdicionalPage({ params }: { params: { token: string } }) {
  return <AprobacionAdicionalView token={params.token} />
}

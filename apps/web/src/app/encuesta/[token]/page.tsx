import { Metadata } from 'next'
import { EncuestaView } from './encuesta-view'

export const metadata: Metadata = { title: 'Encuesta de Satisfacción | Kings Auto' }

export default function EncuestaPage({ params }: { params: { token: string } }) {
  return <EncuestaView token={params.token} />
}

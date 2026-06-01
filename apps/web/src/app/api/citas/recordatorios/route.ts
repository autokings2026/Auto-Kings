import { enviarRecordatorios } from '@/lib/services/citas'

// Llamado por Vercel Cron: "0 14 * * *"
export async function POST() {
  const result = await enviarRecordatorios()
  return Response.json(result)
}

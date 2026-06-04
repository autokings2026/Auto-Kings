import { enviarRecordatorios } from '@/lib/services/citas'

// Vercel Cron llama con GET: "0 14 * * *" → 8:00 AM Honduras
export async function GET() {
  const result = await enviarRecordatorios()
  return Response.json(result)
}

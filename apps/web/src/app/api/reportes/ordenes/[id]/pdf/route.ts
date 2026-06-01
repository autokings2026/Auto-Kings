import { requireAuth, unauthorized } from '@/lib/auth-helpers'
import { generarPdfReporte } from '@/lib/services/reportes'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth()
  if (!user) return unauthorized()

  const { id } = await params

  try {
    const { buffer, filename } = await generarPdfReporte(id)
    return new Response(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return Response.json({ message: msg }, { status: 404 })
  }
}

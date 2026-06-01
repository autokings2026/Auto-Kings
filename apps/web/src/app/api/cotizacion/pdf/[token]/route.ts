import { generarPdfCotizacion } from '@/lib/services/cotizacion'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  try {
    const { buffer, filename } = await generarPdfCotizacion(token)
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

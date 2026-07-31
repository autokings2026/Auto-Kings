import { NextRequest } from 'next/server'
import { requireRole, forbidden } from '@/lib/auth-helpers'
import { RolUsuario } from '@kings/shared'
import { getWhatsappCortesia } from '@/lib/services/encuestas'

// GET — genera (o reutiliza) el código de cortesía y arma el link de WhatsApp
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) return forbidden()

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const cortesiaTipo = searchParams.get('tipo')
  if (!cortesiaTipo) {
    return Response.json({ message: 'Selecciona el tipo de cortesía' }, { status: 400 })
  }

  try {
    const result = await getWhatsappCortesia(id, { cortesiaTipo }, user.id)
    return Response.json(result)
  } catch (err) {
    const e = err as Error & { status?: number }
    return Response.json({ message: e.message }, { status: e.status ?? 400 })
  }
}

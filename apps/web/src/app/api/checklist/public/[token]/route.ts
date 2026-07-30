import { findChecklistByToken } from '@/lib/services/checklist'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const data = await findChecklistByToken(token)
  if (!data) return Response.json({ message: 'Checklist no encontrado' }, { status: 404 })
  return Response.json(data)
}

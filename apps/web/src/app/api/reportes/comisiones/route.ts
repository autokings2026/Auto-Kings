import { NextRequest } from 'next/server'
import { requireRole, forbidden } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { RolUsuario } from '@kings/shared'
import { EstadoOT } from '@kings/shared'

export async function GET(req: NextRequest) {
  const user = await requireRole(RolUsuario.ADMIN)
  if (!user) return forbidden()

  const p = req.nextUrl.searchParams
  const desde = p.get('desde')
  const hasta = p.get('hasta')

  const config = await prisma.configuracionTaller.findFirst({
    select: { comisionTecnicoPct: true },
  })
  const comisionPct = config?.comisionTecnicoPct ?? 8

  const whereOrden = {
    estado: EstadoOT.COMPLETADA,
    ...(desde || hasta ? {
      updatedAt: {
        ...(desde ? { gte: new Date(desde) } : {}),
        ...(hasta ? { lte: new Date(hasta + 'T23:59:59') } : {}),
      },
    } : {}),
  }

  // Agrupar mano de obra por técnico
  const tecnicos = await prisma.user.findMany({
    where: { rol: { in: [RolUsuario.EMPLEADO, RolUsuario.CONTROL_CALIDAD] }, activo: true },
    select: { id: true, nombre: true, rol: true },
    orderBy: { nombre: 'asc' },
  })

  const resultados = await Promise.all(
    tecnicos.map(async (tecnico) => {
      const [otCount, agg] = await Promise.all([
        prisma.ordenTrabajo.count({
          where: { ...whereOrden, tecnicoId: tecnico.id },
        }),
        prisma.diagnosticoCotizacion.aggregate({
          where: {
            orden: { ...whereOrden, tecnicoId: tecnico.id },
          },
          _sum: { totalManoObra: true, totalGeneral: true },
        }),
      ])

      const totalManoObra = Number(agg._sum.totalManoObra ?? 0)
      const totalFacturado = Number(agg._sum.totalGeneral ?? 0)
      const comisionTotal = +(totalManoObra * comisionPct / 100).toFixed(2)

      return {
        tecnicoId: tecnico.id,
        tecnicoNombre: tecnico.nombre,
        rol: tecnico.rol,
        totalOTs: otCount,
        totalManoObra,
        totalFacturado,
        comisionTotal,
        comisionPct,
      }
    }),
  )

  const totales = resultados.reduce(
    (acc, r) => ({
      totalOTs: acc.totalOTs + r.totalOTs,
      totalManoObra: acc.totalManoObra + r.totalManoObra,
      totalFacturado: acc.totalFacturado + r.totalFacturado,
      comisionTotal: +(acc.comisionTotal + r.comisionTotal).toFixed(2),
    }),
    { totalOTs: 0, totalManoObra: 0, totalFacturado: 0, comisionTotal: 0 },
  )

  return Response.json({ data: resultados, totales, comisionPct })
}

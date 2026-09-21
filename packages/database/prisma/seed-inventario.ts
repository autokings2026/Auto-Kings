import { PrismaClient, TipoMovimientoInventario } from '@prisma/client'

const prisma = new PrismaClient()

// Carga inicial del inventario físico real. Edita este arreglo con las partes
// y su stock físico contado en el taller antes de correr:
//   pnpm --filter @kings/database db:seed:inventario
// Reintentable sin duplicar: cada parte se identifica por `codigo` (upsert) y
// el movimiento de "inventario inicial" solo se genera una vez por parte.
const PARTES_INICIALES: {
  codigo: string
  nombre: string
  descripcion?: string
  precioVenta: number
  precioCosto?: number
  stockFisico: number
  stockMinimo: number
  unidad?: string
  proveedor?: string
}[] = [
  // { codigo: 'FRENO-001', nombre: 'Pastillas de freno delanteras', precioVenta: 850, precioCosto: 550, stockFisico: 12, stockMinimo: 4, unidad: 'juego' },
]

const NOTA_INICIAL = 'Inventario inicial'

async function main() {
  if (PARTES_INICIALES.length === 0) {
    console.log('⚠️  PARTES_INICIALES está vacío. Edita packages/database/prisma/seed-inventario.ts con el inventario físico real antes de correr este script.')
    return
  }

  const admin = await prisma.user.findFirst({ where: { rol: 'ADMIN' }, orderBy: { createdAt: 'asc' } })
  if (!admin) {
    throw new Error('No hay ningún usuario ADMIN todavía — crea uno (pnpm db:seed) antes de cargar el inventario inicial.')
  }

  for (const parte of PARTES_INICIALES) {
    const inv = await prisma.inventario.upsert({
      where: { codigo: parte.codigo },
      update: {
        nombre: parte.nombre,
        descripcion: parte.descripcion,
        precioVenta: parte.precioVenta,
        precioCosto: parte.precioCosto,
        stockMinimo: parte.stockMinimo,
        unidad: parte.unidad ?? 'unidad',
        proveedor: parte.proveedor,
      },
      create: {
        codigo: parte.codigo,
        nombre: parte.nombre,
        descripcion: parte.descripcion,
        precioVenta: parte.precioVenta,
        precioCosto: parte.precioCosto,
        stockMinimo: parte.stockMinimo,
        unidad: parte.unidad ?? 'unidad',
        proveedor: parte.proveedor,
      },
    })

    const yaTieneAjusteInicial = await prisma.movimientoInventario.findFirst({
      where: { inventarioId: inv.id, nota: NOTA_INICIAL },
    })
    if (yaTieneAjusteInicial) {
      console.log(`↷ ${parte.codigo} — ya tiene su ajuste de inventario inicial, se omite.`)
      continue
    }
    if (parte.stockFisico === 0) {
      console.log(`↷ ${parte.codigo} — stock físico inicial es 0, no se genera movimiento.`)
      continue
    }

    await prisma.movimientoInventario.create({
      data: {
        inventarioId: inv.id,
        tipo: TipoMovimientoInventario.AJUSTE,
        cantidad: parte.stockFisico,
        usuarioId: admin.id,
        nota: NOTA_INICIAL,
      },
    })
    console.log(`✅ ${parte.codigo} — ${parte.nombre}: stock inicial ${parte.stockFisico} ${parte.unidad ?? 'unidad'}`)
  }

  console.log('🌱 Seed de inventario completo — stock y libro de movimientos cuadrados desde el día uno.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

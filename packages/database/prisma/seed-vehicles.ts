/**
 * Script para importar la lista completa de marcas y modelos.
 *
 * USO:
 *   1. Reemplaza el array VEHICULOS con tu dataset completo.
 *   2. Ejecuta: pnpm --filter @kings/database db:seed:vehicles
 *
 * Formato esperado:
 *   { marca: string, modelos: string[] }[]
 *
 * El script usa upsert, así que es seguro ejecutarlo varias veces.
 * Las marcas/modelos existentes no se duplican.
 */

import { PrismaClient } from '../generated/client'

const prisma = new PrismaClient()

// ─── REEMPLAZA ESTO CON TU LISTA COMPLETA ──────────────────────────────────
const VEHICULOS: { marca: string; modelos: string[] }[] = [
  // Ejemplo:
  // { marca: 'Toyota', modelos: ['Corolla', 'Camry', 'RAV4', ...] },
  // { marca: 'Honda', modelos: ['Civic', 'Accord', 'CR-V', ...] },
  // ... pega aquí tu lista completa
]
// ───────────────────────────────────────────────────────────────────────────

async function importVehiculos() {
  if (VEHICULOS.length === 0) {
    console.log('⚠️  El array VEHICULOS está vacío. Agrega tu lista y vuelve a ejecutar.')
    return
  }

  console.log(`🚗 Importando ${VEHICULOS.length} marcas...`)

  let marcasCreadas = 0
  let modelosCreados = 0

  for (const { marca: nombreMarca, modelos } of VEHICULOS) {
    const marca = await prisma.marca.upsert({
      where: { nombre: nombreMarca },
      update: {},
      create: { nombre: nombreMarca },
    })

    if (!marca.activa) {
      marcasCreadas++
    }

    for (const nombreModelo of modelos) {
      const resultado = await prisma.modelo.upsert({
        where: { nombre_marcaId: { nombre: nombreModelo, marcaId: marca.id } },
        update: {},
        create: { nombre: nombreModelo, marcaId: marca.id },
      })

      modelosCreados++
    }
  }

  const totalMarcas = await prisma.marca.count()
  const totalModelos = await prisma.modelo.count()

  console.log(`✅ Importación completada`)
  console.log(`   Marcas en BD:  ${totalMarcas}`)
  console.log(`   Modelos en BD: ${totalModelos}`)
}

importVehiculos()
  .catch((e) => {
    console.error('❌ Error importando vehículos:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

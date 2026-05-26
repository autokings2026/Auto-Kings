import { PrismaClient, RolUsuario, TipoPlantillaWA } from '../generated/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── 1. Configuración del taller ───────────────────────────────────────────
  await prisma.configuracionTaller.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      nombre: 'Kings Auto Diagnósticos',
      telefono: '+504 9999-9999',
      direccion: 'Tegucigalpa, Honduras',
      email: 'info@kingsauto.hn',
    },
  })
  console.log('✅ Configuración del taller creada')

  // ─── 2. Usuario administrador inicial ──────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin123!', 12)
  await prisma.user.upsert({
    where: { email: 'admin@kingsauto.hn' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@kingsauto.hn',
      password: adminPassword,
      rol: RolUsuario.ADMIN,
    },
  })
  console.log('✅ Admin creado: admin@kingsauto.hn / Admin123!')
  console.log('   ⚠️  Cambiar la contraseña en /config después del primer login')

  // ─── 3. Usuario empleado de prueba ─────────────────────────────────────────
  const empleadoPassword = await bcrypt.hash('Empleado123!', 12)
  await prisma.user.upsert({
    where: { email: 'tecnico@kingsauto.hn' },
    update: {},
    create: {
      nombre: 'Carlos Técnico',
      email: 'tecnico@kingsauto.hn',
      password: empleadoPassword,
      rol: RolUsuario.EMPLEADO,
    },
  })

  // ─── 4. Usuario control de calidad de prueba ───────────────────────────────
  const ccPassword = await bcrypt.hash('Calidad123!', 12)
  await prisma.user.upsert({
    where: { email: 'cc@kingsauto.hn' },
    update: {},
    create: {
      nombre: 'Ana Calidad',
      email: 'cc@kingsauto.hn',
      password: ccPassword,
      rol: RolUsuario.CONTROL_CALIDAD,
    },
  })
  console.log('✅ Usuarios de prueba creados')

  // ─── 5. Plantillas de mensajes de WhatsApp ─────────────────────────────────
  const plantillas = [
    {
      nombre: 'Confirmación de cita',
      tipo: TipoPlantillaWA.CONFIRMAR_CITA,
      contenido: `Hola {{nombre_cliente}} 👋, te confirmamos tu cita en *Kings Auto Diagnósticos* para el *{{fecha_cita}}* a las *{{hora_cita}}*. Por favor llega puntual con tu vehículo {{marca}} {{modelo}} (placa {{placa}}). ¡Te esperamos!`,
    },
    {
      nombre: 'Diagnóstico listo',
      tipo: TipoPlantillaWA.DIAGNOSTICO_LISTO,
      contenido: `Hola {{nombre_cliente}}, hemos terminado el diagnóstico de tu {{marca}} {{modelo}} (placa {{placa}}). Tenemos lista la cotización para tu aprobación. En breve te la enviamos. ¿Tienes alguna pregunta?`,
    },
    {
      nombre: 'Cotización lista',
      tipo: TipoPlantillaWA.COTIZACION_LISTA,
      contenido: `Hola {{nombre_cliente}}, te adjuntamos la cotización para tu {{marca}} {{modelo}} por un total de *L. {{total_cotizacion}}*. Por favor revísala y confírmanos si apruebas los trabajos para proceder. ¡Cualquier duda con gusto te atendemos!`,
    },
    {
      nombre: 'Vehículo listo para entrega',
      tipo: TipoPlantillaWA.VEHICULO_LISTO,
      contenido: `¡Buenas noticias {{nombre_cliente}}! 🎉 Tu {{marca}} {{modelo}} (placa {{placa}}) ya está listo para ser recogido en *Kings Auto Diagnósticos*. Nuestro horario es Lunes a Sábado de 8:00 AM a 6:00 PM. ¡Te esperamos!`,
    },
    {
      nombre: 'Encuesta de satisfacción',
      tipo: TipoPlantillaWA.ENCUESTA_SATISFACCION,
      contenido: `Hola {{nombre_cliente}}, gracias por confiar en *Kings Auto Diagnósticos*. Nos importa mucho tu opinión — ¿podrías tomarte 2 minutos para calificar tu experiencia? 🙏 {{link_encuesta}}`,
    },
  ]

  for (const plantilla of plantillas) {
    await prisma.plantillaMensaje.upsert({
      where: { tipo: plantilla.tipo },
      update: { contenido: plantilla.contenido, nombre: plantilla.nombre },
      create: plantilla,
    })
  }
  console.log('✅ Plantillas de WhatsApp creadas')

  // ─── 6. Marcas y modelos base (mercado hondureño) ──────────────────────────
  // Para importar la lista completa, ejecutar el script externo:
  // pnpm --filter @kings/database db:seed:vehicles
  // o usar el archivo prisma/seed-vehicles.ts con tu dataset completo.
  //
  // Aquí se carga un subconjunto mínimo para que el sistema funcione desde el inicio.
  const vehiculosBase = [
    {
      marca: 'Toyota',
      modelos: ['Corolla', 'Camry', 'RAV4', 'Hilux', 'Land Cruiser', 'Prado', 'Yaris', 'Fortuner'],
    },
    {
      marca: 'Honda',
      modelos: ['Civic', 'Accord', 'CR-V', 'HR-V', 'Pilot', 'Odyssey', 'Fit', 'Ridgeline'],
    },
    {
      marca: 'Nissan',
      modelos: ['Altima', 'Sentra', 'Pathfinder', 'X-Trail', 'Frontier', 'Murano', 'Versa', 'Kicks'],
    },
    {
      marca: 'Hyundai',
      modelos: ['Elantra', 'Tucson', 'Santa Fe', 'Sonata', 'Accent', 'Creta', 'Ioniq'],
    },
    {
      marca: 'Kia',
      modelos: ['Sportage', 'Sorento', 'Cerato', 'Rio', 'Seltos', 'Stinger', 'Carnival'],
    },
    {
      marca: 'Chevrolet',
      modelos: ['Cruze', 'Malibu', 'Equinox', 'Traverse', 'Silverado', 'Spark', 'Trax', 'Captiva'],
    },
    {
      marca: 'Ford',
      modelos: ['F-150', 'Escape', 'Explorer', 'Fusion', 'Ranger', 'Edge', 'Bronco'],
    },
    {
      marca: 'Volkswagen',
      modelos: ['Golf', 'Jetta', 'Passat', 'Tiguan', 'Touareg', 'Polo'],
    },
    {
      marca: 'Mazda',
      modelos: ['Mazda3', 'Mazda6', 'CX-5', 'CX-9', 'MX-5', 'CX-3'],
    },
    {
      marca: 'Mitsubishi',
      modelos: ['Outlander', 'Eclipse Cross', 'Montero', 'L200', 'ASX', 'Galant'],
    },
    {
      marca: 'Subaru',
      modelos: ['Outback', 'Forester', 'Impreza', 'Legacy', 'XV', 'BRZ'],
    },
    {
      marca: 'BMW',
      modelos: ['Serie 3', 'Serie 5', 'X3', 'X5', 'Serie 1', 'X1'],
    },
    {
      marca: 'Mercedes-Benz',
      modelos: ['Clase C', 'Clase E', 'GLA', 'GLC', 'GLE', 'Clase A'],
    },
    {
      marca: 'Audi',
      modelos: ['A3', 'A4', 'Q3', 'Q5', 'A6', 'Q7'],
    },
    {
      marca: 'Jeep',
      modelos: ['Wrangler', 'Cherokee', 'Grand Cherokee', 'Compass', 'Renegade'],
    },
    {
      marca: 'Dodge',
      modelos: ['Ram 1500', 'Durango', 'Journey', 'Challenger', 'Charger'],
    },
    {
      marca: 'Isuzu',
      modelos: ['D-Max', 'MU-X', 'Trooper', 'Rodeo'],
    },
    {
      marca: 'Suzuki',
      modelos: ['Swift', 'Vitara', 'Jimny', 'Grand Vitara', 'Ertiga'],
    },
    {
      marca: 'Lexus',
      modelos: ['RX', 'NX', 'GX', 'IS', 'ES'],
    },
    {
      marca: 'Acura',
      modelos: ['MDX', 'RDX', 'TLX', 'ILX'],
    },
  ]

  for (const { marca: nombreMarca, modelos } of vehiculosBase) {
    const marca = await prisma.marca.upsert({
      where: { nombre: nombreMarca },
      update: {},
      create: { nombre: nombreMarca },
    })

    for (const nombreModelo of modelos) {
      await prisma.modelo.upsert({
        where: { nombre_marcaId: { nombre: nombreModelo, marcaId: marca.id } },
        update: {},
        create: { nombre: nombreModelo, marcaId: marca.id },
      })
    }
  }
  console.log(`✅ ${vehiculosBase.length} marcas y modelos base cargados`)
  console.log('   💡 Para importar la lista completa, ejecuta: pnpm db:seed:vehicles')

  console.log('\n🎉 Seed completado exitosamente!')
  console.log('\n📋 Credenciales iniciales:')
  console.log('   Admin:    admin@kingsauto.hn     / Admin123!')
  console.log('   Técnico:  tecnico@kingsauto.hn   / Empleado123!')
  console.log('   CC:       cc@kingsauto.hn         / Calidad123!')
  console.log('\n⚠️  IMPORTANTE: Cambia todas las contraseñas en producción.')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

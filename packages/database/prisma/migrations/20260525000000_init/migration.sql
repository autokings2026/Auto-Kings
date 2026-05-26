warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('EMPLEADO', 'CONTROL_CALIDAD', 'ADMIN');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'CONVERTIDA', 'NO_ASISTIO');

-- CreateEnum
CREATE TYPE "FaseOT" AS ENUM ('LLEGADA_FOTOS', 'DIAGNOSTICO', 'REPARACION', 'CONTROL_CALIDAD', 'ENTREGA', 'COMPLETADA');

-- CreateEnum
CREATE TYPE "EstadoOT" AS ENUM ('ACTIVA', 'EN_ESPERA_APROBACION', 'RECHAZADA_COTIZACION', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoCombustible" AS ENUM ('GASOLINA', 'DIESEL', 'HIBRIDO', 'ELECTRICO', 'GAS');

-- CreateEnum
CREATE TYPE "TipoItemCotizacion" AS ENUM ('MATERIAL', 'MANO_OBRA');

-- CreateEnum
CREATE TYPE "TipoEventoOT" AS ENUM ('CREACION_OT', 'FOTO_SUBIDA', 'DIAGNOSTICO_REGISTRADO', 'COTIZACION_GENERADA', 'COTIZACION_ENVIADA_WA', 'COTIZACION_APROBADA', 'COTIZACION_RECHAZADA', 'REPARACION_INICIADA', 'REPARACION_FINALIZADA', 'CC_APROBADO', 'CC_RECHAZADO', 'ENTREGA_NOTIFICADA', 'VEHICULO_ENTREGADO', 'ENCUESTA_ENVIADA', 'ENCUESTA_RESPONDIDA', 'CAMBIO_FASE', 'NOTA_INTERNA', 'CITA_CONVERTIDA');

-- CreateEnum
CREATE TYPE "TipoMensajeWA" AS ENUM ('SALIENTE', 'ENTRANTE');

-- CreateEnum
CREATE TYPE "TipoPlantillaWA" AS ENUM ('CONFIRMAR_CITA', 'DIAGNOSTICO_LISTO', 'COTIZACION_LISTA', 'VEHICULO_LISTO', 'ENCUESTA_SATISFACCION', 'PERSONALIZADO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'EMPLEADO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modelos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "marcaId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "modelos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "marcaId" TEXT NOT NULL,
    "modeloId" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "placa" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "hora" TEXT NOT NULL,
    "comentarios" TEXT,
    "estado" "EstadoCita" NOT NULL DEFAULT 'PENDIENTE',
    "emailEnviado" BOOLEAN NOT NULL DEFAULT false,
    "recordatorioEnviado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_trabajo" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "citaId" TEXT,
    "clienteId" TEXT NOT NULL,
    "tecnicoId" TEXT NOT NULL,
    "marcaId" TEXT NOT NULL,
    "modeloId" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "placa" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "combustible" "TipoCombustible" NOT NULL,
    "kilometraje" INTEGER NOT NULL,
    "faseActual" "FaseOT" NOT NULL DEFAULT 'LLEGADA_FOTOS',
    "estado" "EstadoOT" NOT NULL DEFAULT 'ACTIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_trabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos_ingreso" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "creadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fotos_ingreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostico_cotizaciones" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "sintomaCliente" TEXT NOT NULL,
    "diagnosticoTecnico" TEXT NOT NULL,
    "totalMateriales" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalManoObra" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalGeneral" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tokenAprobacion" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "aprobado" BOOLEAN,
    "fechaAprobacion" TIMESTAMP(3),
    "mensajeAprobacion" TEXT,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnostico_cotizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_cotizacion" (
    "id" TEXT NOT NULL,
    "cotizacionId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "TipoItemCotizacion" NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "precioUnitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "posicion" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "items_cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reparaciones" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "tecnicoId" TEXT NOT NULL,
    "notas" TEXT,
    "iniciadaEn" TIMESTAMP(3),
    "finalizadaEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reparaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controles_calidad" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "aprobado" BOOLEAN NOT NULL,
    "observaciones" TEXT,
    "revisadoPorId" TEXT NOT NULL,
    "revisadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "controles_calidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entregas" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "notificadoEn" TIMESTAMP(3),
    "entregadoEn" TIMESTAMP(3),
    "registradoPorId" TEXT NOT NULL,
    "encuestaEmailEnviado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entregas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encuestas_satisfaccion" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "calidad" INTEGER,
    "tiempo" INTEGER,
    "atencion" INTEGER,
    "comentario" TEXT,
    "respondidoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encuestas_satisfaccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes_whatsapp" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT,
    "clienteId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "tipo" "TipoMensajeWA" NOT NULL DEFAULT 'SALIENTE',
    "plantillaUsada" "TipoPlantillaWA",
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "enviadoPorId" TEXT NOT NULL,
    "enviadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_whatsapp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_ot" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "tipo" "TipoEventoOT" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "metadata" JSONB,
    "realizadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_ot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_taller" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL DEFAULT 'Kings Auto Diagnósticos',
    "telefono" TEXT,
    "direccion" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "horariosAtencion" JSONB NOT NULL DEFAULT '[{"dia":0,"activo":false,"apertura":"08:00","cierre":"18:00"},{"dia":1,"activo":true,"apertura":"08:00","cierre":"18:00"},{"dia":2,"activo":true,"apertura":"08:00","cierre":"18:00"},{"dia":3,"activo":true,"apertura":"08:00","cierre":"18:00"},{"dia":4,"activo":true,"apertura":"08:00","cierre":"18:00"},{"dia":5,"activo":true,"apertura":"08:00","cierre":"18:00"},{"dia":6,"activo":true,"apertura":"08:00","cierre":"18:00"}]',
    "duracionSlotMinutos" INTEGER NOT NULL DEFAULT 60,
    "maxCitasPorSlot" INTEGER NOT NULL DEFAULT 3,
    "alertaAmarillaMinutos" INTEGER NOT NULL DEFAULT 60,
    "alertaRojaMinutos" INTEGER NOT NULL DEFAULT 120,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_taller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantillas_mensajes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoPlantillaWA" NOT NULL,
    "contenido" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantillas_mensajes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "marcas_nombre_key" ON "marcas"("nombre");

-- CreateIndex
CREATE INDEX "modelos_marcaId_idx" ON "modelos"("marcaId");

-- CreateIndex
CREATE UNIQUE INDEX "modelos_nombre_marcaId_key" ON "modelos"("nombre", "marcaId");

-- CreateIndex
CREATE INDEX "citas_fecha_hora_idx" ON "citas"("fecha", "hora");

-- CreateIndex
CREATE INDEX "citas_clienteId_idx" ON "citas"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_trabajo_numero_key" ON "ordenes_trabajo"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_trabajo_citaId_key" ON "ordenes_trabajo"("citaId");

-- CreateIndex
CREATE INDEX "ordenes_trabajo_clienteId_idx" ON "ordenes_trabajo"("clienteId");

-- CreateIndex
CREATE INDEX "ordenes_trabajo_tecnicoId_idx" ON "ordenes_trabajo"("tecnicoId");

-- CreateIndex
CREATE INDEX "ordenes_trabajo_faseActual_estado_idx" ON "ordenes_trabajo"("faseActual", "estado");

-- CreateIndex
CREATE INDEX "fotos_ingreso_ordenId_idx" ON "fotos_ingreso"("ordenId");

-- CreateIndex
CREATE UNIQUE INDEX "diagnostico_cotizaciones_ordenId_key" ON "diagnostico_cotizaciones"("ordenId");

-- CreateIndex
CREATE UNIQUE INDEX "diagnostico_cotizaciones_tokenAprobacion_key" ON "diagnostico_cotizaciones"("tokenAprobacion");

-- CreateIndex
CREATE INDEX "items_cotizacion_cotizacionId_idx" ON "items_cotizacion"("cotizacionId");

-- CreateIndex
CREATE UNIQUE INDEX "reparaciones_ordenId_key" ON "reparaciones"("ordenId");

-- CreateIndex
CREATE INDEX "controles_calidad_ordenId_idx" ON "controles_calidad"("ordenId");

-- CreateIndex
CREATE UNIQUE INDEX "entregas_ordenId_key" ON "entregas"("ordenId");

-- CreateIndex
CREATE UNIQUE INDEX "encuestas_satisfaccion_ordenId_key" ON "encuestas_satisfaccion"("ordenId");

-- CreateIndex
CREATE UNIQUE INDEX "encuestas_satisfaccion_token_key" ON "encuestas_satisfaccion"("token");

-- CreateIndex
CREATE INDEX "mensajes_whatsapp_clienteId_enviadoEn_idx" ON "mensajes_whatsapp"("clienteId", "enviadoEn");

-- CreateIndex
CREATE INDEX "mensajes_whatsapp_ordenId_idx" ON "mensajes_whatsapp"("ordenId");

-- CreateIndex
CREATE INDEX "eventos_ot_ordenId_createdAt_idx" ON "eventos_ot"("ordenId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "plantillas_mensajes_tipo_key" ON "plantillas_mensajes"("tipo");

-- AddForeignKey
ALTER TABLE "modelos" ADD CONSTRAINT "modelos_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "marcas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "marcas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "modelos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "citas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "marcas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "modelos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos_ingreso" ADD CONSTRAINT "fotos_ingreso_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "ordenes_trabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos_ingreso" ADD CONSTRAINT "fotos_ingreso_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostico_cotizaciones" ADD CONSTRAINT "diagnostico_cotizaciones_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "ordenes_trabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_cotizacion" ADD CONSTRAINT "items_cotizacion_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "diagnostico_cotizaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reparaciones" ADD CONSTRAINT "reparaciones_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "ordenes_trabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reparaciones" ADD CONSTRAINT "reparaciones_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controles_calidad" ADD CONSTRAINT "controles_calidad_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "ordenes_trabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controles_calidad" ADD CONSTRAINT "controles_calidad_revisadoPorId_fkey" FOREIGN KEY ("revisadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "ordenes_trabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encuestas_satisfaccion" ADD CONSTRAINT "encuestas_satisfaccion_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "ordenes_trabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_whatsapp" ADD CONSTRAINT "mensajes_whatsapp_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "ordenes_trabajo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_whatsapp" ADD CONSTRAINT "mensajes_whatsapp_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_whatsapp" ADD CONSTRAINT "mensajes_whatsapp_enviadoPorId_fkey" FOREIGN KEY ("enviadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_ot" ADD CONSTRAINT "eventos_ot_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "ordenes_trabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_ot" ADD CONSTRAINT "eventos_ot_realizadoPorId_fkey" FOREIGN KEY ("realizadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


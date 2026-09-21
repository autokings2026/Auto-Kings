-- Feature: Inventario con punto de reorden.
-- Aditivo y no destructivo: tablas nuevas, todas con IF NOT EXISTS para poder
-- reintentar esta migración sin efectos duplicados.

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "TipoMovimientoInventario" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "inventario" (
    "id"          TEXT NOT NULL,
    "codigo"      TEXT NOT NULL,
    "nombre"      TEXT NOT NULL,
    "descripcion" TEXT,
    "precioVenta" DECIMAL(12,2) NOT NULL,
    "precioCosto" DECIMAL(12,2),
    "stockActual" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stockMinimo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "unidad"      TEXT NOT NULL DEFAULT 'unidad',
    "proveedor"   TEXT,
    "activo"      BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (índice único — equivalente a la restricción UNIQUE de Prisma,
-- pero con IF NOT EXISTS nativo para poder reintentar la migración)
CREATE UNIQUE INDEX IF NOT EXISTS "inventario_codigo_key" ON "inventario"("codigo");
CREATE INDEX IF NOT EXISTS "inventario_activo_idx" ON "inventario"("activo");

-- CreateTable
CREATE TABLE IF NOT EXISTS "movimientos_inventario" (
    "id"                TEXT NOT NULL,
    "inventarioId"      TEXT NOT NULL,
    "tipo"              "TipoMovimientoInventario" NOT NULL,
    "cantidad"          DECIMAL(10,2) NOT NULL,
    "referenciaOrdenId" TEXT,
    "usuarioId"         TEXT NOT NULL,
    "nota"              TEXT,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "movimientos_inventario_inventarioId_idx" ON "movimientos_inventario"("inventarioId");
CREATE INDEX IF NOT EXISTS "movimientos_inventario_referenciaOrdenId_idx" ON "movimientos_inventario"("referenciaOrdenId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_inventarioId_fkey"
    FOREIGN KEY ("inventarioId") REFERENCES "inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_referenciaOrdenId_fkey"
    FOREIGN KEY ("referenciaOrdenId") REFERENCES "ordenes_trabajo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Trigger: stockActual se actualiza SOLO a partir de movimientos_inventario,
-- nunca a mano desde el front. ENTRADA/AJUSTE suman el delta (AJUSTE puede ser
-- negativo para corregir hacia abajo); SALIDA resta.
CREATE OR REPLACE FUNCTION trg_actualizar_stock_inventario() RETURNS TRIGGER AS $BODY$
BEGIN
  IF NEW."cantidad" = 0 THEN
    RAISE EXCEPTION 'La cantidad del movimiento no puede ser cero';
  END IF;
  IF NEW."tipo" IN ('ENTRADA', 'SALIDA') AND NEW."cantidad" < 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser positiva para movimientos de tipo %', NEW."tipo";
  END IF;

  IF NEW."tipo" = 'SALIDA' THEN
    UPDATE "inventario"
      SET "stockActual" = "stockActual" - NEW."cantidad", "updatedAt" = now()
      WHERE "id" = NEW."inventarioId";
  ELSE
    UPDATE "inventario"
      SET "stockActual" = "stockActual" + NEW."cantidad", "updatedAt" = now()
      WHERE "id" = NEW."inventarioId";
  END IF;

  RETURN NEW;
END;
$BODY$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_movimientos_inventario_stock ON "movimientos_inventario";
CREATE TRIGGER trg_movimientos_inventario_stock
  AFTER INSERT ON "movimientos_inventario"
  FOR EACH ROW EXECUTE FUNCTION trg_actualizar_stock_inventario();

-- Vista para el tablero de reorden y las alertas
CREATE OR REPLACE VIEW "partes_bajo_minimo" AS
  SELECT * FROM "inventario"
  WHERE "activo" = true AND "stockActual" <= "stockMinimo";

-- RLS — capa extra de defensa. La app se conecta a Postgres directo vía Prisma
-- (DATABASE_URL/DIRECT_URL con usuario dueño de las tablas), así que estas
-- políticas hoy no filtran nada de lo que hace la app (el control de acceso
-- real está en los route handlers de Next.js vía requireRole()). Se dejan
-- listas por si en el futuro se agrega acceso vía Supabase client con roles
-- anon/authenticated.
ALTER TABLE "inventario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "movimientos_inventario" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventario_service_role" ON "inventario";
CREATE POLICY "inventario_service_role" ON "inventario"
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "movimientos_inventario_service_role" ON "movimientos_inventario";
CREATE POLICY "movimientos_inventario_service_role" ON "movimientos_inventario"
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

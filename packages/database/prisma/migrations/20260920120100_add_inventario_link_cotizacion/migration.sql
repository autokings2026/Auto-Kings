-- Enlaza las líneas de cotización (ya existentes) con el catálogo de
-- inventario. Aditivo: columnas nullable, no se toca ninguna fila existente.

-- AlterTable
ALTER TABLE "items_cotizacion" ADD COLUMN IF NOT EXISTS "inventarioId" TEXT;
ALTER TABLE "items_cotizacion_adicional" ADD COLUMN IF NOT EXISTS "inventarioId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "items_cotizacion_inventarioId_idx" ON "items_cotizacion"("inventarioId");
CREATE INDEX IF NOT EXISTS "items_cotizacion_adicional_inventarioId_idx" ON "items_cotizacion_adicional"("inventarioId");

-- Búsqueda de historial por placa (agrupa órdenes por vehículo)
CREATE INDEX IF NOT EXISTS "ordenes_trabajo_placa_idx" ON "ordenes_trabajo"("placa");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "items_cotizacion" ADD CONSTRAINT "items_cotizacion_inventarioId_fkey"
    FOREIGN KEY ("inventarioId") REFERENCES "inventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "items_cotizacion_adicional" ADD CONSTRAINT "items_cotizacion_adicional_inventarioId_fkey"
    FOREIGN KEY ("inventarioId") REFERENCES "inventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Función RPC atómica: descuenta stock de las partes de una OT al confirmarla
-- (Control de Calidad aprobado). Idempotente — si ya se generaron salidas
-- para esta OT, no vuelve a descontar (permite reintentar sin duplicar).
-- No bloquea por falta de stock: devuelve advertencias de faltante.
CREATE OR REPLACE FUNCTION fn_descontar_inventario_ot(p_orden_id TEXT, p_usuario_id TEXT)
RETURNS TABLE(inventario_id TEXT, nombre TEXT, faltante DECIMAL) AS $BODY$
DECLARE
  v_ya_descontado INT;
  v_ids TEXT[];
BEGIN
  SELECT COUNT(*) INTO v_ya_descontado
  FROM "movimientos_inventario"
  WHERE "referenciaOrdenId" = p_orden_id AND "tipo" = 'SALIDA';

  IF v_ya_descontado > 0 THEN
    SELECT ARRAY_AGG(DISTINCT "inventarioId") INTO v_ids
    FROM "movimientos_inventario"
    WHERE "referenciaOrdenId" = p_orden_id AND "tipo" = 'SALIDA';
  ELSE
    WITH partes_originales AS (
      SELECT ic."inventarioId" AS inv_id, ic."cantidad" AS cant
      FROM "items_cotizacion" ic
      JOIN "diagnostico_cotizaciones" dc ON dc."id" = ic."cotizacionId"
      WHERE dc."ordenId" = p_orden_id AND ic."tipo" = 'PARTE' AND ic."inventarioId" IS NOT NULL
    ),
    partes_adicionales AS (
      SELECT ica."inventarioId" AS inv_id, ica."cantidad" AS cant
      FROM "items_cotizacion_adicional" ica
      JOIN "cotizaciones_adicionales" ca ON ca."id" = ica."cotizacionId"
      WHERE ca."ordenId" = p_orden_id AND ca."aprobado" = true
        AND ica."tipo" = 'PARTE' AND ica."inventarioId" IS NOT NULL
    ),
    todas AS (
      SELECT * FROM partes_originales
      UNION ALL
      SELECT * FROM partes_adicionales
    ),
    insertados AS (
      INSERT INTO "movimientos_inventario"
        ("id", "inventarioId", "tipo", "cantidad", "referenciaOrdenId", "usuarioId", "nota", "createdAt")
      SELECT gen_random_uuid()::text, inv_id, 'SALIDA', cant, p_orden_id, p_usuario_id,
             'Descuento automático por confirmación de OT', now()
      FROM todas
      RETURNING "inventarioId"
    )
    SELECT ARRAY_AGG(DISTINCT "inventarioId") INTO v_ids FROM insertados;
  END IF;

  RETURN QUERY
    SELECT i."id", i."nombre", (-i."stockActual")
    FROM "inventario" i
    WHERE i."id" = ANY(COALESCE(v_ids, ARRAY[]::text[])) AND i."stockActual" < 0;
END;
$BODY$ LANGUAGE plpgsql;

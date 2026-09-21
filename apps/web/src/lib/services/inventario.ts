import { prisma } from '@/lib/prisma'
import { TipoMovimientoInventario } from '@kings/shared'
import type { Prisma } from '@prisma/client'

type PrismaClientOrTx = typeof prisma | Prisma.TransactionClient

// ── Types ────────────────────────────────────────────────────────────────────

export interface CreateInventarioInput {
  codigo: string
  nombre: string
  descripcion?: string
  precioVenta: number
  precioCosto?: number
  stockMinimo?: number
  unidad?: string
  proveedor?: string
}

export interface UpdateInventarioInput {
  nombre?: string
  descripcion?: string | null
  precioVenta?: number
  precioCosto?: number | null
  stockMinimo?: number
  unidad?: string
  proveedor?: string | null
  activo?: boolean
}

export interface RegistrarMovimientoInput {
  tipo: 'ENTRADA' | 'AJUSTE'
  cantidad: number
  nota?: string
}

export interface QueryInventarioInput {
  q?: string
  bajoMinimo?: boolean
  soloActivos?: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function badRequest(msg: string): never {
  const err = new Error(msg)
  ;(err as Error & { status: number }).status = 400
  throw err
}

function notFound(msg: string): never {
  const err = new Error(msg)
  ;(err as Error & { status: number }).status = 404
  throw err
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export async function listInventario(query: QueryInventarioInput) {
  const items = await prisma.inventario.findMany({
    where: {
      ...(query.soloActivos !== false ? { activo: true } : {}),
      ...(query.q
        ? {
            OR: [
              { nombre: { contains: query.q, mode: 'insensitive' } },
              { codigo: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { nombre: 'asc' },
  })

  if (query.bajoMinimo) {
    return items.filter((i) => Number(i.stockActual) <= Number(i.stockMinimo))
  }
  return items
}

export async function createInventario(dto: CreateInventarioInput) {
  const codigo = dto.codigo.trim().toUpperCase()
  if (!codigo) badRequest('El código es requerido')

  const existente = await prisma.inventario.findUnique({ where: { codigo } })
  if (existente) badRequest('Ya existe una parte con ese código')

  return prisma.inventario.create({
    data: {
      codigo,
      nombre: dto.nombre.trim(),
      descripcion: dto.descripcion,
      precioVenta: dto.precioVenta,
      precioCosto: dto.precioCosto,
      stockMinimo: dto.stockMinimo ?? 0,
      unidad: dto.unidad?.trim() || 'unidad',
      proveedor: dto.proveedor,
    },
  })
}

export async function updateInventario(id: string, dto: UpdateInventarioInput) {
  const inv = await prisma.inventario.findUnique({ where: { id } })
  if (!inv) notFound('Parte no encontrada')

  return prisma.inventario.update({
    where: { id },
    data: {
      ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
      ...(dto.descripcion !== undefined ? { descripcion: dto.descripcion } : {}),
      ...(dto.precioVenta !== undefined ? { precioVenta: dto.precioVenta } : {}),
      ...(dto.precioCosto !== undefined ? { precioCosto: dto.precioCosto } : {}),
      ...(dto.stockMinimo !== undefined ? { stockMinimo: dto.stockMinimo } : {}),
      ...(dto.unidad !== undefined ? { unidad: dto.unidad.trim() || 'unidad' } : {}),
      ...(dto.proveedor !== undefined ? { proveedor: dto.proveedor } : {}),
      ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
    },
  })
}

// ── Movimientos (libro mayor — la única vía de escritura del stock) ──────────

export async function registrarMovimiento(id: string, dto: RegistrarMovimientoInput, userId: string) {
  const inv = await prisma.inventario.findUnique({ where: { id } })
  if (!inv) notFound('Parte no encontrada')
  if (dto.cantidad === 0) badRequest('La cantidad no puede ser cero')
  if (dto.tipo === 'ENTRADA' && dto.cantidad < 0) badRequest('La cantidad debe ser positiva para una entrada')

  return prisma.movimientoInventario.create({
    data: {
      inventarioId: id,
      tipo: dto.tipo as TipoMovimientoInventario,
      cantidad: dto.cantidad,
      usuarioId: userId,
      nota: dto.nota,
    },
  })
}

export async function listMovimientos(id: string) {
  const inv = await prisma.inventario.findUnique({ where: { id } })
  if (!inv) notFound('Parte no encontrada')

  return prisma.movimientoInventario.findMany({
    where: { inventarioId: id },
    orderBy: { createdAt: 'desc' },
    include: {
      usuario: { select: { id: true, nombre: true } },
      referenciaOrden: { select: { id: true, numero: true } },
    },
  })
}

// ── Búsqueda para el picker de cotización ────────────────────────────────────

export async function buscarInventarioParaCotizacion(q: string) {
  return prisma.inventario.findMany({
    where: {
      activo: true,
      OR: [
        { nombre: { contains: q, mode: 'insensitive' } },
        { codigo: { contains: q, mode: 'insensitive' } },
      ],
    },
    orderBy: { nombre: 'asc' },
    take: 15,
    select: { id: true, codigo: true, nombre: true, precioVenta: true, stockActual: true, unidad: true },
  })
}

// ── Descuento atómico al confirmar una OT (vía función RPC de Postgres) ─────

export async function descontarInventarioOT(ordenId: string, userId: string, client: PrismaClientOrTx = prisma) {
  const advertencias = await client.$queryRaw<
    { inventario_id: string; nombre: string; faltante: string }[]
  >`SELECT * FROM fn_descontar_inventario_ot(${ordenId}, ${userId})`

  return advertencias.map((a) => ({
    inventarioId: a.inventario_id,
    nombre: a.nombre,
    faltante: Number(a.faltante),
  }))
}

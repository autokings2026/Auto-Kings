// Tipos compartidos entre frontend (Next.js) y backend (NestJS)

import {
  EstadoCita,
  EstadoOT,
  FaseOT,
  RolUsuario,
  TipoCombustible,
  TipoItemCotizacion,
  TipoMensajeWA,
  TipoPlantillaWA,
} from './enums'

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string     // user id
  email: string
  nombre: string
  rol: RolUsuario
  iat?: number
  exp?: number
}

export interface SessionUser {
  id: string
  nombre: string
  email: string
  rol: RolUsuario
}

// ─── Catálogo ────────────────────────────────────────────────────────────────

export interface MarcaDto {
  id: string
  nombre: string
  activa: boolean
}

export interface ModeloDto {
  id: string
  nombre: string
  marcaId: string
  activo: boolean
}

export interface MarcaConModelosDto extends MarcaDto {
  modelos: ModeloDto[]
}

// ─── Citas ───────────────────────────────────────────────────────────────────

export interface CreateCitaDto {
  nombre: string        // nombre del cliente
  email?: string
  telefono: string
  marcaId: string
  modeloId: string
  anio: number
  placa: string
  fecha: string         // ISO date "YYYY-MM-DD"
  hora: string          // "HH:MM"
  comentarios?: string
}

export interface CitaDto {
  id: string
  clienteId: string
  clienteNombre: string
  clienteTelefono: string
  clienteEmail?: string
  marcaId: string
  marcaNombre: string
  modeloId: string
  modeloNombre: string
  anio: number
  placa: string
  fecha: string
  hora: string
  comentarios?: string
  estado: EstadoCita
  createdAt: string
}

export interface DisponibilidadDto {
  fecha: string
  hora: string
  disponible: boolean
  citasActuales: number
  maxCitas: number
}

// ─── Órdenes de Trabajo ──────────────────────────────────────────────────────

export interface CreateOrdenDto {
  citaId?: string
  clienteId: string
  tecnicoId: string
  marcaId: string
  modeloId: string
  anio: number
  placa: string
  color: string
  combustible: TipoCombustible
  kilometraje: number
}

export interface OrdenResumenDto {
  id: string
  numero: string
  clienteNombre: string
  clienteTelefono: string
  tecnicoNombre: string
  marcaNombre: string
  modeloNombre: string
  anio: number
  placa: string
  color: string
  faseActual: FaseOT
  estado: EstadoOT
  createdAt: string
  updatedAt: string
}

export interface OrdenDetalleDto extends OrdenResumenDto {
  clienteEmail?: string
  combustible: TipoCombustible
  kilometraje: number
  citaId?: string
  fotos: FotoIngresoDto[]
  checklistRecepcion?: ChecklistRecepcionDto
  diagnostico?: DiagnosticoCotizacionDto
  reparacion?: ReparacionDto
  controlesCC: ControlCalidadDto[]
  entrega?: EntregaDto
  encuesta?: EncuestaDto
  eventos: EventoOTDto[]
}

// ─── Fotos ───────────────────────────────────────────────────────────────────

export interface FotoIngresoDto {
  id: string
  url: string
  publicId: string
  creadoPorNombre: string
  createdAt: string
}

// ─── Checklist de Recepción ──────────────────────────────────────────────────

export interface ChecklistRecepcionDto {
  id: string
  testigos: string[]
  testigoOtro?: string
  anormalidades: string[]
  anormalidadOtro?: string
  observacionesRecepcion?: string
  observacionesAdicionales?: string
  tokenAprobacion: string
  aceptado: boolean | null
  fechaRespuesta?: string
  comentarioCliente?: string
  createdAt: string
}

export interface SaveChecklistDto {
  testigos: string[]
  testigoOtro?: string
  anormalidades: string[]
  anormalidadOtro?: string
  observacionesRecepcion?: string
  observacionesAdicionales?: string
}

// ─── Diagnóstico y Cotización ────────────────────────────────────────────────

export interface ItemCotizacionDto {
  id?: string           // undefined = nuevo ítem no guardado
  descripcion: string
  tipo: TipoItemCotizacion
  cantidad: number
  precioUnitario: number
  subtotal: number
  posicion: number
}

export interface DiagnosticoCotizacionDto {
  id: string
  sintomaCliente: string
  diagnosticoTecnico: string
  items: ItemCotizacionDto[]
  totalMateriales: number
  totalManoObra: number
  totalGeneral: number
  aprobado: boolean | null
  fechaAprobacion?: string
  mensajeAprobacion?: string
  pdfUrl?: string
  createdAt: string
}

export interface CreateDiagnosticoDto {
  sintomaCliente: string
  diagnosticoTecnico: string
  items: Omit<ItemCotizacionDto, 'id'>[]
}

// ─── Reparación ──────────────────────────────────────────────────────────────

export interface ReparacionDto {
  id: string
  tecnicoNombre: string
  notas?: string
  iniciadaEn?: string
  finalizadaEn?: string
  duracionMinutos?: number  // calculado: finalizadaEn - iniciadaEn
}

// ─── Control de Calidad ──────────────────────────────────────────────────────

export interface ControlCalidadDto {
  id: string
  aprobado: boolean
  observaciones?: string
  revisadoPorNombre: string
  revisadoEn: string
}

// ─── Entrega ─────────────────────────────────────────────────────────────────

export interface EntregaDto {
  id: string
  notificadoEn?: string
  entregadoEn?: string
  registradoPorNombre: string
  encuestaEmailEnviado: boolean
}

// ─── Encuesta ────────────────────────────────────────────────────────────────

export interface EncuestaDto {
  id: string
  token: string
  calidad?: number
  tiempo?: number
  atencion?: number
  comentario?: string
  respondidoEn?: string
  promedioGeneral?: number  // calculado en frontend
}

export interface SubmitEncuestaDto {
  calidad: number
  tiempo: number
  atencion: number
  comentario?: string
}

// ─── WhatsApp ────────────────────────────────────────────────────────────────

export interface MensajeWADto {
  id: string
  texto: string
  tipo: TipoMensajeWA
  plantillaUsada?: TipoPlantillaWA
  leido: boolean
  enviadoPorNombre: string
  enviadoEn: string
  ordenId?: string
  ordenNumero?: string
}

export interface CreateMensajeWADto {
  clienteId: string
  ordenId?: string
  texto: string
  tipo: TipoMensajeWA
  plantillaUsada?: TipoPlantillaWA
}

export interface ConversacionClienteDto {
  clienteId: string
  clienteNombre: string
  clienteTelefono: string
  ultimoMensaje?: MensajeWADto
  totalNoLeidos: number
  minutosUltimoMensaje: number  // para alertas
}

// ─── Eventos / Auditoría ─────────────────────────────────────────────────────

export interface EventoOTDto {
  id: string
  tipo: string
  descripcion: string
  metadata?: Record<string, unknown>
  realizadoPorNombre?: string
  createdAt: string
}

// ─── Horario ─────────────────────────────────────────────────────────────────

export interface HorarioDia {
  dia: number      // 0=Domingo, 1=Lunes, ..., 6=Sábado
  activo: boolean
  apertura: string // "HH:MM"
  cierre: string   // "HH:MM"
}

// ─── Paginación ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PaginationQuery {
  page?: number
  pageSize?: number
  search?: string
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStatsDto {
  citasHoy: number
  vehiculosEnTaller: number
  enControlCalidad: number
  entregadosHoy: number
  conversacionesSinResponder: number
}

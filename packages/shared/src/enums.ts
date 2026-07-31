// Enums espejo de los definidos en Prisma — se usan en frontend y backend
// sin importar @kings/database directamente en el web.

export enum RolUsuario {
  EMPLEADO = 'EMPLEADO',
  CONTROL_CALIDAD = 'CONTROL_CALIDAD',
  ADMIN = 'ADMIN',
}

export enum EstadoCita {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADA = 'CONFIRMADA',
  CANCELADA = 'CANCELADA',
  CONVERTIDA = 'CONVERTIDA',
  NO_ASISTIO = 'NO_ASISTIO',
}

export enum FaseOT {
  LLEGADA_FOTOS = 'LLEGADA_FOTOS',
  DIAGNOSTICO = 'DIAGNOSTICO',
  REPARACION = 'REPARACION',
  CONTROL_CALIDAD = 'CONTROL_CALIDAD',
  ENTREGA = 'ENTREGA',
  COMPLETADA = 'COMPLETADA',
}

export enum EstadoOT {
  ACTIVA = 'ACTIVA',
  EN_ESPERA_APROBACION = 'EN_ESPERA_APROBACION',
  RECHAZADA_COTIZACION = 'RECHAZADA_COTIZACION',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA',
}

export enum TipoCombustible {
  GASOLINA = 'GASOLINA',
  DIESEL = 'DIESEL',
  HIBRIDO = 'HIBRIDO',
  ELECTRICO = 'ELECTRICO',
  GAS = 'GAS',
}

export enum TipoItemCotizacion {
  MATERIAL = 'MATERIAL',
  PARTE = 'PARTE',
  MANO_OBRA = 'MANO_OBRA',
}

export enum TipoEventoOT {
  CREACION_OT = 'CREACION_OT',
  FOTO_SUBIDA = 'FOTO_SUBIDA',
  DIAGNOSTICO_REGISTRADO = 'DIAGNOSTICO_REGISTRADO',
  COTIZACION_GENERADA = 'COTIZACION_GENERADA',
  COTIZACION_ENVIADA_WA = 'COTIZACION_ENVIADA_WA',
  COTIZACION_APROBADA = 'COTIZACION_APROBADA',
  COTIZACION_RECHAZADA = 'COTIZACION_RECHAZADA',
  REPARACION_INICIADA = 'REPARACION_INICIADA',
  REPARACION_FINALIZADA = 'REPARACION_FINALIZADA',
  CC_APROBADO = 'CC_APROBADO',
  CC_RECHAZADO = 'CC_RECHAZADO',
  ENTREGA_NOTIFICADA = 'ENTREGA_NOTIFICADA',
  VEHICULO_ENTREGADO = 'VEHICULO_ENTREGADO',
  ENCUESTA_ENVIADA = 'ENCUESTA_ENVIADA',
  ENCUESTA_RESPONDIDA = 'ENCUESTA_RESPONDIDA',
  ENCUESTA_APROBADA = 'ENCUESTA_APROBADA',
  ENCUESTA_RECHAZADA = 'ENCUESTA_RECHAZADA',
  CORTESIA_ENVIADA = 'CORTESIA_ENVIADA',
  CHECKLIST_GUARDADO = 'CHECKLIST_GUARDADO',
  CHECKLIST_ENVIADO_WA = 'CHECKLIST_ENVIADO_WA',
  CHECKLIST_ACEPTADO = 'CHECKLIST_ACEPTADO',
  CHECKLIST_RECHAZADO = 'CHECKLIST_RECHAZADO',
  CAMBIO_FASE = 'CAMBIO_FASE',
  NOTA_INTERNA = 'NOTA_INTERNA',
  CITA_CONVERTIDA = 'CITA_CONVERTIDA',
}

export enum TipoMensajeWA {
  SALIENTE = 'SALIENTE',
  ENTRANTE = 'ENTRANTE',
}

export enum TipoPlantillaWA {
  CONFIRMAR_CITA = 'CONFIRMAR_CITA',
  DIAGNOSTICO_LISTO = 'DIAGNOSTICO_LISTO',
  COTIZACION_LISTA = 'COTIZACION_LISTA',
  VEHICULO_LISTO = 'VEHICULO_LISTO',
  ENCUESTA_SATISFACCION = 'ENCUESTA_SATISFACCION',
  PERSONALIZADO = 'PERSONALIZADO',
}

// Orden de fases para la barra de progreso y validación de avance
export const ORDEN_FASES: FaseOT[] = [
  FaseOT.LLEGADA_FOTOS,
  FaseOT.DIAGNOSTICO,
  FaseOT.REPARACION,
  FaseOT.CONTROL_CALIDAD,
  FaseOT.ENTREGA,
  FaseOT.COMPLETADA,
]

export const LABEL_FASE: Record<FaseOT, string> = {
  [FaseOT.LLEGADA_FOTOS]: 'Llegada y Fotos',
  [FaseOT.DIAGNOSTICO]: 'Diagnóstico',
  [FaseOT.REPARACION]: 'Reparación',
  [FaseOT.CONTROL_CALIDAD]: 'Control de Calidad',
  [FaseOT.ENTREGA]: 'Entrega',
  [FaseOT.COMPLETADA]: 'Completada',
}

export const LABEL_ROL: Record<RolUsuario, string> = {
  [RolUsuario.EMPLEADO]: 'Técnico / Empleado',
  [RolUsuario.CONTROL_CALIDAD]: 'Control de Calidad',
  [RolUsuario.ADMIN]: 'Administrador',
}

export const LABEL_COMBUSTIBLE: Record<TipoCombustible, string> = {
  [TipoCombustible.GASOLINA]: 'Gasolina',
  [TipoCombustible.DIESEL]: 'Diésel',
  [TipoCombustible.HIBRIDO]: 'Híbrido',
  [TipoCombustible.ELECTRICO]: 'Eléctrico',
  [TipoCombustible.GAS]: 'Gas',
}

// Checklist de recepción — testigos del tablero y anormalidades reportadas.
// Listas fijas usadas tanto en el formulario del técnico como en la vista
// pública de aceptación del cliente.
export const TESTIGOS_TABLERO: string[] = [
  'Check Engine (MIL)',
  'ABS',
  'Airbag (SRS)',
  'Control de Tracción (ESP/TCS)',
  'TPMS (Presión de neumáticos)',
  'Batería / Sistema de carga',
  'Presión de aceite',
  'Temperatura del motor',
  'Dirección asistida (EPS)',
  'Freno de estacionamiento / Sistema de frenos',
  'AWD / 4WD',
  'Inmovilizador / Llave',
  'Transmisión',
]

export const ANORMALIDADES_REPORTADAS: string[] = [
  'No enciende',
  'No da marcha',
  'Se apaga en marcha',
  'Falla de motor',
  'Pérdida de potencia',
  'Ralentí inestable',
  'Luces parpadean',
  'Descarga de batería',
  'Aire acondicionado no funciona',
  'Radio / Pantalla no funciona',
  'Cámara de reversa no funciona',
  'Sensores / ADAS con fallas',
  'Elevalunas eléctricos con falla',
  'Cierre centralizado con falla',
  'Llave inteligente / Control remoto con falla',
]

// Utilidades para fechas sin hora (ej. Cita.fecha, columna @db.Date).
//
// Prisma representa esas fechas como medianoche UTC, así que se construyen,
// comparan y formatean siempre en UTC. Convertirlas a la hora de Honduras las
// movería al día anterior.

// Honduras es UTC-6 todo el año (sin horario de verano).
const DESFASE_HONDURAS_MS = 6 * 60 * 60 * 1000

// Fecha de hoy en Honduras, sin importar la zona horaria del servidor.
export function hoyHonduras(ahora: Date = new Date()): Date {
  const local = new Date(ahora.getTime() - DESFASE_HONDURAS_MS)
  local.setUTCHours(0, 0, 0, 0)
  return local
}

export function sumarDias(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha)
  resultado.setUTCDate(resultado.getUTCDate() + dias)
  return resultado
}

// Semana calendario (lunes → domingo). `fin` es el lunes siguiente (excluido).
export function rangoSemana(fecha: Date): { inicio: Date; fin: Date } {
  const diasDesdeLunes = (fecha.getUTCDay() + 6) % 7
  const inicio = sumarDias(fecha, -diasDesdeLunes)
  return { inicio, fin: sumarDias(inicio, 7) }
}

// Mes calendario completo. `fin` es el día 1 del mes siguiente (excluido).
export function rangoMes(fecha: Date): { inicio: Date; fin: Date } {
  const anio = fecha.getUTCFullYear()
  const mes = fecha.getUTCMonth()
  return { inicio: new Date(Date.UTC(anio, mes, 1)), fin: new Date(Date.UTC(anio, mes + 1, 1)) }
}

import { Resend } from 'resend'

const FROM_NAME = 'Kings Auto Diagnósticos'

function getResend(): Resend | null {
  const apiKey = process.env['RESEND_API_KEY']
  if (!apiKey) return null
  return new Resend(apiKey)
}

function getFrom(): string {
  const email = process.env['RESEND_FROM_EMAIL'] ?? 'onboarding@resend.dev'
  return `${FROM_NAME} <${email}>`
}

interface CitaEmailData {
  to: string
  nombre: string
  fecha: string
  hora: string
  marca: string
  modelo: string
  anio: number
  placa: string
  telefonoTaller: string
}

function fila(label: string, value: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
    <tr>
      <td width="40%" style="font-size:12px;color:#6b7280;padding:0;">${label}</td>
      <td style="font-size:14px;font-weight:600;color:#f9fafb;padding:0;">${value}</td>
    </tr>
  </table>`
}

function htmlConfirmacionCita(d: Omit<CitaEmailData, 'to'>): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:#111827;border-radius:12px 12px 0 0;padding:32px;text-align:center;border:1px solid #1f2937;border-bottom:none;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#f9fafb;">Kings Auto Diagnósticos</p>
          <p style="margin:6px 0 0;font-size:11px;color:#22d3ee;text-transform:uppercase;letter-spacing:2px;">Honduras</p>
        </td></tr>
        <tr><td style="height:3px;background:linear-gradient(90deg,#1e3a8a,#22d3ee);border-left:1px solid #1f2937;border-right:1px solid #1f2937;"></td></tr>
        <tr><td style="background:#111827;padding:32px 40px;border:1px solid #1f2937;border-top:none;border-bottom:none;">
          <p style="margin:0 0 8px;font-size:15px;color:#9ca3af;">Hola,</p>
          <p style="margin:0 0 24px;font-size:20px;font-weight:700;color:#f9fafb;">${d.nombre} 👋</p>
          <p style="margin:0 0 24px;font-size:14px;color:#d1d5db;line-height:1.6;">
            Tu cita en <strong style="color:#f9fafb;">Kings Auto Diagnósticos</strong> ha sido
            <span style="color:#22d3ee;font-weight:600;">confirmada</span>. Te esperamos con gusto.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#1f2937;border-radius:10px;padding:24px;margin-bottom:24px;">
            <tr><td>
              <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Detalle de la cita</p>
              ${fila('📅 Fecha', d.fecha)}
              ${fila('🕐 Hora', d.hora)}
              ${fila('🚗 Vehículo', `${d.marca} ${d.modelo} ${d.anio}`)}
              ${fila('🪪 Placa', d.placa)}
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e3a8a22;border:1px solid #1e3a8a55;border-radius:8px;padding:16px;margin-bottom:24px;">
            <tr><td>
              <p style="margin:0;font-size:13px;color:#93c5fd;line-height:1.6;">
                💡 <strong>Recuerda llegar puntual.</strong> Para cancelar comunícate al
                <a href="tel:${d.telefonoTaller}" style="color:#22d3ee;">${d.telefonoTaller}</a> con al menos 2 horas de anticipación.
              </p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#0d0d0d;border-radius:0 0 12px 12px;padding:20px 40px;border:1px solid #1f2937;border-top:none;text-align:center;">
          <p style="margin:0;font-size:12px;color:#6b7280;">© ${new Date().getFullYear()} Kings Auto Diagnósticos · Honduras</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

export async function sendConfirmacionCita(data: CitaEmailData): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY no configurado — email no enviado a', data.to)
    return
  }
  try {
    const { data: result, error } = await resend.emails.send({
      from: getFrom(),
      to: data.to,
      subject: `✅ Cita confirmada — ${data.fecha} a las ${data.hora}`,
      html: htmlConfirmacionCita(data),
    })
    if (error) throw error
    console.log('[Email] Confirmación enviada a', data.to, 'id:', result?.id)
  } catch (err) {
    console.error('[Email] Error al enviar confirmación a', data.to, err)
    throw err
  }
}

export async function sendRecordatorioCita(data: CitaEmailData): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY no configurado — email no enviado a', data.to)
    return
  }
  const html = htmlConfirmacionCita(data).replace(
    'ha sido <span style="color:#22d3ee;font-weight:600;">confirmada</span>. Te esperamos con gusto.',
    'es <span style="color:#22d3ee;font-weight:600;">mañana</span> — te enviamos este recordatorio.',
  )
  try {
    const { error } = await resend.emails.send({
      from: getFrom(),
      to: data.to,
      subject: `⏰ Recordatorio — Tu cita es mañana a las ${data.hora}`,
      html,
    })
    if (error) throw error
    console.log('[Email] Recordatorio enviado a', data.to)
  } catch (err) {
    console.error('[Email] Error al enviar recordatorio a', data.to, err)
  }
}

interface ConfirmacionCitaData {
  nombre: string
  fecha: string      // "Lunes 26 de mayo de 2026"
  hora: string       // "09:00 AM"
  marca: string
  modelo: string
  anio: number
  placa: string
  telefono: string   // teléfono del taller
}

export function htmlConfirmacionCita(d: ConfirmacionCitaData): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmación de cita — Kings Auto Diagnósticos</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header con logo / nombre -->
          <tr>
            <td style="background:#111827;border-radius:12px 12px 0 0;padding:32px;text-align:center;border:1px solid #1f2937;border-bottom:none;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#f9fafb;letter-spacing:-0.5px;">
                Kings Auto Diagnósticos
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#22d3ee;text-transform:uppercase;letter-spacing:2px;font-weight:600;">
                Honduras
              </p>
            </td>
          </tr>

          <!-- Barra de acento cyan -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#1e3a8a,#22d3ee);border-left:1px solid #1f2937;border-right:1px solid #1f2937;"></td>
          </tr>

          <!-- Cuerpo principal -->
          <tr>
            <td style="background:#111827;padding:32px 40px;border:1px solid #1f2937;border-top:none;border-bottom:none;">

              <p style="margin:0 0 8px;font-size:15px;color:#9ca3af;">Hola,</p>
              <p style="margin:0 0 24px;font-size:20px;font-weight:700;color:#f9fafb;">${d.nombre} 👋</p>

              <p style="margin:0 0 24px;font-size:14px;color:#d1d5db;line-height:1.6;">
                Tu cita en <strong style="color:#f9fafb;">Kings Auto Diagnósticos</strong> ha sido
                <span style="color:#22d3ee;font-weight:600;">confirmada</span>.
                Te esperamos con gusto.
              </p>

              <!-- Tarjeta de detalles -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#1f2937;border-radius:10px;padding:24px;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#6b7280;
                               text-transform:uppercase;letter-spacing:1px;">
                      Detalle de la cita
                    </p>

                    ${fila('📅 Fecha', d.fecha)}
                    ${fila('🕐 Hora', d.hora)}
                    ${fila('🚗 Vehículo', `${d.marca} ${d.modelo} ${d.anio}`)}
                    ${fila('🪪 Placa', d.placa)}
                  </td>
                </tr>
              </table>

              <!-- Instrucciones -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#1e3a8a22;border:1px solid #1e3a8a55;border-radius:8px;padding:16px;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0;font-size:13px;color:#93c5fd;line-height:1.6;">
                      💡 <strong>Recuerda llegar puntual</strong> con tu vehículo.
                      Si necesitas cancelar o reprogramar, comunícate al
                      <a href="tel:${d.telefono}" style="color:#22d3ee;">${d.telefono}</a>
                      con al menos 2 horas de anticipación.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0d0d0d;border-radius:0 0 12px 12px;padding:20px 40px;
                       border:1px solid #1f2937;border-top:none;text-align:center;">
              <p style="margin:0;font-size:12px;color:#6b7280;">
                © ${new Date().getFullYear()} Kings Auto Diagnósticos · Honduras
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#4b5563;">
                Este correo fue enviado automáticamente, no respondas directamente.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function fila(label: string, value: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
    <tr>
      <td width="40%" style="font-size:12px;color:#6b7280;padding:0;">${label}</td>
      <td style="font-size:14px;font-weight:600;color:#f9fafb;padding:0;">${value}</td>
    </tr>
  </table>`
}

// ── Recordatorio 24h (reusa la misma estructura) ──────────────────────────────
export function htmlRecordatorioCita(d: ConfirmacionCitaData): string {
  return htmlConfirmacionCita(d).replace(
    'ha sido <span style="color:#22d3ee;font-weight:600;">confirmada</span>',
    'es <span style="color:#22d3ee;font-weight:600;">mañana</span> — te enviamos este recordatorio',
  )
}

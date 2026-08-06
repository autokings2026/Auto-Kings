import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

const vapidPublicKey = process.env['NEXT_PUBLIC_VAPID_PUBLIC_KEY']
const vapidPrivateKey = process.env['VAPID_PRIVATE_KEY']
const vapidSubject = process.env['VAPID_SUBJECT'] ?? 'mailto:soporte@auto-kings.com'

// Si aún no se han configurado las llaves (ej. entorno local recién clonado),
// no se rompe la app: simplemente los envíos se omiten silenciosamente.
const vapidConfigured = Boolean(vapidPublicKey && vapidPrivateKey)
if (vapidConfigured) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey!, vapidPrivateKey!)
}

export interface PushSubscriptionInput {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

// ── Suscripción ───────────────────────────────────────────────────────────────

export async function guardarSuscripcion(userId: string, sub: PushSubscriptionInput, userAgent?: string) {
  return prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: {
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userAgent,
    },
    update: {
      userId,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userAgent,
    },
  })
}

export async function eliminarSuscripcion(endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } })
}

// ¿Este usuario ya tiene al menos una suscripción activa? (para mostrar el
// estado correcto del botón "Activar notificaciones" en otro dispositivo)
export async function tieneSuscripcion(userId: string, endpoint?: string) {
  if (endpoint) {
    return prisma.pushSubscription.findFirst({ where: { userId, endpoint } })
  }
  return prisma.pushSubscription.findFirst({ where: { userId } })
}

// ── Envío ─────────────────────────────────────────────────────────────────────

export interface NotificacionPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

// Envía la notificación a TODO el equipo activo (todos los roles). Si alguna
// suscripción ya expiró o el navegador la revocó (404/410), se elimina de la
// base de datos en vez de reintentar indefinidamente.
export async function notificarATodoElEquipo(payload: NotificacionPayload) {
  if (!vapidConfigured) {
    console.warn('[push] VAPID no configurado — se omite el envío de notificaciones push.')
    return { enviadas: 0, fallidas: 0 }
  }

  const subs = await prisma.pushSubscription.findMany({
    where: { user: { activo: true } },
  })

  let enviadas = 0
  let fallidas = 0

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        )
        enviadas++
      } catch (err) {
        fallidas++
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => null)
        } else {
          console.error('[push] Error enviando notificación:', err)
        }
      }
    }),
  )

  return { enviadas, fallidas }
}

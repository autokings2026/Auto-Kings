// Service worker para notificaciones push del panel admin de Kings Auto.
// No hace nada de caching/offline — su único propósito es recibir el evento
// "push" del navegador y mostrar la notificación, incluso con la pestaña
// cerrada.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = { title: 'Kings Auto', body: 'Tienes una notificación nueva.', url: '/citas' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {
    // payload no era JSON — se usa el mensaje por defecto
  }

  const options = {
    body: data.body,
    icon: '/logo-dark.jpeg',
    badge: '/logo-dark.jpeg',
    tag: data.tag,
    data: { url: data.url || '/citas' },
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Al hacer click en la notificación: enfoca una pestaña ya abierta de la app
// si existe, o abre una nueva en la URL indicada.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/citas'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      return self.clients.openWindow(targetUrl)
    }),
  )
})

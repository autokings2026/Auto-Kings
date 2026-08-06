'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react'

type Estado = 'cargando' | 'no-soportado' | 'bloqueado' | 'activo' | 'inactivo'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

// El navegador exige la llave pública VAPID como Uint8Array, no como string.
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from(Array.from(rawData).map((c) => c.charCodeAt(0)))
}

export function PushToggle() {
  const [estado, setEstado] = useState<Estado>('cargando')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const check = async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        setEstado('no-soportado')
        return
      }
      if (Notification.permission === 'denied') {
        setEstado('bloqueado')
        return
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration('/sw.js')
        const sub = await reg?.pushManager.getSubscription()
        setEstado(sub ? 'activo' : 'inactivo')
      } catch {
        setEstado('inactivo')
      }
    }
    check()
  }, [])

  const activar = async () => {
    if (!VAPID_PUBLIC_KEY) {
      setError('Notificaciones no configuradas en el servidor.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const permiso = await Notification.requestPermission()
      if (permiso !== 'granted') {
        setEstado(permiso === 'denied' ? 'bloqueado' : 'inactivo')
        return
      }

      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      if (!res.ok) throw new Error('No se pudo registrar la suscripción')

      setEstado('activo')
    } catch (err) {
      console.error(err)
      setError('No se pudieron activar las notificaciones. Intenta de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  const desactivar = async () => {
    setBusy(true)
    setError('')
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setEstado('inactivo')
    } catch (err) {
      console.error(err)
      setError('No se pudieron desactivar las notificaciones.')
    } finally {
      setBusy(false)
    }
  }

  if (estado === 'cargando' || estado === 'no-soportado') return null

  return (
    <div>
      {estado === 'bloqueado' && (
        <p className="flex items-center gap-2 text-[11px] text-muted-foreground leading-snug">
          <BellOff className="h-3.5 w-3.5 shrink-0" />
          Notificaciones bloqueadas por el navegador. Actívalas desde la configuración del sitio.
        </p>
      )}

      {estado === 'inactivo' && (
        <button
          onClick={activar}
          disabled={busy}
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
          Activar notificaciones de citas
        </button>
      )}

      {estado === 'activo' && (
        <button
          onClick={desactivar}
          disabled={busy}
          className="flex items-center gap-2 text-xs font-medium text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellRing className="h-3.5 w-3.5" />}
          Notificaciones activadas
        </button>
      )}

      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  )
}

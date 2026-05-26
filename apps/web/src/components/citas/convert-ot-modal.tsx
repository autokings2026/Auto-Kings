'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TipoCombustible, LABEL_COMBUSTIBLE } from '@kings/shared'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Usuario { id: string; nombre: string; email: string }

interface Props {
  citaId: string
  clienteNombre: string
  vehiculo: string
  onClose: () => void
}

export function ConvertOtModal({ citaId, clienteNombre, vehiculo, onClose }: Props) {
  const { data: session } = useSession()
  const router = useRouter()

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(true)
  const [tecnicoId, setTecnicoId] = useState('')
  const [color, setColor] = useState('')
  const [combustible, setCombustible] = useState<TipoCombustible>(TipoCombustible.GASOLINA)
  const [kilometraje, setKilometraje] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session?.user?.accessToken) return
    setLoadingUsuarios(true)
    fetch(`${API}/auth/usuarios`, {
      headers: { Authorization: `Bearer ${session.user.accessToken}` },
    })
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((raw: unknown) => {
        const list: Usuario[] = Array.isArray(raw) ? raw : (raw as { data: Usuario[] })?.data ?? []
        setUsuarios(list)
        if (list.length > 0) setTecnicoId(list[0]!.id)
      })
      .catch(e => setError(`No se pudieron cargar los técnicos: ${e.message}`))
      .finally(() => setLoadingUsuarios(false))
  }, [session])

  const submit = async () => {
    if (!tecnicoId || !color || !kilometraje) { setError('Completa todos los campos'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch(`${API}/ordenes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.user?.accessToken}`,
        },
        body: JSON.stringify({
          citaId,
          tecnicoId,
          color,
          combustible,
          kilometraje: Number(kilometraje),
        }),
      })
      if (!res.ok) { const e = await res.json(); setError(e.message); return }
      const ot = await res.json()
      onClose()
      router.push(`/ordenes/${ot.id}`)
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-surface border border-surface-2 rounded-xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-2">
          <div>
            <h2 className="font-semibold text-white">Crear Orden de Trabajo</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{clienteNombre} · {vehiculo}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Técnico asignado *</Label>
            <select
              value={tecnicoId}
              onChange={e => setTecnicoId(e.target.value)}
              disabled={loadingUsuarios}
              className="w-full h-10 rounded-md border border-surface-2 bg-surface-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50"
            >
              {loadingUsuarios
                ? <option value="">Cargando técnicos…</option>
                : usuarios.length === 0
                  ? <option value="">No hay técnicos disponibles</option>
                  : usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nombre}</option>
                    ))
              }
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Color *</Label>
              <Input
                value={color}
                onChange={e => setColor(e.target.value)}
                placeholder="Ej: Blanco"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Kilometraje *</Label>
              <Input
                value={kilometraje}
                onChange={e => setKilometraje(e.target.value)}
                type="number"
                min="0"
                placeholder="Ej: 45000"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Combustible</Label>
            <select
              value={combustible}
              onChange={e => setCombustible(e.target.value as TipoCombustible)}
              className="w-full h-10 rounded-md border border-surface-2 bg-surface-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              {Object.values(TipoCombustible).map(c => (
                <option key={c} value={c}>{LABEL_COMBUSTIBLE[c]}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={submit} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando…</> : 'Crear OT'}
          </Button>
        </div>
      </div>
    </div>
  )
}

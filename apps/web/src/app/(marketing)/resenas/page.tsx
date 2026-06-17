'use client'

import { useState, useEffect } from 'react'
import { ResenaCard } from '@/components/marketing/ResenaCard'
import { StarRating } from '@/components/marketing/StarRating'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface Resena {
  id: string
  nombre: string
  vehiculo?: string
  calificacion: number
  comentario: string
  fecha: string
}

export default function ResenasPage() {
  const [resenas, setResenas] = useState<Resena[]>([])
  const [loading, setLoading] = useState(true)

  // Formulario
  const [nombre, setNombre] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [calificacion, setCalificacion] = useState(5)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetch('/api/public/resenas')
      .then(r => r.json())
      .then(data => { setResenas(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/public/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          vehiculoMarca: marca || undefined,
          vehiculoModelo: modelo || undefined,
          calificacion,
          comentario,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.message ?? 'Ocurrió un error.')
      } else {
        setExito(true)
        setNombre('')
        setMarca('')
        setModelo('')
        setCalificacion(5)
        setComentario('')
      }
    } catch {
      setErrorMsg('No se pudo conectar. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  const promedio = resenas.length > 0
    ? (resenas.reduce((acc, r) => acc + r.calificacion, 0) / resenas.length).toFixed(1)
    : null

  return (
    <div className="bg-white text-gray-900 pt-16 min-h-screen">
      {/* Header */}
      <section className="relative py-20 px-4 sm:px-6 overflow-hidden bg-gradient-to-br from-[#0f1a2e] to-[#1e3a8a]">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #00d4e8, transparent 60%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest text-[#00d4e8] uppercase mb-3">Testimonios</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Reseñas de Clientes
          </h1>
          {promedio && (
            <div className="inline-flex items-center gap-3 mt-2">
              <span className="text-3xl font-bold text-[#00d4e8]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {promedio}
              </span>
              <StarRating value={parseFloat(promedio)} readonly size="md" />
              <span className="text-[#6b7a99] text-sm">({resenas.length} reseñas)</span>
            </div>
          )}
        </div>
      </section>

      {/* Listado */}
      <section className="py-12 px-4 sm:px-6 border-t border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 rounded-xl bg-gray-200 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && resenas.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white p-16 text-center">
              <p className="text-gray-400">Aún no hay reseñas publicadas. ¡Sé el primero en dejar la tuya!</p>
            </div>
          )}

          {!loading && resenas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resenas.map(r => (
                <ResenaCard
                  key={r.id}
                  nombre={r.nombre}
                  vehiculo={r.vehiculo}
                  calificacion={r.calificacion}
                  comentario={r.comentario}
                  fecha={r.fecha}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Formulario */}
      <section className="py-20 px-4 sm:px-6 border-t border-gray-100 bg-white">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest text-[#00d4e8] uppercase mb-3">Tu opinión importa</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Deja tu Reseña
            </h2>
            <p className="text-sm text-gray-500">
              Será revisada y publicada en un plazo breve.
            </p>
          </div>

          {exito ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-gray-900 font-semibold">¡Gracias por tu reseña!</p>
              <p className="text-sm text-gray-500">Será publicada tras una breve revisión de nuestro equipo.</p>
              <button
                onClick={() => setExito(false)}
                className="text-sm text-[#1e3a8a] hover:text-[#00d4e8] transition-colors"
              >
                Dejar otra reseña
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1.5">
                  Tu nombre <span className="text-red-500">*</span>
                </label>
                <input
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                  placeholder="Ej: Juan Martínez"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-[#1e3a8a]/40 focus:ring-1 focus:ring-[#1e3a8a]/20 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1.5">Marca del vehículo</label>
                  <input
                    value={marca}
                    onChange={e => setMarca(e.target.value)}
                    placeholder="Toyota, Honda..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-[#1e3a8a]/40 focus:ring-1 focus:ring-[#1e3a8a]/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1.5">Modelo</label>
                  <input
                    value={modelo}
                    onChange={e => setModelo(e.target.value)}
                    placeholder="Corolla, Civic..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-[#1e3a8a]/40 focus:ring-1 focus:ring-[#1e3a8a]/20 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
                  Calificación <span className="text-red-500">*</span>
                </label>
                <StarRating value={calificacion} onChange={setCalificacion} size="lg" />
              </div>

              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1.5">
                  Comentario <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={comentario}
                  onChange={e => setComentario(e.target.value)}
                  required
                  minLength={20}
                  rows={4}
                  placeholder="Cuéntanos tu experiencia (mínimo 20 caracteres)..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-[#1e3a8a]/40 focus:ring-1 focus:ring-[#1e3a8a]/20 transition-colors resize-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">{comentario.length} / 1000</p>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                {enviando ? 'Enviando...' : 'Enviar Reseña'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}

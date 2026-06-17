'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, X, ChevronDown } from 'lucide-react'

interface BlogPost {
  id: string
  titulo: string
  slug: string
  categoria: string | null
  estado: 'BORRADOR' | 'PUBLICADO'
  createdAt: string
  imagenUrl: string | null
}

interface PostForm {
  titulo: string
  slug: string
  extracto: string
  contenido: string
  categoria: string
  imagenUrl: string
  estado: 'BORRADOR' | 'PUBLICADO'
}

const EMPTY_FORM: PostForm = {
  titulo: '',
  slug: '',
  extracto: '',
  contenido: '',
  categoria: '',
  imagenUrl: '',
  estado: 'BORRADOR',
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<PostForm>(EMPTY_FORM)
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const cargar = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/blog')
      .then(r => r.json())
      .then(data => { setPosts(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const abrirNuevo = () => {
    setEditId(null)
    setForm(EMPTY_FORM)
    setErrorMsg('')
    setShowForm(true)
  }

  const abrirEditar = async (post: BlogPost) => {
    setGuardando(true)
    const res = await fetch(`/api/admin/blog/${post.id}`)
    const data = await res.json()
    setForm({
      titulo: data.titulo,
      slug: data.slug,
      extracto: data.extracto,
      contenido: data.contenido,
      categoria: data.categoria ?? '',
      imagenUrl: data.imagenUrl ?? '',
      estado: data.estado,
    })
    setEditId(post.id)
    setErrorMsg('')
    setShowForm(true)
    setGuardando(false)
  }

  const handleTitulo = (v: string) => {
    setForm(f => ({ ...f, titulo: v, slug: editId ? f.slug : slugify(v) }))
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setErrorMsg('')
    try {
      const body = {
        ...form,
        categoria: form.categoria || undefined,
        imagenUrl: form.imagenUrl || undefined,
      }
      const res = editId
        ? await fetch(`/api/admin/blog/${editId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/admin/blog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.message ?? 'Error al guardar.')
        return
      }
      setShowForm(false)
      cargar()
    } catch {
      setErrorMsg('No se pudo conectar. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  const toggleEstado = async (post: BlogPost) => {
    const nuevoEstado = post.estado === 'PUBLICADO' ? 'BORRADOR' : 'PUBLICADO'
    await fetch(`/api/admin/blog/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    })
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, estado: nuevoEstado } : p))
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este artículo permanentemente?')) return
    await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona los artículos del blog de la landing page.</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-white text-sm font-semibold hover:bg-secondary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Artículo
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
          <div className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold text-foreground">{editId ? 'Editar Artículo' : 'Nuevo Artículo'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={guardar} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Título *</label>
                <input
                  value={form.titulo}
                  onChange={e => handleTitulo(e.target.value)}
                  required
                  placeholder="Título del artículo"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-2 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-secondary/50"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Slug (URL) *</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-surface-2">
                  <span className="text-muted-foreground text-xs">/blog/</span>
                  <input
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    required
                    pattern="[a-z0-9-]+"
                    className="flex-1 bg-transparent text-foreground text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Categoría</label>
                  <input
                    value={form.categoria}
                    onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                    placeholder="MANTENIMIENTO, MOTOR..."
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-2 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-secondary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Estado</label>
                  <select
                    value={form.estado}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value as 'BORRADOR' | 'PUBLICADO' }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-2 text-foreground text-sm focus:outline-none focus:border-secondary/50"
                  >
                    <option value="BORRADOR">Borrador</option>
                    <option value="PUBLICADO">Publicado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground uppercase tracking-wide mb-1.5">URL de imagen (Cloudinary)</label>
                <input
                  value={form.imagenUrl}
                  onChange={e => setForm(f => ({ ...f, imagenUrl: e.target.value }))}
                  placeholder="https://res.cloudinary.com/..."
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-2 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-secondary/50"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Extracto (resumen) *</label>
                <textarea
                  value={form.extracto}
                  onChange={e => setForm(f => ({ ...f, extracto: e.target.value }))}
                  required
                  rows={2}
                  placeholder="Breve descripción del artículo (máx. 500 caracteres)..."
                  maxLength={500}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-2 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-secondary/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Contenido *</label>
                <textarea
                  value={form.contenido}
                  onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
                  required
                  rows={10}
                  placeholder="Escribe el artículo aquí. Separa párrafos con una línea en blanco..."
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-2 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-secondary/50 resize-y font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Separa párrafos con una línea en blanco.</p>
              </div>

              {errorMsg && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                  {errorMsg}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-secondary text-white text-sm font-semibold hover:bg-secondary/90 disabled:opacity-50 transition-colors"
                >
                  {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
                  {guardando ? 'Guardando...' : (editId ? 'Guardar Cambios' : 'Crear Artículo')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-surface-2 text-sm transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="text-muted-foreground text-sm">No hay artículos. Crea el primero.</p>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    post.estado === 'PUBLICADO'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  }`}>
                    {post.estado === 'PUBLICADO' ? 'Publicado' : 'Borrador'}
                  </span>
                  {post.categoria && (
                    <span className="text-[10px] text-muted-foreground">{post.categoria}</span>
                  )}
                </div>
                <p className="font-semibold text-foreground text-sm truncate">{post.titulo}</p>
                <p className="text-xs text-muted-foreground">/blog/{post.slug}</p>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleEstado(post)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    post.estado === 'PUBLICADO'
                      ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20'
                      : 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20'
                  }`}
                >
                  {post.estado === 'PUBLICADO' ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {post.estado === 'PUBLICADO' ? 'Ocultar' : 'Publicar'}
                </button>
                <button
                  onClick={() => abrirEditar(post)}
                  className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => eliminar(post.id)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

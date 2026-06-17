import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { ChevronRight, Calendar } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Consejos de mantenimiento, novedades automotrices y artículos del equipo de Kings Auto Diagnósticos.',
}

const CATEGORIA_COLOR: Record<string, string> = {
  MANTENIMIENTO: 'bg-green-50 text-green-700 border-green-200',
  DIAGNOSTICO: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  MOTOR: 'bg-orange-50 text-orange-700 border-orange-200',
  FRENOS: 'bg-red-50 text-red-700 border-red-200',
  ELECTRICO: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  GENERAL: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { estado: 'PUBLICADO' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      titulo: true,
      slug: true,
      extracto: true,
      categoria: true,
      imagenUrl: true,
      createdAt: true,
    },
  })

  return (
    <div className="bg-white text-gray-900 pt-16 min-h-screen">
      {/* Header */}
      <section className="relative py-20 px-4 sm:px-6 overflow-hidden bg-gradient-to-br from-[#0f1a2e] to-[#1e3a8a]">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #00d4e8, transparent 60%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest text-[#00d4e8] uppercase mb-3">Artículos</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Blog
          </h1>
          <p className="text-white/70 leading-relaxed text-lg">
            Consejos de mantenimiento, novedades automotrices y todo lo que necesitas saber
            para cuidar tu vehículo.
          </p>
        </div>
      </section>

      {/* Lista */}
      <section className="py-12 pb-24 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          {posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white p-16 text-center">
              <p className="text-gray-400">Próximamente publicaremos artículos de interés automotriz.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => {
                const categoriaClass = post.categoria ? (CATEGORIA_COLOR[post.categoria] ?? CATEGORIA_COLOR.GENERAL) : CATEGORIA_COLOR.GENERAL
                return (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-[#1e3a8a]/30 hover:shadow-md transition-all flex flex-col"
                  >
                    {/* Imagen */}
                    {post.imagenUrl ? (
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={post.imagenUrl}
                          alt={post.titulo}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-[#1e3a8a] to-[#0f1a2e] flex items-center justify-center">
                        <span className="text-white/20 text-6xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                          KA
                        </span>
                      </div>
                    )}

                    {/* Contenido */}
                    <div className="p-5 flex-1 flex flex-col gap-3">
                      {post.categoria && (
                        <span className={`self-start text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${categoriaClass}`}>
                          {post.categoria}
                        </span>
                      )}
                      <h2 className="font-bold text-gray-900 text-base leading-snug group-hover:text-[#1e3a8a] transition-colors line-clamp-2">
                        {post.titulo}
                      </h2>
                      <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1">
                        {post.extracto}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.createdAt).toLocaleDateString('es-HN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <span className="flex items-center gap-1 text-xs text-[#1e3a8a] font-medium">
                          Leer
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { ChevronLeft, Calendar } from 'lucide-react'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.blogPost.findFirst({
    where: { slug: params.slug, estado: 'PUBLICADO' },
    select: { titulo: true, extracto: true },
  })
  if (!post) return { title: 'Artículo no encontrado' }
  return { title: post.titulo, description: post.extracto }
}

export default async function BlogPostPage({ params }: Props) {
  const post = await prisma.blogPost.findFirst({
    where: { slug: params.slug, estado: 'PUBLICADO' },
  })

  if (!post) notFound()

  return (
    <div className="bg-white text-gray-900 pt-16 min-h-screen">
      {/* Hero imagen o banner */}
      {post.imagenUrl ? (
        <div className="relative h-72 sm:h-96 w-full overflow-hidden">
          <Image
            src={post.imagenUrl}
            alt={post.titulo}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent" />
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-br from-[#0f1a2e] to-[#1e3a8a]" />
      )}

      {/* Contenido */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Back */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1e3a8a] transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al Blog
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {post.categoria && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#1e3a8a]/20 bg-[#1e3a8a]/8 text-[#1e3a8a]">
              {post.categoria}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Calendar className="h-3 w-3" />
            {new Date(post.createdAt).toLocaleDateString('es-HN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>

        <h1
          className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          {post.titulo}
        </h1>

        <p className="text-gray-500 text-lg leading-relaxed mb-10 border-l-4 border-[#00d4e8] pl-4">
          {post.extracto}
        </p>

        {/* Separador */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-10" />

        {/* Cuerpo del artículo */}
        <div className="prose prose-gray prose-sm max-w-none text-gray-600 leading-relaxed space-y-5">
          {post.contenido.split('\n\n').map((parrafo, i) => (
            <p key={i} className="whitespace-pre-line">
              {parrafo}
            </p>
          ))}
        </div>

        {/* Footer del artículo */}
        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Publicado por</p>
            <p className="text-sm font-semibold text-gray-900">Kings Auto Diagnósticos</p>
          </div>
          <Link
            href="/reservar"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 transition-colors"
          >
            Agendar Cita
          </Link>
        </div>
      </article>

      {/* Footer CTA */}
      <div className="border-t border-gray-100 py-12 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm text-gray-500 mb-4">¿Te gustó este artículo?</p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-[#1e3a8a] hover:text-[#00d4e8] transition-colors font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            Ver todos los artículos
          </Link>
        </div>
      </div>
    </div>
  )
}

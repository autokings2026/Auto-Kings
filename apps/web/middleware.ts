import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session

  // Rutas públicas — siempre accesibles
  const isPublicPath =
    nextUrl.pathname === '/' ||
    nextUrl.pathname.startsWith('/login') ||
    nextUrl.pathname.startsWith('/reservar') ||
    nextUrl.pathname.startsWith('/encuesta') ||
    nextUrl.pathname.startsWith('/servicios') ||
    nextUrl.pathname.startsWith('/nosotros') ||
    nextUrl.pathname.startsWith('/galeria') ||
    nextUrl.pathname.startsWith('/resenas') ||
    nextUrl.pathname.startsWith('/blog') ||
    nextUrl.pathname.startsWith('/api/public') ||
    nextUrl.pathname.startsWith('/api/auth')

  if (!isLoggedIn && !isPublicPath) {
    const loginUrl = new URL('/login', nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirigir a /dashboard si ya está autenticado y va al login
  if (isLoggedIn && nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo|icons).*)'],
}

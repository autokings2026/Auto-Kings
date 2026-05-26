import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { RolUsuario } from '@kings/shared'

const API_URL = process.env['API_URL'] ?? 'http://localhost:3001'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (!res.ok) return null

          const data = (await res.json()) as {
            accessToken: string
            user: { id: string; nombre: string; email: string; rol: RolUsuario }
          }

          return {
            id: data.user.id,
            name: data.user.nombre,
            nombre: data.user.nombre,
            email: data.user.email,
            rol: data.user.rol,
            accessToken: data.accessToken,
          }
        } catch {
          return null
        }
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // user.id es string | undefined en la base de NextAuth; el credentials provider siempre lo provee
        token.id = (user.id ?? '') as string
        token.nombre = user.nombre
        token.rol = user.rol
        token.accessToken = user.accessToken
      }
      return token
    },

    session({ session, token }) {
      session.user.id = token.id
      session.user.nombre = token.nombre
      // session.user.email lo gestiona NextAuth automáticamente del JWT
      session.user.rol = token.rol
      session.user.accessToken = token.accessToken
      if (token.error) session.error = token.error
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 horas (igual que JWT_EXPIRES_IN)
  },

  trustHost: true,
})

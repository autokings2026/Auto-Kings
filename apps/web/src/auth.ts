import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { RolUsuario } from '@kings/shared'

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
          const user = await prisma.user.findUnique({
            where: { email: (credentials.email as string).toLowerCase().trim() },
          })

          if (!user || !user.activo) return null

          const valid = await bcrypt.compare(credentials.password as string, user.password)
          if (!valid) return null

          return {
            id: user.id,
            name: user.nombre,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol as RolUsuario,
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
      }
      return token
    },

    session({ session, token }) {
      session.user.id = token.id
      session.user.nombre = token.nombre
      // session.user.email lo gestiona NextAuth automáticamente del JWT
      session.user.rol = token.rol
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

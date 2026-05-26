import { RolUsuario } from '@kings/shared'
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    id: string
    nombre: string
    rol: RolUsuario
    accessToken: string
  }

  interface Session {
    user: {
      id: string
      nombre: string
      email: string
      rol: RolUsuario
      accessToken: string
    }
    error?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    nombre: string
    rol: RolUsuario
    accessToken: string
    error?: string
  }
}

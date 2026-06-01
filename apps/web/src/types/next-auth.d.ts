import { RolUsuario } from '@kings/shared'
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    id: string
    nombre: string
    rol: RolUsuario
  }

  interface Session {
    user: {
      id: string
      nombre: string
      email: string
      rol: RolUsuario
    }
    error?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    nombre: string
    rol: RolUsuario
    error?: string
  }
}

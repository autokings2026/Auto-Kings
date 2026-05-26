import { SetMetadata } from '@nestjs/common'
import { RolUsuario } from '@kings/shared'

export const ROLES_KEY = 'roles'
export const Roles = (...roles: RolUsuario[]) => SetMetadata(ROLES_KEY, roles)

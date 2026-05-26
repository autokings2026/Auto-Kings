import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { SessionUser } from '@kings/shared'

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionUser => {
    const request = ctx.switchToHttp().getRequest<{ user: SessionUser }>()
    return request.user
  },
)

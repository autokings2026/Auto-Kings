import 'reflect-metadata'
import { NestFactory, HttpAdapterHost } from '@nestjs/core'
import { ValidationPipe, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'
import { AppModule } from '../src/app.module'
import serverlessHttp from 'serverless-http'

@Catch()
class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse()
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const message = exception instanceof Error ? exception.message : String(exception)
    res.status(status).json({ statusCode: status, message })
  }
}

let cachedHandler: ReturnType<typeof serverlessHttp>

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] })
  const { httpAdapter } = app.get(HttpAdapterHost)
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter))

  app.enableCors({
    origin: process.env['NEXT_PUBLIC_APP_URL']
      ? [process.env['NEXT_PUBLIC_APP_URL'], 'http://localhost:3000']
      : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  )

  await app.init()
  return serverlessHttp(app.getHttpAdapter().getInstance())
}

export default async function handler(req: any, res: any) {
  if (!cachedHandler) {
    cachedHandler = await bootstrap()
  }
  return cachedHandler(req, res)
}

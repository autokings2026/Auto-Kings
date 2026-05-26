import 'reflect-metadata'
import { NestFactory, HttpAdapterHost } from '@nestjs/core'
import { ValidationPipe, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'
import { AppModule } from './app.module'

@Catch()
class DevExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse()
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const message = exception instanceof Error ? exception.message : String(exception)
    console.error('[DevExceptionFilter]', exception)
    res.status(status).json({ statusCode: status, message, stack: exception instanceof Error ? exception.stack : undefined })
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const { httpAdapter } = app.get(HttpAdapterHost)
  app.useGlobalFilters(new DevExceptionFilter(httpAdapter))

  app.enableCors({
    origin: [
      process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  const port = process.env['PORT'] ?? 3001
  await app.listen(port)
  console.log(`🚗 Kings API running on http://localhost:${port}`)
}

bootstrap()

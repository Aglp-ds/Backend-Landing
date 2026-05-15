import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Permite consumir la API desde el frontend local o desde producción.
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  });

  // Todas las rutas quedan bajo /api para mantener la API ordenada.
  app.setGlobalPrefix('api');

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);

  console.log(`🚀 API corriendo en http://localhost:${port}/api`);
}

bootstrap();


import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // strip properties not in the DTO
      forbidNonWhitelisted: true, // reject requests with unknown properties
      transform: true,            // auto-convert types (e.g. string "5" → number 5)
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
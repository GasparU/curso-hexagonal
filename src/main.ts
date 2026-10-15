import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configurarApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configurarApp(app);

  const config = app.get(ConfigService);
  const puerto = config.getOrThrow<number>('PORT');

  await app.listen(puerto);
}

bootstrap();

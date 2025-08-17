import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.enableCors({ origin: process.env.CORS_ORIGINS?.split(',') || true });
    const port = Number(process.env.PORT || 3001);
    await app.listen(port);
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${port}`);
}

bootstrap();



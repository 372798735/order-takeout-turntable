import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app.module';
import { networkInterfaces } from 'os';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // 允许所有来源访问，解决跨域问题
  app.enableCors({
    origin: true, // 允许所有来源
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'Access-Control-Allow-Origin',
    ],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
    credentials: true, // 允许携带凭证
    preflightContinue: false,
    optionsSuccessStatus: 200,
  });

  // Root welcome page (not affected by global prefix)
  const http = app.getHttpAdapter() as any;
  if (http && typeof http.get === 'function') {
    http.get('/', (_req: any, res: any) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Hello Nestjs</title>
  <style>body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;display:grid;place-items:center;min-height:100vh;background:#f7f7fb;color:#1f1f1f} .card{background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.08);padding:24px 28px;text-align:center} h1{margin:0 0 8px;font-size:24px} p{margin:0;color:#666}</style>
  </head>
<body>
  <div class="card">
    <h1>Hello Nestjs</h1>
    <p>API base: <code>/api/v1</code></p>
  </div>
</body>
</html>`);
    });
  }
  const port = Number(process.env.PORT || 3001);
  await app.listen(port);

  // 获取当前服务器的 IP 地址
  function getLocalIPAddress(): Array<{ interface: string; address: string }> {
    const nets = networkInterfaces();
    const results: Array<{ interface: string; address: string }> = [];

    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        // 跳过内部地址（127.x.x.x）和非 IPv4 地址
        if (net.family === 'IPv4' && !net.internal) {
          results.push({ interface: name, address: net.address });
        }
      }
    }
    return results;
  }

  const ipAddresses = getLocalIPAddress();

  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);

  if (ipAddresses.length > 0) {
    // eslint-disable-next-line no-console
    console.log('Available IP addresses:');
    ipAddresses.forEach((ip) => {
      // eslint-disable-next-line no-console
      console.log(`  ${ip.interface}: http://${ip.address}:${port}`);
    });
  } else {
    // eslint-disable-next-line no-console
    console.log('No external IP addresses found');
  }
}

bootstrap();

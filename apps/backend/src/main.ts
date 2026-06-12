import 'reflect-metadata';

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

let DOCS_HTML: string;
try {
  DOCS_HTML = fs.readFileSync(path.join(__dirname, 'docs', 'index.html'), 'utf-8');
} catch {
  DOCS_HTML = '<html><body><h1>API Docs</h1><p>Dokumentasi tidak tersedia.</p></body></html>';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const corsOrigins = process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) ?? [];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) { callback(null, true); return; }
      const allowed =
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.endsWith('.replit.dev') ||
        origin.endsWith('.repl.co') ||
        origin.endsWith('.replit.app') ||
        origin.endsWith('.replit.com') ||
        /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
        /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
        /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/.test(origin) ||
        corsOrigins.includes(origin);
      if (allowed) { callback(null, true); }
      else { callback(new Error(`Origin ${origin} not allowed by CORS`)); }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const rateLimitWindow = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
  const rateLimitMax    = Number(process.env.RATE_LIMIT_MAX || 1000);
  const requestCounters = new Map<string, { count: number; windowStart: number }>();

  app.use((req: any, res: any, next: any) => {
    const forwarded = req.headers['x-forwarded-for']?.toString().split(',')[0].trim();
    const key = forwarded || req.ip || 'global';
    const now = Date.now();
    const counter = requestCounters.get(key);
    if (!counter || now - counter.windowStart > rateLimitWindow) {
      requestCounters.set(key, { count: 1, windowStart: now });
    } else {
      counter.count += 1;
      requestCounters.set(key, counter);
    }
    if ((requestCounters.get(key)?.count ?? 0) > rateLimitMax) {
      res.status(429).json({ message: 'Too many requests. Please try again later.' });
      return;
    }
    res.setHeader('X-Powered-By', 'ERP Modern Backend');
    next();
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/docs', (_req: any, res: any) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(DOCS_HTML);
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Gentong Mas ERP — API')
    .setDescription('REST API untuk sistem ERP Gentong Mas. Integrasi langsung dengan Kledo.')
    .setVersion('2.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addTag('auth',    'Autentikasi & otorisasi')
    .addTag('kledo',   'Integrasi Kledo — kontak, produk, invoice')
    .addTag('health',  'Health check')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs-swagger', app, document, {
    swaggerOptions: { persistAuthorization: true, docExpansion: 'none', filter: true },
    customSiteTitle: 'Gentong Mas ERP — Swagger UI',
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 6000;
  await app.listen(port, '0.0.0.0');
  console.log(`\n🚀  Backend running  →  http://0.0.0.0:${port}`);
  console.log(`🔑  Kledo token      →  ${process.env.KLEDO_TOKEN ? '✅ terbaca' : '❌ TIDAK TERBACA — set KLEDO_TOKEN di .env'}`);
  console.log(`📄  Swagger UI       →  http://0.0.0.0:${port}/docs-swagger\n`);
}

bootstrap();

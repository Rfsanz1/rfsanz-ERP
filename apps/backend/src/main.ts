import 'reflect-metadata';

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { NestExpressApplication } from '@nestjs/platform-express';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

let DOCS_HTML: string;
try {
  DOCS_HTML = fs.readFileSync(path.join(__dirname, 'docs', 'index.html'), 'utf-8');
} catch {
  DOCS_HTML = '<html><body><h1>API Docs</h1><p>Dokumentasi tidak tersedia.</p></body></html>';
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'int/v1/auth/login',         method: RequestMethod.POST },
      { path: 'int/v1/auth/session',        method: RequestMethod.GET },
      { path: 'int/v1/auth/logout',         method: RequestMethod.POST },
      { path: 'int/v1/auth/organizations',  method: RequestMethod.GET },
      { path: 'int/v1/users/me',            method: RequestMethod.GET },
      { path: 'int/v1/users/locale',        method: RequestMethod.GET },
      { path: 'int/v1/two-fa/check',        method: RequestMethod.GET },
    ],
  });

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
        origin.endsWith('.ngrok-free.app') ||
        origin.endsWith('.ngrok-free.dev') ||
        origin.endsWith('.ngrok.io') ||
        origin.endsWith('.my.id') ||
        origin === 'https://briskly-underpaid-shucking.ngrok-free.dev' ||
        origin === 'https://gentongmaselektronik.my.id' ||
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
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const uploadsPath = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
  app.useStaticAssets(uploadsPath, { prefix: '/uploads' });

  const driverUploadDir = process.env.UPLOAD_DIR ?? '/DATA/AppData/tms-driver/uploads';
  if (!fs.existsSync(driverUploadDir)) {
    try { fs.mkdirSync(driverUploadDir, { recursive: true }); } catch { /* skip if no permission */ }
  }
  if (fs.existsSync(driverUploadDir)) {
    app.useStaticAssets(driverUploadDir, { prefix: '/driver-uploads' });
  }

  if (!fs.existsSync('/tmp/driver-portal-uploads')) {
    fs.mkdirSync('/tmp/driver-portal-uploads', { recursive: true });
  }

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
      res.status(429).json({ data: null, error: 'Too many requests. Please try again later.' });
      return;
    }
    res.setHeader('X-Powered-By', 'ERP Modern Backend');
    next();
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/', (_req: any, res: any) => {
    res.redirect('/docs');
  });
  expressApp.get('/docs', (_req: any, res: any) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(DOCS_HTML);
  });
  expressApp.get('/docs-swagger', (_req: any, res: any) => {
    res.redirect('/docs#explorer');
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('RFSANZ ERP — API')
    .setDescription('REST API untuk sistem ERP RFSANZ. Integrasi langsung dengan Kledo & Open TMS.')
    .setVersion('2.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addTag('auth',      'Autentikasi & otorisasi')
    .addTag('kledo',     'Integrasi Kledo — kontak, produk, invoice')
    .addTag('health',    'Health check')
    .addTag('v1/auth',   'Open TMS — Auth')
    .addTag('v1/shipments', 'Open TMS — Shipments')
    .addTag('v1/carriers',  'Open TMS — Carriers')
    .addTag('v1/lanes',     'Open TMS — Lanes')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs-swagger', app, document, {
    swaggerOptions: { persistAuthorization: true, docExpansion: 'none', filter: true },
    customSiteTitle: 'RFSANZ ERP — Swagger UI',
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`\n🚀  Backend running  →  http://0.0.0.0:${port}`);
  console.log(`🔑  Kledo token      →  ${process.env.KLEDO_TOKEN ? '✅ terbaca' : '❌ TIDAK TERBACA — set KLEDO_TOKEN di .env'}`);
  console.log(`📄  Swagger UI       →  http://0.0.0.0:${port}/docs-swagger\n`);
}

bootstrap();

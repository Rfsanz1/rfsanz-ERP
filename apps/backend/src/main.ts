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

  // ── Halaman dokumentasi API bergaya Bagisto di /docs ──
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/docs', (_req: any, res: any) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(DOCS_HTML);
  });

  // ── Swagger: JSON spec di /docs-json, UI di /docs-swagger ──
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Gentong Mas ERP — API')
    .setDescription(
      'REST API untuk sistem ERP Gentong Mas. Mencakup modul: Auth, Sales, Inventory, Finance, HR, CRM, Fleet, Payroll, Tax, dan lainnya.',
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addTag('auth',          'Autentikasi & otorisasi')
    .addTag('dashboard',     'KPI & statistik dashboard')
    .addTag('sales',         'Manajemen penjualan & order')
    .addTag('inventory',     'Stok & gudang')
    .addTag('finance',       'Keuangan & akuntansi')
    .addTag('hr',            'Sumber daya manusia')
    .addTag('crm',           'CRM & relasi pelanggan')
    .addTag('purchasing',    'Pembelian & vendor')
    .addTag('fleet',         'Armada & pengiriman')
    .addTag('payroll',       'Penggajian karyawan')
    .addTag('tax',           'Perpajakan & e-Faktur')
    .addTag('assets',        'Aset tetap & penyusutan')
    .addTag('maintenance',   'Pemeliharaan peralatan')
    .addTag('manufacturing', 'Produksi & BOM')
    .addTag('project',       'Manajemen proyek')
    .addTag('pos',           'Point of Sale')
    .addTag('branch',        'Cabang & perusahaan')
    .addTag('users',         'Manajemen pengguna')
    .addTag('settings',      'Pengaturan sistem')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs-swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'Gentong Mas ERP — Swagger UI',
    customCss: `
      .swagger-ui .topbar { background: linear-gradient(135deg, #0041ff, #41d1ff); }
      .swagger-ui .topbar-wrapper img { display: none; }
      .swagger-ui .topbar-wrapper::before {
        content: '🏭 Gentong Mas ERP — API';
        color: white; font-size: 1.25rem; font-weight: 700; font-family: Inter, sans-serif;
      }
      .swagger-ui .info .title { color: #0041ff; }
    `,
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 6000;
  await app.listen(port);
  console.log(`Modern backend running on http://localhost:${port}`);
  console.log(`API Docs (Bagisto style): http://localhost:${port}/docs`);
  console.log(`Swagger UI:               http://localhost:${port}/docs-swagger`);
  console.log(`OpenAPI JSON:             http://localhost:${port}/docs-json`);
}

bootstrap();

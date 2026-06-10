import http from 'http';

const PORT = 5000;
const BACKEND_HOST = 'localhost';
const BACKEND_PORT = 6000;

const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Gentong Mas ERP</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .hero { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 48px 24px; text-align: center; border-bottom: 1px solid #334155; }
    .hero h1 { font-size: 2.5rem; font-weight: 700; background: linear-gradient(135deg, #7367F0, #CE9FFC); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
    .hero p { color: #94a3b8; font-size: 1.1rem; }
    .badge { display: inline-block; background: #22c55e20; color: #22c55e; border: 1px solid #22c55e40; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; margin-top: 12px; }
    .container { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }
    .section-title { font-size: 0.85rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-bottom: 40px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; transition: all 0.2s; }
    .card:hover { border-color: #7367F0; transform: translateY(-2px); }
    .card-icon { font-size: 1.5rem; margin-bottom: 10px; }
    .card h3 { font-size: 0.95rem; font-weight: 600; color: #e2e8f0; margin-bottom: 4px; }
    .card p { font-size: 0.8rem; color: #64748b; }
    .card .port { font-size: 0.7rem; color: #7367F0; font-weight: 600; margin-top: 8px; }
    .api-card { background: linear-gradient(135deg, #7367F015, #1e293b); border-color: #7367F030; }
    .status { display: flex; align-items: center; gap: 12px; background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: #22c55e; flex-shrink: 0; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .status-text { font-size: 0.875rem; color: #94a3b8; }
    .status-text strong { color: #22c55e; }
    .quick-links { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 40px; }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; text-decoration: none; transition: all 0.2s; }
    .btn-primary { background: linear-gradient(135deg, #7367F0, #9e95f5); color: white; }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-secondary { background: #1e293b; border: 1px solid #334155; color: #e2e8f0; }
    .btn-secondary:hover { border-color: #7367F0; color: #7367F0; }
    .modules-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; margin-bottom: 40px; }
    .module-badge { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 14px; font-size: 0.8rem; color: #94a3b8; }
    footer { text-align: center; padding: 24px; border-top: 1px solid #1e293b; color: #475569; font-size: 0.8rem; margin-top: 20px; }
    #health-status { font-size: 0.8rem; color: #64748b; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="hero">
    <h1>🏢 Gentong Mas ERP</h1>
    <p>Sistem ERP Multi-Aplikasi Modern · NestJS + Prisma + PostgreSQL</p>
    <span class="badge" id="backend-badge">⏳ Mengecek status backend...</span>
  </div>

  <div class="container">
    <div class="status">
      <div class="dot" id="status-dot" style="background:#f59e0b"></div>
      <div>
        <div class="status-text"><strong id="status-label">Mengecek backend...</strong> <span id="health-status"></span></div>
        <div style="font-size:0.75rem;color:#475569;margin-top:2px">Backend API · Port 6000 · PostgreSQL Database</div>
      </div>
    </div>

    <div class="quick-links">
      <a href="/docs" class="btn btn-primary" target="_top">📖 Buka Swagger API Docs</a>
      <a href="/api/health" class="btn btn-secondary" target="_blank">🩺 Health Check</a>
    </div>

    <p class="section-title">Aplikasi Frontend (Per Role)</p>
    <div class="grid">
      <div class="card api-card">
        <div class="card-icon">🌐</div>
        <h3>Web Admin Dashboard</h3>
        <p>Manajemen utama. Role: Admin, Owner</p>
        <div class="port">apps/frontend · Port 5000</div>
      </div>
      <div class="card">
        <div class="card-icon">📊</div>
        <h3>Sales App</h3>
        <p>Buat SO, pantau pipeline, customer</p>
        <div class="port">apps/sales-app · Port 3002</div>
      </div>
      <div class="card">
        <div class="card-icon">📦</div>
        <h3>Gudang App</h3>
        <p>Inbound PO, outbound picking, stok opname</p>
        <div class="port">apps/gudang-app · Port 3003</div>
      </div>
      <div class="card">
        <div class="card-icon">🏪</div>
        <h3>POS App</h3>
        <p>Kasir POS, sesi kasir, laporan harian</p>
        <div class="port">apps/pos-app · Port 3001</div>
      </div>
      <div class="card">
        <div class="card-icon">🚚</div>
        <h3>Driver App</h3>
        <p>Delivery tasks, update status, riwayat</p>
        <div class="port">apps/driver-app · Port 3000</div>
      </div>
      <div class="card">
        <div class="card-icon">⚙️</div>
        <h3>Backend API</h3>
        <p>NestJS + Prisma + PostgreSQL ERP</p>
        <div class="port">apps/backend · Port 6000</div>
      </div>
    </div>

    <p class="section-title">Modul API (${16} Modul Aktif)</p>
    <div class="modules-grid">
      ${['Auth & Users','Sales & Orders','Inventory','Finance','HR','CRM','Purchasing','Fleet','Payroll','Tax & e-Faktur','POS','Aset Tetap','Manufaktur','Proyek','Helpdesk','Rekrutmen'].map(m => `<div class="module-badge">✓ ${m}</div>`).join('')}
    </div>
  </div>

  <footer>Gentong Mas ERP · Backend aktif di port <strong>6000</strong> · Swagger docs: <a href="/docs" style="color:#7367F0">/docs</a></footer>

  <script>
    fetch('/api/health')
      .then(r => r.json())
      .then(d => {
        document.getElementById('status-dot').style.background = '#22c55e';
        document.getElementById('status-label').textContent = 'Backend Aktif';
        document.getElementById('status-label').style.color = '#22c55e';
        document.getElementById('health-status').textContent = '· ' + JSON.stringify(d);
        document.getElementById('backend-badge').textContent = '✅ Backend Online';
        document.getElementById('backend-badge').style.background = '#22c55e20';
      })
      .catch(() => {
        document.getElementById('status-dot').style.background = '#f59e0b';
        document.getElementById('status-label').textContent = 'Backend sedang memulai...';
        document.getElementById('backend-badge').textContent = '⏳ Starting...';
        setTimeout(() => location.reload(), 3000);
      });
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const url = req.url || '/';

  // Serve dashboard at root
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    res.end(html);
    return;
  }

  // Proxy all other requests to backend (API + Swagger docs)
  const options = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: url,
    method: req.method,
    headers: { ...req.headers, host: `${BACKEND_HOST}:${BACKEND_PORT}` },
  };

  const proxy = http.request(options, (backendRes) => {
    res.writeHead(backendRes.statusCode || 200, backendRes.headers);
    backendRes.pipe(res, { end: true });
  });

  proxy.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Backend belum siap. Tunggu sebentar...' }));
  });

  req.pipe(proxy, { end: true });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Gentong Mas ERP Portal running at http://localhost:${PORT}`);
  console.log(`Proxying API requests to http://${BACKEND_HOST}:${BACKEND_PORT}`);
});

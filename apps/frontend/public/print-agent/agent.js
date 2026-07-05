#!/usr/bin/env node
/**
 * Gentong Mas ERP — Print Agent
 * Jalankan di VM Linux Mint untuk menerima print job dari ERP.
 *
 * Install & jalankan:
 *   node agent.js
 *
 * Atau sebagai service (auto-start):
 *   sudo node install-service.js
 */

const http = require('http');
const { exec, execSync } = require('child_process');
const os   = require('os');

const PORT = process.env.AGENT_PORT || 6631;

// ── Daftar printer (sesuaikan jika perlu) ──────────────────────────────────
const PRINTERS = {
  'EPSON_LX-310':      'EPSON_LX-310',
  'EPSON_L1250_Series':'EPSON_L1250_Series',
};

// ── Helper: baca body JSON ─────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; if (data.length > 5_000_000) reject(new Error('Body terlalu besar')); });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { reject(new Error('Body bukan JSON valid')); }
    });
    req.on('error', reject);
  });
}

// ── Helper: kirim response JSON ────────────────────────────────────────────
function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type':                'application/json',
    'Content-Length':              Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
  });
  res.end(payload);
}

// ── Cek apakah printer tersedia di CUPS ───────────────────────────────────
function printerExists(name) {
  try {
    const out = execSync('lpstat -p 2>/dev/null || true').toString();
    return out.includes(name);
  } catch { return false; }
}

// ── Kirim print job via `lp` ──────────────────────────────────────────────
function printHtml(printerName, html, title, callback) {
  const fs    = require('fs');
  const path  = require('path');
  const tmpFile = path.join(os.tmpdir(), `erp_print_${Date.now()}.html`);

  const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>${(title || 'ERP Print').replace(/</g, '&lt;')}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size: 11pt; }
  @page { margin: 10mm; }
</style>
</head>
<body>${html}</body>
</html>`;

  fs.writeFile(tmpFile, fullHtml, 'utf8', err => {
    if (err) return callback(err);

    // Coba cetak dengan chromium-browser (headless) atau wkhtmltopdf
    // Fallback: langsung lp sebagai text/html
    const chromiumBins = [
      'chromium-browser', 'chromium', 'google-chrome', 'google-chrome-stable'
    ];

    let chromiumPath = null;
    for (const bin of chromiumBins) {
      try {
        execSync(`which ${bin} 2>/dev/null`);
        chromiumPath = bin;
        break;
      } catch { /* tidak ada */ }
    }

    if (chromiumPath) {
      // Chromium headless → PDF → lp
      const pdfFile = tmpFile.replace('.html', '.pdf');
      const chromiumCmd = `${chromiumPath} --headless --disable-gpu --no-sandbox --print-to-pdf="${pdfFile}" "file://${tmpFile}" 2>/dev/null`;
      exec(chromiumCmd, (errChrome) => {
        if (errChrome) {
          // Fallback ke lp langsung
          sendViaLp(tmpFile, printerName, 'text/html', title, callback, tmpFile);
        } else {
          sendViaLp(pdfFile, printerName, 'application/pdf', title, callback, tmpFile, pdfFile);
        }
      });
    } else {
      // Tidak ada chromium, kirim HTML langsung
      sendViaLp(tmpFile, printerName, 'text/html', title, callback, tmpFile);
    }
  });
}

function sendViaLp(file, printer, mime, title, callback, ...cleanupFiles) {
  const safeTitle   = (title || 'ERP').replace(/[^a-zA-Z0-9\-_. ]/g, '_');
  const safePrinter = printer.replace(/[^a-zA-Z0-9\-_.]/g, '_');
  const cmd = `lp -d "${safePrinter}" -t "${safeTitle}" -o media=A4 -o fit-to-page "${file}"`;

  exec(cmd, (err, stdout, stderr) => {
    const fs = require('fs');
    cleanupFiles.forEach(f => { try { fs.unlinkSync(f); } catch {} });

    if (err) {
      callback(new Error(`lp gagal: ${stderr || err.message}`));
    } else {
      callback(null, stdout.trim() || `Print job dikirim ke ${printer}`);
    }
  });
}

// ── HTTP Server ────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  const url = req.url || '/';

  // GET /status — cek status agent
  if (req.method === 'GET' && url === '/status') {
    let printers = [];
    try {
      const out = execSync('lpstat -p 2>/dev/null || lpstat -a 2>/dev/null || echo "no-cups"').toString();
      printers = out.split('\n')
        .filter(l => l.startsWith('printer ') || l.match(/^\S+ accepting/))
        .map(l => l.split(' ')[1])
        .filter(Boolean);
    } catch {}

    return json(res, 200, {
      ok:       true,
      version:  '1.0.0',
      hostname: os.hostname(),
      printers,
      message:  'Gentong Mas Print Agent aktif',
    });
  }

  // POST /print — terima print job
  if (req.method === 'POST' && url === '/print') {
    readBody(req)
      .then(body => {
        const { printer, html, title } = body;
        if (!printer || !html) throw new Error('printer dan html harus diisi');

        console.log(`[${new Date().toISOString()}] Print job diterima → printer: ${printer}, judul: ${title || '-'}`);

        printHtml(printer, html, title, (err, msg) => {
          if (err) {
            console.error(`[ERROR] ${err.message}`);
            return json(res, 500, { error: err.message });
          }
          console.log(`[OK] ${msg}`);
          json(res, 200, { ok: true, message: msg, printer });
        });
      })
      .catch(err => {
        console.error(`[ERROR] ${err.message}`);
        json(res, 400, { error: err.message });
      });
    return;
  }

  // GET / — halaman info
  if (req.method === 'GET' && (url === '/' || url === '')) {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(`Gentong Mas Print Agent v1.0.0
=====================================
Endpoint:
  GET  /status  — cek status
  POST /print   — kirim print job

Agent berjalan di port ${PORT}
`);
  }

  json(res, 404, { error: 'Endpoint tidak ditemukan' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════╗
║   Gentong Mas ERP — Print Agent v1.0.0  ║
╚══════════════════════════════════════════╝
✅  Agent berjalan di http://0.0.0.0:${PORT}
🖨️  Endpoint: POST http://IP-VM:${PORT}/print
📡  Status:   GET  http://IP-VM:${PORT}/status

Tekan Ctrl+C untuk berhenti.
`);
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} sudah dipakai. Ganti dengan: AGENT_PORT=6632 node agent.js`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

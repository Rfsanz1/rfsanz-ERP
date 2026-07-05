#!/usr/bin/env node
'use strict';

/**
 * Gentong Mas ERP — Print Agent v1.1
 * Jalankan di VM Linux Mint:  node agent.js
 * Install sebagai service:    sudo bash install-service.sh
 */

var http       = require('http');
var exec       = require('child_process').exec;
var execSync   = require('child_process').execSync;
var os         = require('os');
var fs         = require('fs');
var path       = require('path');

var PORT = Number(process.env.AGENT_PORT) || 6631;
var TMP  = os.tmpdir();

// ── Cek Node.js versi minimum ─────────────────────────────────────────────
var nodeVer = process.versions.node.split('.').map(Number);
if (nodeVer[0] < 12) {
  console.error('ERROR: Node.js minimal versi 12. Jalankan: sudo apt install nodejs');
  process.exit(1);
}

// ── Helper ────────────────────────────────────────────────────────────────
function readBody(req, cb) {
  var chunks = [];
  req.on('data', function(c) { chunks.push(c); });
  req.on('end',  function()  {
    try { cb(null, JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
    catch(e) { cb(new Error('Body bukan JSON valid')); }
  });
  req.on('error', cb);
}

function sendJson(res, status, obj) {
  var body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type':                'application/json',
    'Content-Length':              Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function getPrinterList() {
  try {
    var out = execSync('lpstat -p 2>/dev/null', { timeout: 3000 }).toString();
    var list = [];
    out.split('\n').forEach(function(line) {
      var m = line.match(/^printer\s+(\S+)/);
      if (m) list.push(m[1]);
    });
    return list;
  } catch(e) {
    return [];
  }
}

// ── Kirim print via lp ────────────────────────────────────────────────────
function doPrint(printer, html, title, cb) {
  var safeName  = (title || 'ERP').replace(/[^a-zA-Z0-9\-_. ]/g, '_');
  var safePrint = printer.replace(/[^a-zA-Z0-9\-_.]/g, '_');
  var tmpFile   = path.join(TMP, 'gm_print_' + Date.now() + '.html');

  var fullHtml = '<!DOCTYPE html>\n'
    + '<html lang="id"><head><meta charset="UTF-8"><title>' + safeName + '</title>'
    + '<style>* {margin:0;padding:0;box-sizing:border-box;} body{font-family:Arial,sans-serif;font-size:11pt;} @page{margin:10mm;}</style>'
    + '</head><body>' + html + '</body></html>';

  fs.writeFile(tmpFile, fullHtml, 'utf8', function(err) {
    if (err) return cb(err);

    var cmd = 'lp -d "' + safePrint + '" -t "' + safeName + '" -o media=A4 "' + tmpFile + '"';

    exec(cmd, { timeout: 15000 }, function(err2, stdout, stderr) {
      fs.unlink(tmpFile, function() {}); // hapus file tmp

      if (err2) {
        var msg = stderr || err2.message || 'lp gagal';
        return cb(new Error(msg));
      }
      cb(null, stdout.trim() || 'Job print dikirim ke ' + printer);
    });
  });
}

// ── HTTP Server ───────────────────────────────────────────────────────────
var server = http.createServer(function(req, res) {
  var url    = req.url || '/';
  var method = req.method || 'GET';

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // GET /status
  if (method === 'GET' && url === '/status') {
    var printers = getPrinterList();
    return sendJson(res, 200, {
      ok:       true,
      version:  '1.1.0',
      hostname: os.hostname(),
      printers: printers,
      message:  'Gentong Mas Print Agent aktif',
    });
  }

  // POST /print
  if (method === 'POST' && url === '/print') {
    return readBody(req, function(err, body) {
      if (err) return sendJson(res, 400, { error: err.message });

      var printer = body.printer;
      var html    = body.html;
      var title   = body.title || 'ERP Print';

      if (!printer || !html) {
        return sendJson(res, 400, { error: 'printer dan html harus diisi' });
      }

      console.log('[' + new Date().toISOString() + '] Print → ' + printer + ' | ' + title);

      doPrint(printer, html, title, function(err2, msg) {
        if (err2) {
          console.error('[ERROR] ' + err2.message);
          return sendJson(res, 500, { error: err2.message });
        }
        console.log('[OK] ' + msg);
        sendJson(res, 200, { ok: true, message: msg, printer: printer });
      });
    });
  }

  // GET /
  if (method === 'GET' && (url === '/' || url === '')) {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Gentong Mas Print Agent v1.1\nEndpoints:\n  GET  /status\n  POST /print\n');
  }

  sendJson(res, 404, { error: 'Endpoint tidak ditemukan' });
});

server.on('error', function(err) {
  if (err.code === 'EADDRINUSE') {
    console.error('ERROR: Port ' + PORT + ' sudah dipakai. Coba: AGENT_PORT=6632 node agent.js');
  } else {
    console.error('ERROR:', err.message);
  }
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', function() {
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  Gentong Mas ERP - Print Agent v1.1       ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('✅  Jalan di http://0.0.0.0:' + PORT);
  console.log('🖨️  Printer tersedia: ' + (getPrinterList().join(', ') || '(belum ada - tambahkan di CUPS)'));
  console.log('');
  console.log('Tekan Ctrl+C untuk berhenti.');
  console.log('');
});

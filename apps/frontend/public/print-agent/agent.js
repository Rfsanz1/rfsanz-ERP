'use strict';
var http = require('http');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var os = require('os');
var fs = require('fs');
var path = require('path');
var PORT = Number(process.env.AGENT_PORT) || 6631;

function readBody(req, cb) {
  var chunks = [];
  req.on('data', function(c) { chunks.push(c); });
  req.on('end', function() {
    try { cb(null, JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
    catch(e) { cb(new Error('Body bukan JSON')); }
  });
  req.on('error', cb);
}

function sendJson(res, status, obj) {
  var body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*'
  });
  res.end(body);
}

function getPrinters() {
  try {
    return execSync('lpstat -p 2>/dev/null', { timeout: 3000 }).toString()
      .split('\n')
      .map(function(l) { var m = l.match(/^printer\s+(\S+)/); return m ? m[1] : null; })
      .filter(Boolean);
  } catch(e) { return []; }
}

function doPrint(printer, html, title, cb) {
  var safe = (title || 'ERP').replace(/[^a-zA-Z0-9\- _.]/g, '_');
  var pr   = printer.replace(/[^a-zA-Z0-9\-_.]/g, '_');
  var tmp  = path.join(os.tmpdir(), 'gm_' + Date.now() + '.html');
  var content = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + safe + '</title>'
    + '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11pt}@page{margin:10mm}</style>'
    + '</head><body>' + html + '</body></html>';
  fs.writeFile(tmp, content, 'utf8', function(err) {
    if (err) return cb(err);
    exec('lp -d "' + pr + '" -t "' + safe + '" "' + tmp + '"', { timeout: 15000 }, function(e, out, err2) {
      fs.unlink(tmp, function() {});
      if (e) return cb(new Error(err2 || e.message));
      cb(null, out.trim() || 'Job dikirim ke ' + printer);
    });
  });
}

var server = http.createServer(function(req, res) {
  var url = req.url || '/';
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }
  if (req.method === 'GET' && url === '/status') {
    return sendJson(res, 200, { ok: true, version: '1.3', hostname: os.hostname(), printers: getPrinters(), message: 'Print Agent aktif' });
  }
  if (req.method === 'POST' && url === '/print') {
    return readBody(req, function(err, body) {
      if (err) return sendJson(res, 400, { error: err.message });
      if (!body.printer || !body.html) return sendJson(res, 400, { error: 'printer dan html harus diisi' });
      console.log('[PRINT] ' + body.printer + ' | ' + (body.title || '-'));
      doPrint(body.printer, body.html, body.title || 'ERP', function(e, msg) {
        if (e) { console.error('[ERROR]', e.message); return sendJson(res, 500, { error: e.message }); }
        console.log('[OK]', msg);
        sendJson(res, 200, { ok: true, message: msg, printer: body.printer });
      });
    });
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Gentong Mas Print Agent v1.3\nGET /status  POST /print\n');
});

server.on('error', function(e) {
  if (e.code === 'EADDRINUSE') console.error('Port ' + PORT + ' sudah dipakai');
  else console.error('Error:', e.message);
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', function() {
  console.log('[GM Print Agent v1.3] port=' + PORT + ' printers=' + getPrinters().join(','));
});

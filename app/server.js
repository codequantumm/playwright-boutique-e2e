// Serveur de démonstration : sert la boutique et expose une petite API.
// Aucune dépendance : uniquement des modules Node.js.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const Pricing = require('./public/pricing.js');
const products = require('./products.json');

const PORT = Number(process.env.PORT) || 4173;
const PUBLIC_DIR = path.join(__dirname, 'public');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': TYPES['.json'], 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) { req.destroy(); reject(new Error('Corps trop volumineux')); }
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (error) { reject(error); }
    });
    req.on('error', reject);
  });
}

function validateOrder(body) {
  const errors = {};
  if (!body.fullName || String(body.fullName).trim().length < 2) errors.fullName = 'Le nom est obligatoire.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(body.email || ''))) errors.email = 'Veuillez saisir une adresse e-mail valide.';
  if (!body.address || String(body.address).trim().length < 5) errors.address = "L'adresse de livraison est obligatoire.";

  const items = Array.isArray(body.items) ? body.items : [];
  const lines = [];
  if (items.length === 0) errors.items = 'Le panier est vide.';
  for (const item of items) {
    const product = products.find((p) => p.id === item.id);
    const quantity = Number(item.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      errors.items = 'Article ou quantité invalide.';
      break;
    }
    lines.push({ priceEur: product.price, quantity });
  }
  return { errors, lines };
}

async function handleApi(req, res, pathname) {
  if (pathname === '/api/products' && req.method === 'GET') return sendJson(res, 200, products);

  if (pathname === '/api/orders' && req.method === 'POST') {
    let body;
    try { body = await readJson(req); } catch { return sendJson(res, 400, { errors: { body: 'JSON invalide.' } }); }
    const { errors, lines } = validateOrder(body);
    if (Object.keys(errors).length > 0) return sendJson(res, 400, { errors });
    // Le total est toujours recalculé côté serveur : on ne fait jamais confiance au client.
    const totals = Pricing.computeTotals(lines, body.promoCode, body.currency);
    const orderId = 'CMD-' + String(Math.floor(100000 + Math.random() * 900000));
    return sendJson(res, 201, { orderId, total: totals.total, currency: totals.currency });
  }
  return sendJson(res, 404, { error: 'Route inconnue' });
}

function serveStatic(res, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, requested));
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Interdit'); }
  fs.readFile(filePath, (error, content) => {
    if (error) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Introuvable'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  if (pathname.startsWith('/api/')) return handleApi(req, res, pathname);
  return serveStatic(res, pathname);
});

server.listen(PORT, () => console.log(`Boutique de démonstration : http://localhost:${PORT}`));

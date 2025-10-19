const http = require('http');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const distDir = path.join(root, 'dist');

const mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

function serveFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = mime[ext] || 'text/plain';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let pathname = url.pathname;

  pathname = path.posix.normalize(pathname);
  if (pathname.startsWith('..')) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Try to serve from dist; default to dist/index.html
  if (pathname === '/' || pathname === '/index.html') {
    const entry = path.join(distDir, 'index.html');
    serveFile(entry, res);
    return;
  }

  const requested = pathname.replace(/^\//, '');
  const filePath = path.join(distDir, requested);

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      serveFile(filePath, res);
    } else {
      serveFile(path.join(distDir, 'index.html'), res);
    }
  });
});

const port = process.env.PORT || 8000;
server.listen(port, () => {
  console.log(`Preview available at http://localhost:${port}/`);
});
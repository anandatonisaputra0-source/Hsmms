const http = require('http');

// ── Simpan data minimap terakhir di memory ────────────────────────────────────
let latestData = null;
let lastUpdate = 0;

const server = http.createServer((req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // ── APK Utama kirim data ──────────────────────────────────────────────────
    if (req.method === 'POST' && req.url === '/push') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                latestData = JSON.parse(body);
                lastUpdate = Date.now();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true }));
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // ── APK Support poll data ─────────────────────────────────────────────────
    if (req.method === 'GET' && req.url === '/pull') {
        if (!latestData || Date.now() - lastUpdate > 10000) {
            res.writeHead(204); // No Content — tidak ada data / expired
            res.end();
            return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(latestData));
        return;
    }

    // ── Status / health check ─────────────────────────────────────────────────
    if (req.method === 'GET' && req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            ok: true,
            hasData: latestData !== null,
            lastUpdate: lastUpdate,
            age: lastUpdate > 0 ? Date.now() - lastUpdate : null
        }));
        return;
    }

    res.writeHead(404);
    res.end('Not found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Minimap server running on port ${PORT}`);
});

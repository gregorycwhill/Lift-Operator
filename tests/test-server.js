const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 5500);
const host = process.env.HOST || '127.0.0.1';

const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8'
};

function resolveRequestPath(requestUrl) {
    const pathname = decodeURIComponent(new URL(requestUrl, `http://${host}:${port}`).pathname);
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filePath = path.resolve(root, relativePath);
    return filePath === root || filePath.startsWith(root + path.sep) ? filePath : null;
}

function createTestServer() {
    return http.createServer((request, response) => {
        const filePath = resolveRequestPath(request.url);
        if (!filePath) {
            response.writeHead(403);
            response.end('Forbidden');
            return;
        }

        fs.stat(filePath, (statError, stats) => {
            const resolvedPath = !statError && stats.isDirectory()
                ? path.join(filePath, 'index.html')
                : filePath;

            fs.readFile(resolvedPath, (readError, data) => {
                if (readError) {
                    response.writeHead(readError.code === 'ENOENT' ? 404 : 500);
                    response.end(readError.code === 'ENOENT' ? 'Not found' : 'Server error');
                    return;
                }

                const extension = path.extname(resolvedPath).toLowerCase();
                response.writeHead(200, {
                    'Content-Type': contentTypes[extension] || 'application/octet-stream',
                    'Cache-Control': 'no-store'
                });
                response.end(data);
            });
        });
    });
}

function startTestServer() {
    const server = createTestServer();
    return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => {
            server.removeListener('error', reject);
            resolve(server);
        });
    });
}

module.exports = { createTestServer, startTestServer };

if (require.main === module) {
    startTestServer().then(() => {
        console.log(`Lift Operator test server: http://${host}:${port}`);
    }).catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
}

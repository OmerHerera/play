import { createServer } from 'node:http';
import { createServer as createSecureServer } from 'node:https';
import { resolve, dirname } from 'node:path';
import { existsSync, createReadStream, readFileSync } from 'node:fs';
import { fileURLToPath } from 'url';

const PORT = process.env.PORT || 3000;
const SECURE_PORT = 8443;
const hostname = '127.0.0.1';
// const options = {
//   key: readFileSync('./certs/key.pem'),
//   cert: readFileSync('./certs/cert.pem')
// };
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const server = createServer(serverHandler);
// const secureServer = createSecureServer(options, serverHandler);
const policies = {
  //configure Content Security Policy (CSP) directives to allow script execution from certain domains while blocking the use of eval()
  'block_eval': "script-src 'self' https://harmony.com:8080; script-src-elem 'self' https://harmony.com:8080; script-src-attr 'self' https://harmony.com:8080 'unsafe-inline'; object-src 'none'; style-src 'self' 'unsafe-inline'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; block-all-mixed-content; upgrade-insecure-requests; default-src 'none'; manifest-src 'self'; font-src 'self'; connect-src 'self'",
  'allow_same_origin': "default-src 'self' 'unsafe-eval'",
  'allow_same_origin_blocking_eval': "script-src 'self'; script-src-elem 'self'; script-src-attr 'self' 'unsafe-inline'; object-src 'none'; style-src 'self' 'unsafe-inline'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; block-all-mixed-content; upgrade-insecure-requests; default-src 'none'; manifest-src 'self'; font-src 'self'; connect-src 'self'",
  'allow_other_origin': "script-src-elem https://harmony.com:8080",
};

function serverHandler(req, res) {
  if (req.method === 'GET' && req.url.startsWith('/')) {
    if (req.url === '/' || req.url.includes('policy=') || req.url.includes('file=')) {
      // Extracting query parameters
      const url = new URL(req.url, `http://${req.headers.host}`);
      const queryParams = new URLSearchParams(url.search);
      const policyFromQuery = queryParams.get('policy');
      const fileNameFromQuery = queryParams.get('file') || 'allow_same_origin';
      const policy = policyFromQuery ? policies[policyFromQuery] : '';

      let filePath = resolve(__dirname, `public/${fileNameFromQuery}.html`);
      let fileExists = existsSync(filePath);
      if (!fileExists) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html');
        res.end(`
        <html>
          <body>
            <h3>Page not found</h3>
          </body>
        </html>`);
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        policy && res.setHeader('Content-Security-Policy', policy);
        createReadStream(filePath).pipe(res);
      }
    }
    else if (req.url === '/script.js') {
      let filePath = resolve(__dirname, 'public/script.js');
      res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      createReadStream(filePath).pipe(res);
    }
    else if (req.url === '/favicon.ico') {
      // If the request is for favicon.ico, send a 204 No Content response
      res.statusCode = 204;
      res.end();
    }
  }
}

server.listen(PORT, hostname, () => {
  console.log(`Server running at ${hostname}:${PORT}`);   
});

// secureServer.listen(SECURE_PORT, hostname, () => {
//   console.log(`Server running at ${hostname}:${SECURE_PORT}`);   
// });

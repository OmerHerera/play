import { createServer } from 'node:http';
import { createServer as createSecureServer } from 'node:https';
import { resolve, dirname } from 'node:path';
import { existsSync, createReadStream, readFileSync } from 'node:fs';
import { fileURLToPath } from 'url';

const PORT = process.env.PORT || 3000;
const SECURE_PORT = 8443;
const hostname = '127.0.0.1';
const options = {
  key: readFileSync('./certs/key.pem'),
  cert: readFileSync('./certs/cert.pem')
};
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const server = createServer(serverHandler);
const secureServer = createSecureServer(options, serverHandler);
const policies = {
  //configure Content Security Policy (CSP) directives to allow script execution from certain domains while blocking the use of eval()
  'block_eval': "script-src 'self' {{allowDomain}}; script-src-elem 'self' {{allowDomain}}; script-src-attr 'self' {{allowDomain}} 'unsafe-inline'; object-src 'none'; style-src 'self' 'unsafe-inline'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; block-all-mixed-content; upgrade-insecure-requests; default-src 'none'; manifest-src 'self'; font-src 'self'; connect-src 'self'",
  'allow_same_origin': "default-src 'self' 'unsafe-eval'",
  'allow_same_origin_blocking_eval': "script-src 'self'; script-src-elem 'self'; script-src-attr 'self' 'unsafe-inline'; object-src 'none'; style-src 'self' 'unsafe-inline'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; block-all-mixed-content; upgrade-insecure-requests; default-src 'none'; manifest-src 'self'; font-src 'self'; connect-src 'self'",
  'allow_other_origin': "script-src-elem {{allowDomain}}",
};
function getDomainFromPath(script) {
  // const url = 'https://omerherera.github.io/cdn/src/script.js';
  const regex = /^(https?:\/\/[^/]+)(?:\/|$)/;
  const match = script.match(regex);
  const path = match ? match[1] : null;
  return path; // Output: https://omerherera.github.io
}
function getPolicy(policyFromQuery, domainAllow) {
  // if no policy passed on the request allow all
  const policy = (policyFromQuery && policies[policyFromQuery]) ?
    policies[policyFromQuery].replaceAll('{{allowDomain}}', domainAllow) :
    '';
  return policy;
}

function serverHandler(req, res) {
  if (req.method === 'GET' && req.url.startsWith('/')) {
    if (req.url === '/' || req.url.includes('policy=') || req.url.includes('script=')) {
      // Extracting query parameters
      const url = new URL(req.url, `http://${req.headers.host}`);
      const queryParams = new URLSearchParams(url.search);
      const policyFromQuery = queryParams.get('policy');
      const scriptPathFromQuery = queryParams.get('script') || 'https://dy.omer.com:8443/script.js';
      const domainAllow = getDomainFromPath(scriptPathFromQuery);
      const policy = getPolicy(policyFromQuery, domainAllow);

      let filePath = resolve(__dirname, 'public/index.html');
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
        // Read the HTML file
        const fileStream = createReadStream(filePath);
        
        // Placeholder replacements
        let htmlContent = '';
        fileStream.on('data', chunk => {
            htmlContent += chunk.toString();
        });

        fileStream.on('end', () => {
            // Perform placeholder replacements
            htmlContent = htmlContent.replace('{{placeholder}}', scriptPathFromQuery);
            
            // Set response headers
          res.statusCode = 200;
          console.log('policy', { policy })
            res.setHeader('Content-Type', 'text/html');
            policy && res.setHeader('Content-Security-Policy', policy);
            
            // Send the modified HTML content as the response
            res.end(htmlContent);
        });

        fileStream.on('error', (err) => {
            res.end(err);
        });
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

secureServer.listen(SECURE_PORT, hostname, () => {
  console.log(`Server running at ${hostname}:${SECURE_PORT}`);   
});

import { createServer } from 'node:http';
import { createServer as createSecureServer } from 'node:https';
import { resolve, dirname } from 'node:path';
import { existsSync, createReadStream, readFileSync } from 'node:fs';
import { fileURLToPath } from 'url';
import { getDomainFromPath, getPolicy } from './functions.mjs'

const PORT = process.env.PORT || 3000;
const SECURE_PORT = process.env.SECURE_PORT || 8443;
const hostname = '127.0.0.1';
const options = {
  key: readFileSync('./certs/key.pem'),
  cert: readFileSync('./certs/cert.pem')
};
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const server = createServer(serverHandler);
const secureServer = createSecureServer(options, serverHandler);



function serverHandler(req, res) {
  if (req.method === 'GET' && req.url.startsWith('/')) {
      // ^ asserts the start of the string.
      // \/$ matches exactly one forward slash (/) at the end of the string. The backslash \ is used to escape the forward slash /, and $ asserts the end of the string. Together, \/$ matches only the root path /.
      // | is the alternation operator, meaning "or."
      // policy= matches the string "policy=" anywhere in the URL.
      // script= matches the string "script=" anywhere in the URL.
    if (/^\/$|policy=|script=/.test(req.url)) {
      // Extracting query parameters
      const url = new URL(req.url, `http://${req.headers.host}`);
      const queryParams = new URLSearchParams(url.search);
      const policyFromQuery = queryParams.get('policy');
      const scriptPathFromQuery = queryParams.get('script') || '/script.js';
      const domainAllow = getDomainFromPath(scriptPathFromQuery);
      const policy = getPolicy(policyFromQuery, domainAllow);

      let filePath = resolve(__dirname, './../public/index.html');
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
          res.setHeader('Content-Type', 'text/html');
          policy && res.setHeader('Content-Security-Policy', policy);
          // ************************************************************************************************************************
          // Set a cookie with name 'myCookie' and value 'cookieValue'
          // The HttpOnly attribute is a flag that can be set on an HTTP cookie.
          // When this attribute is set, the cookie cannot be accessed via JavaScript.
          // It is only sent to the server with HTTP requests and is not accessible through client - side scripts(such as JavaScript).
          // res.setHeader('Set-Cookie', 'myCookie=cookieValue; HttpOnly');
          // ************************************************************************************************************************
          res.setHeader('Set-Cookie', 'myCookie=cookieValue;');
          // You can also set additional cookie attributes like expiry and path
          // Example:
          // res.setHeader('Set-Cookie', 'myCookie=cookieValue; Max-Age=3600; Path=/; HttpOnly');
          // ************************************************************************************************************************
          // To allow sharing cookies across different subdomains or domains, you can set the cookie with a Domain attribute.
          /// With the Domain attribute set to ".domain.com", the cookie will be accessible to scripts running on all subdomains of "domain.com", including "another.domain.com". 
          // For example:
          // res.setHeader('Set-Cookie', 'myCookie=cookieValue; Domain=.domain.com; Path=/');
          // ************************************************************************************************************************


     
            
          // Send the modified HTML content as the response
          res.end(htmlContent);
        });

        fileStream.on('error', (err) => {
            res.end(err);
        });
      }
    }
    else if (req.url === '/script.js') {
      let filePath = resolve(__dirname, './../public/script.js');
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

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {options} from './options.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const {port, base, host, preview} = options();
const publicRoot = preview ? path.join(root, 'dist') : root;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.ico':'image/x-icon','.ttf':'font/ttf','.woff':'font/woff','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
let vite;
function fail(res, status, message) {res.writeHead(status, {'Content-Type':'text/plain; charset=utf-8'}); res.end(message);}
const server = http.createServer(async (req, res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) {res.setHeader('Allow','GET, HEAD'); return fail(res,405,'Method not allowed');}
    const url = new URL(req.url, 'http://local');
    const pathname = decodeURIComponent(url.pathname);
    if (base !== '/' && pathname === base.slice(0,-1)) {res.writeHead(308,{Location:base+url.search}).end();return;}
    if (!pathname.startsWith(base)) return fail(res,404,'Not found');
    const local = pathname.slice(base.length);
    if (local.includes('\\') || local.split('/').some(part => part === '..')) return fail(res,403,'Forbidden');
    if (['dentistry','dojo-media'].includes(local)) {res.writeHead(308,{Location:base+local+'/'+url.search}).end();return;}
    if (vite && local.startsWith('dojo-media/')) return vite.middlewares(req,res,() => fail(res,404,'Not found'));
    if (local.split('/').some(part => part.startsWith('.'))) return fail(res,403,'Forbidden');
    // Expose only website files, never source configuration or local reports.
    const allowed = local === '' || local === 'index.html' || local === 'dentistry/' || local === 'gallery.css' || local.startsWith('gallery-assets/') ||
      /^dentistry\/(?:index\.html|[a-z-]+\.(?:css|js)|assets\/[^/]+)$/.test(local) ||
      (preview && local.startsWith('dojo-media/'));
    if (!allowed) return fail(res,404,'Not found');
    const relative = local === '' ? 'index.html' : local.endsWith('/') ? local+'index.html' : local;
    const file = path.resolve(publicRoot,relative);
    if (!file.startsWith(path.resolve(publicRoot)+path.sep)) return fail(res,403,'Forbidden');
    const data = await fs.readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-cache'});
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch (error) {
    if (error instanceof URIError) return fail(res,400,'Bad URL');
    if (['ENOENT','EISDIR','ENOTDIR'].includes(error.code)) return fail(res,404,'Not found');
    console.error(error); fail(res,500,'Internal server error');
  }
});
if (!preview) {
  const require = createRequire(path.join(root,'dojo-media/package.json'));
  const {createServer} = await import(pathToFileURL(require.resolve('vite')).href);
  vite = await createServer({root:path.join(root,'dojo-media'),base:base+'dojo-media/',appType:'mpa',server:{middlewareMode:true,hmr:{server},host}});
}
server.on('error', error => {console.error(error.message);process.exitCode=1; void vite?.close();});
server.listen(port,host,() => console.log('Local: http://'+host+':'+port+base+' ('+(preview?'preview':'dev')+')'));
async function close() {await vite?.close(); server.close();}
process.on('SIGINT',close); process.on('SIGTERM',close);

import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
const root = fileURLToPath(new URL('../',import.meta.url));
const child = path.join(root,'dojo-media');
const require = createRequire(path.join(child,'package.json'));
const check = spawnSync(process.execPath,[require.resolve('typescript/bin/tsc'),'-b'],{cwd:child,stdio:'inherit'});
if (check.status !== 0) process.exit(check.status || 1);
const dist = path.resolve(root,'dist');
if (dist !== path.join(path.resolve(root),'dist')) throw new Error('Unsafe build directory');
await fs.rm(dist,{recursive:true,force:true});
await fs.mkdir(path.join(dist,'dentistry'),{recursive:true});
for (const file of ['index.html','gallery.css','gallery-assets']) await fs.cp(path.join(root,file),path.join(dist,file),{recursive:true});
for (const entry of await fs.readdir(path.join(root,'dentistry'),{withFileTypes:true})) {
  if (entry.name === 'assets' || entry.name === 'index.html' || (entry.isFile() && /\.(css|js)$/.test(entry.name))) {
    await fs.cp(path.join(root,'dentistry',entry.name),path.join(dist,'dentistry',entry.name),{recursive:true});
  }
}
const {build} = await import(pathToFileURL(require.resolve('vite')).href);
await build({root:child,base:'./',build:{outDir:path.join(dist,'dojo-media'),emptyOutDir:true}});
await fs.writeFile(path.join(dist,'.nojekyll'),'');
console.log('Static gallery built in dist/ (portable relative URLs).');

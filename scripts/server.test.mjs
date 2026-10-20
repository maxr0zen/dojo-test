import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import net from 'node:net';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
for(const base of ['/','/dojo-test/']) {
  test('Static server at '+base+' serves real files without SPA fallback', async () => {
    const reservation=net.createServer(); reservation.listen(0,'127.0.0.1'); await once(reservation,'listening');
    const port=reservation.address().port; await new Promise(resolve=>reservation.close(resolve));
    const child=spawn(process.execPath,['scripts/server.mjs','--preview','--port',String(port),'--base',base],{cwd:root,stdio:['ignore','pipe','pipe']});
    try {
      await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Server startup timeout')),10000); child.stdout.once('data',()=>{clearTimeout(timeout);resolve()});child.once('error',reject);child.once('exit',code=>reject(new Error('Server exited '+code)));});
      const origin='http://127.0.0.1:'+port;
      for(const route of ['', 'dentistry/','dojo-media/']) {
        const response=await fetch(origin+base+route); assert.equal(response.status,200,route);
        assert.match(response.headers.get('content-type'),/text\/html/);
        const html=await response.text(); assert.match(html,/<html lang="ru">/);
        for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
          if(/^(?:data:|mailto:|https?:)/.test(match[1])) continue;
          const resource=await fetch(new URL(match[1],origin+base+route)); assert.equal(resource.status,200,match[1]);
        }
      }
      for(const route of ['dentistry','dojo-media']) {const response=await fetch(origin+base+route+'?mock=error',{redirect:'manual'});assert.equal(response.status,308);assert.equal(response.headers.get('location'),base+route+'/?mock=error');}
      for(const route of ['dojo-media/missing-page','dojo-media/assets/missing.js','dentistry/missing.css','package.json','scripts/server.mjs']) assert.equal((await fetch(origin+base+route)).status,404,route);
      const head=await fetch(origin+base+'gallery.css',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
      if(base!=='/') assert.equal((await fetch(origin+'/dojo-media/')).status,404);
    }finally{child.kill();await once(child,'exit').catch(()=>{});}
  });
}

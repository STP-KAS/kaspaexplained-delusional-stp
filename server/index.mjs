import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lookupTransaction } from './transaction.mjs';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { TestnetLab } from './testnet.mjs';

export function createLocalServer({ directory = resolve('dist'), lookup = lookupTransaction, testnet = new TestnetLab() } = {}) {
  const root = resolve(directory);
  let requests = [];
  const capability=randomBytes(32).toString('hex');
  let testRequests=[];
  const mime = { '.wasm':'application/wasm', '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.ico':'image/x-icon', '.pdf':'application/pdf', '.xml':'application/xml', '.webmanifest':'application/manifest+json', '.txt':'text/plain' };
  return createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Frame-Options','DENY');
    const json = (status, body) => { response.writeHead(status, {'Content-Type':'application/json'}); response.end(JSON.stringify(body,(_,v)=>typeof v==='bigint'?v.toString():v)); };
    const allowedHosts=[`127.0.0.1:${request.socket.localPort}`,`localhost:${request.socket.localPort}`];
    if(!allowedHosts.includes(request.headers.host))return json(403,{error:'This preview only accepts local browser requests.'});
    if(request.headers['sec-fetch-site']==='cross-site')return json(403,{error:'Cross-site requests are not permitted.'});
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); } catch { return json(400, { error:'Invalid URL.' }); }
    if(pathname==='/api/session'&&request.method==='GET')return json(200,{capability});
    if(pathname.startsWith('/api/testnet/')){
      if(request.method!=='POST')return json(405,{error:'Testnet actions require an explicit request.'});
      const token=request.headers['x-lab-capability'];
      if(request.headers.origin!==`http://${request.headers.host}`||typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token)||!timingSafeEqual(Buffer.from(token),Buffer.from(capability)))return json(403,{error:'Refresh this local page before using the testnet lab.'});
      testRequests=testRequests.filter(time=>Date.now()-time<60000);if(testRequests.length>=60)return json(429,{error:'Please wait a minute before another testnet action.'});testRequests.push(Date.now());
      if(!request.headers['content-type']?.startsWith('application/json'))return json(415,{error:'JSON required.'});
      try{
        let size=0;const parts=[];for await(const chunk of request){size+=chunk.length;if(size>4096)return json(413,{error:'Request too large.'});parts.push(chunk);}
        const body=JSON.parse(Buffer.concat(parts).toString('utf8')||'{}');
        const action=pathname.slice('/api/testnet/'.length);
        if(action==='status')return json(200,await testnet.status());
        if(action==='request')return json(200,await testnet.request(body.amount));
        if(action==='review')return json(200,await testnet.review(body.requestId));
        if(action==='submit')return json(200,await testnet.submit(body.token));
        if(action==='recovery-review')return json(200,await testnet.reviewRecovery(body.transactionId));
        if(action==='recovery-submit')return json(200,await testnet.submitRecovery(body.token));
        if(action==='receipt')return json(200,await testnet.receipt(body.requestId));
        if(action==='application')return json(200,await testnet.createApplication(body.kind,body.options));
        if(action==='application-review')return json(200,await testnet.reviewApplication(body.requestId,body.entry,body.parameters));
        if(action==='contract')return json(200,await testnet.createContract());
        if(action==='split')return json(200,await testnet.createSplit(body.shareABps));
        if(action==='contract-review')return json(200,await testnet.reviewContract(body.requestId,body.entry));
        return json(404,{error:'Unknown testnet action.'});
      }catch(error){return json(400,{error:error instanceof SyntaxError?'Invalid request.':String(error.message||'The testnet operation could not be completed.').slice(0,240)});}
    }
    if (!['GET','HEAD'].includes(request.method)) return json(405, { error:'This service only reads data outside the testnet lab.' });
    if (pathname.startsWith('/api/transaction/')) {
      requests = requests.filter(time => Date.now() - time < 60000);
      if (requests.length >= 20) return json(429, { error:'Please wait a minute before looking up more transactions.' });
      const id = pathname.slice('/api/transaction/'.length).toLowerCase();
      if (!/^[a-f0-9]{64}$/.test(id)) return json(400, { error:'Enter a 64-character hexadecimal transaction ID.' });
      requests.push(Date.now());
      try {
        const result = await lookup(id);
        return json(result.status, result.body);
      } catch {
        return json(503, {error:'Transaction lookup is temporarily unavailable. Try again shortly.'});
      }
    }
    if (pathname.includes('\0')) return json(400, {error:'Invalid URL.'});
    let file = resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + sep)) return json(403, { error:'Unavailable path.' });
    let status = 200;
    try {
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    } catch {
      if (!extname(file)) file += '.html';
    }
    let content;
    try { content = await readFile(file); } catch {
      status = 404;
      file = resolve(root, '404.html');
      try { content = await readFile(file); } catch { content = 'Page not found.'; }
    }
    response.writeHead(status, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
    response.end(request.method === 'HEAD' ? undefined : content);
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 8898);
  createLocalServer().listen(port, '127.0.0.1', () => console.log(`Kaspa Explained: http://127.0.0.1:${port}/`));
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>process.exit(0));
}

import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

export function staticPreview(directory='dist-v1'){
  const root=resolve(directory),mime={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.pdf':'application/pdf','.xml':'application/xml','.json':'application/json'};
  return createServer(async(req,res)=>{
    let path;try{path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
    let file=resolve(root,'.'+path),code=200;
    if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
    try{if((await stat(file)).isDirectory())file=resolve(file,'index.html');}catch{if(!extname(file))file+='.html';}
    let body;try{body=await readFile(file);}catch{code=404;file=resolve(root,'404.html');body=await readFile(file).catch(()=>Buffer.from('Not found'));}
    res.writeHead(code,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:body);
  });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))staticPreview(process.argv[2]||'dist-v1').listen(Number(process.env.PORT||8899),'127.0.0.1',()=>console.log(`Static preview: http://127.0.0.1:${process.env.PORT||8899}/`));

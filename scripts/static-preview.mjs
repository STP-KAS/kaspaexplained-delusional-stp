import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve, extname, sep, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {answerQuestion, loadIntel, readJsonBody} from './ask-grok.mjs';

export function staticPreview(directory='dist-v1'){
  const root=resolve(directory),mime={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.wasm':'application/wasm','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.pdf':'application/pdf','.xml':'application/xml','.json':'application/json','.mp4':'video/mp4','.webm':'video/webm'};
  return createServer(async(req,res)=>{
    let path;try{path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
    if(path==='/ask'){
      if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type'});res.end();return;}
      if(req.method!=='POST'){res.writeHead(405);res.end();return;}
      try{
        const payload=await readJsonBody(req);
        const intel=await loadIntel(join(root,'assets','door-intel.json'));
        const result=await answerQuestion(intel,payload);
        const body=JSON.stringify(result);
        res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
        res.end(body);
      }catch(error){
        res.writeHead(400,{'Content-Type':'application/json; charset=utf-8'});
        res.end(JSON.stringify({error:error.message||'Ask failed.'}));
      }
      return;
    }
    let file=resolve(root,'.'+path),code=200;
    if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
    let info;
    try{
      info=await stat(file);
      if(info.isDirectory()){file=resolve(file,'index.html');info=await stat(file);}
    }catch{
      if(!extname(file)){
        try{file+='.html';info=await stat(file);}catch{code=404;}
      }else code=404;
    }
    if(code===404||!info){
      file=resolve(root,'404.html');
      try{info=await stat(file);}catch{
        res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');return;
      }
    }
    const type=mime[extname(file)]||'application/octet-stream';
    const headers={'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
    if(req.method==='HEAD'){
      headers['Content-Length']=String(info.size);
      res.writeHead(code===404?404:200,headers);res.end();return;
    }
    const match=typeof req.headers.range==='string'&&code!==404?/^bytes=(\d*)-(\d*)$/.exec(req.headers.range):null;
    if(match){
      const size=info.size;
      let start=match[1]===''?0:Number(match[1]);
      let end=match[2]===''?size-1:Number(match[2]);
      if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||start>=size){
        res.writeHead(416,{'Content-Range':`bytes */${size}`,'Accept-Ranges':'bytes'});res.end();return;
      }
      end=Math.min(end,size-1);
      headers['Content-Range']=`bytes ${start}-${end}/${size}`;
      headers['Content-Length']=String(end-start+1);
      res.writeHead(206,headers);
      createReadStream(file,{start,end}).pipe(res);return;
    }
    headers['Content-Length']=String(info.size);
    res.writeHead(code===404?404:200,headers);
    createReadStream(file).pipe(res);
  });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT||8899);
  const host=process.env.HOST||'127.0.0.1';
  const name=process.env.LOCAL_HOST||'kaspaexplained-stp.localhost';
  staticPreview(process.argv[2]||'dist-v1').listen(port,host,()=>{
    console.log(`Kaspa Explained STP`);
    console.log(`http://${host}:${port}/`);
    console.log(`http://${name}:${port}/`);
  });
}

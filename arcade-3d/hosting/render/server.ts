import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {POST} from '../../app/api/game/route';
const root=fileURLToPath(new URL('./client/',import.meta.url));
const types:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url||'/','http://localhost').pathname;
  if(pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end('{"ok":true}');return;}
  if(pathname==='/api/game'){
   if(req.method!=='POST'){res.writeHead(405,{Allow:'POST'});res.end();return;}
   let size=0;const chunks:Buffer[]=[];
   for await(const chunk of req){size+=chunk.length;if(size>4096){res.writeHead(413,{'Content-Type':'application/json'});res.end('{"error":"Request too large."}');return;}chunks.push(chunk);}
   const response=await POST(new Request('http://localhost/api/game',{method:'POST',headers:{'Content-Type':'application/json'},body:Buffer.concat(chunks).toString()}));
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());return;
  }
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
  const target=resolve(root,pathname==='/'?'index.html':'.'+decodeURIComponent(pathname));
  if(!target.startsWith(root.endsWith(sep)?root:root+sep)){res.writeHead(403);res.end();return;}
  const data=await readFile(target);res.writeHead(200,{'Content-Type':types[extname(target)]||'application/octet-stream','Cache-Control':pathname.startsWith('/assets/')?'public,max-age=31536000,immutable':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
 }catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT'){res.writeHead(404);res.end('Not found');}else{console.error(error);res.writeHead(500);res.end('Please try again.');}}
}).listen(Number(process.env.PORT)||10000,'0.0.0.0',()=>console.log('Tap Together is ready'));

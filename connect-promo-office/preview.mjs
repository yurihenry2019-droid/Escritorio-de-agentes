import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const base=path.join(path.dirname(fileURLToPath(import.meta.url)),'public');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpeg':'image/jpeg','.svg':'image/svg+xml'};
const port=Number(process.env.PORT||4321);
http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const target=path.resolve(base,'.'+(pathname==='/'||pathname==='/office'?'/office.html':pathname));if(!target.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}const data=await readFile(target);res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);}catch{res.writeHead(404);res.end('Não encontrado');}}).listen(port,'127.0.0.1',()=>console.log(`Prévia visual sem histórico do servidor: http://127.0.0.1:${port}`));

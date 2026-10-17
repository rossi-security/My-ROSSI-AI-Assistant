import { createServer } from 'node:http';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import './build.mjs';
const root=resolve(import.meta.dirname,'..');
const worker=(await import(pathToFileURL(join(root,'dist','server','index.js')).href)).default;
const server=createServer(async(req,res)=>{
  const chunks=[];for await(const chunk of req)chunks.push(chunk);
  const url=new URL(req.url,'http://127.0.0.1:4173');
  const response=await worker.fetch(new Request(url,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)}));
  res.writeHead(response.status,Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
});
server.listen(4173,'127.0.0.1',()=>console.log('Rossi local preview: http://127.0.0.1:4173'));

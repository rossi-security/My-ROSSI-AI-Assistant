import { readFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, join, sep } from 'node:path';

const root=resolve(import.meta.dirname,'..');
const files=['index.html','styles.css','app.js','engine.js','studio.js','sw.js','icon.svg','icon-192.png','icon-512.png','manifest.webmanifest'];
const types={'index.html':'text/html; charset=utf-8','styles.css':'text/css; charset=utf-8','app.js':'text/javascript; charset=utf-8','engine.js':'text/javascript; charset=utf-8','studio.js':'text/javascript; charset=utf-8','sw.js':'text/javascript; charset=utf-8','icon.svg':'image/svg+xml','icon-192.png':'image/png','icon-512.png':'image/png','manifest.webmanifest':'application/manifest+json'};
const assets={};
for(const name of files){const binary=name.endsWith('.png');assets[name==='index.html'?'/':'/'+name]={body:readFileSync(join(root,'web',name),binary?undefined:'utf8').toString(binary?'base64':'utf8'),type:types[name],binary};}
const source=readFileSync(join(root,'worker','handler.js'),'utf8');
if(!source.includes('__ROSSI_ASSETS__'))throw new Error('Missing asset placeholder');
const target=resolve(root,'dist');
if(!target.startsWith(root+sep))throw new Error('Build output must stay inside the project.');
rmSync(target,{recursive:true,force:true});
mkdirSync(join(target,'server'),{recursive:true});
mkdirSync(join(target,'.openai'),{recursive:true});
writeFileSync(join(target,'server','index.js'),source.replace('__ROSSI_ASSETS__',JSON.stringify(assets)));
writeFileSync(join(target,'.openai','hosting.json'),readFileSync(join(root,'.openai','hosting.json')));
console.log(`Built Rossi Worker with ${files.length} assets`);

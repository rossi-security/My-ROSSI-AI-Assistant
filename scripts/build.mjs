import { readFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root=resolve(import.meta.dirname,'..');
const files=['index.html','styles.css','app.js','icon.svg','manifest.webmanifest'];
const types={'index.html':'text/html; charset=utf-8','styles.css':'text/css; charset=utf-8','app.js':'text/javascript; charset=utf-8','icon.svg':'image/svg+xml','manifest.webmanifest':'application/manifest+json'};
const assets={};
for(const name of files){assets[name==='index.html'?'/':'/'+name]={body:readFileSync(join(root,'web',name),'utf8'),type:types[name]};}
const source=readFileSync(join(root,'worker','handler.js'),'utf8');
if(!source.includes('__ROSSI_ASSETS__'))throw new Error('Missing asset placeholder');
const target=join(root,'dist');
rmSync(target,{recursive:true,force:true});
mkdirSync(join(target,'server'),{recursive:true});
mkdirSync(join(target,'.openai'),{recursive:true});
writeFileSync(join(target,'server','index.js'),source.replace('__ROSSI_ASSETS__',JSON.stringify(assets)));
writeFileSync(join(target,'.openai','hosting.json'),readFileSync(join(root,'.openai','hosting.json')));
console.log(`Built Rossi Worker with ${files.length} assets`);

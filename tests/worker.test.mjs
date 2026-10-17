import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';

const request=(path,method='GET')=>worker.fetch(new Request(`https://rossi.example${path}`,{method}));

test('serves the offline app, modules, service worker, and install icons',async()=>{
  const home=await request('/');assert.equal(home.status,200);
  const html=await home.text();assert.match(html,/Independent|without another AI service/);
  for(const path of ['/app.js','/engine.js','/studio.js','/sw.js']){const response=await request(path);assert.equal(response.status,200,path);assert.match(response.headers.get('content-type'),/javascript/);}
  for(const path of ['/icon-192.png','/icon-512.png']){const response=await request(path);assert.equal(response.status,200,path);assert.equal(response.headers.get('content-type'),'image/png');const bytes=new Uint8Array(await response.arrayBuffer());assert.deepEqual([...bytes.slice(0,8)],[137,80,78,71,13,10,26,10]);}
});

test('has no chat backend or AI provider connection',async()=>{
  const before=globalThis.fetch;globalThis.fetch=()=>{throw Error('Unexpected outbound fetch');};
  try{assert.equal((await request('/api/chat')).status,404);assert.equal((await request('/api/chat','POST')).status,405);assert.equal((await request('/api/status')).status,404);}
  finally{globalThis.fetch=before;}
  const app=await (await request('/app.js')).text(),engine=await (await request('/engine.js')).text();
  assert.doesNotMatch(app+engine,/api\.openai\.com|esm\.run|WebLLM|OPENAI_API_KEY|fetch\s*\(/);
});

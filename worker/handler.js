const ASSETS=__ROSSI_ASSETS__;
export default {
  async fetch(request){
    if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
    const path=new URL(request.url).pathname;
    const asset=ASSETS[path];
    if(!asset)return new Response('Not found',{status:404});
    const body=request.method==='HEAD'?null:asset.binary?Uint8Array.from(atob(asset.body),character=>character.charCodeAt(0)):asset.body;
    return new Response(body,{headers:{'content-type':asset.type,'cache-control':'no-cache','x-content-type-options':'nosniff'}});
  }
};

// Procedural media creation on the device. No remote model, API or uploaded prompt.
const escapeXml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[character]));
const hash = value => {let result=2166136261;for(const character of value){result^=character.charCodeAt(0);result=Math.imul(result,16777619);}return result>>>0;};
const randomFrom = seed => () => {seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};

function paletteFor(prompt){
  const lower=prompt.toLowerCase();
  if(/rose|flower|floral|ரோஜா|மலர்/.test(lower))return {kind:'rose',a:'#180e21',b:'#44203a',c:'#e889a6',d:'#f7d49b',e:'#9fd5b2'};
  if(/space|star|galaxy|moon|cosmos|விண்|நட்சத்திர/.test(lower))return {kind:'space',a:'#090d29',b:'#2a315f',c:'#a98cf9',d:'#ffdca4',e:'#87d8e6'};
  if(/sea|ocean|water|beach|கடல்/.test(lower))return {kind:'landscape',a:'#101b38',b:'#205779',c:'#6fc6cc',d:'#ffc7a6',e:'#aad7c0'};
  if(/sunset|mountain|landscape|மலை|சூரிய/.test(lower))return {kind:'landscape',a:'#21112f',b:'#794765',c:'#f0a384',d:'#ffdfaa',e:'#b1a4d0'};
  return {kind:'abstract',a:'#120e24',b:'#3d2a61',c:'#b994ee',d:'#f6b6c8',e:'#9ddacb'};
}

export function makeSvg(prompt,{width=1024,height=1024}={}) {
  const clean=String(prompt||'A new idea').trim().slice(0,140)||'A new idea';
  const safeTitle=escapeXml(clean.slice(0,58));
  const p=paletteFor(clean),random=randomFrom(hash(clean));
  const stars=Array.from({length:44},()=>{const x=Math.round(35+random()*930),y=Math.round(36+random()*840),r=(.7+random()*2.5).toFixed(1);return `<circle cx="${x}" cy="${y}" r="${r}" fill="${random()>.6?p.d:'#fff'}" opacity="${(.2+random()*.6).toFixed(2)}"/>`;}).join('');
  const orbits=Array.from({length:5},(_,i)=>`<ellipse cx="500" cy="455" rx="${210+i*63}" ry="${160+i*57}" fill="none" stroke="${i%2?p.c:p.e}" stroke-opacity="${(.07+i*.01).toFixed(2)}" stroke-width="2" transform="rotate(${-24+i*17} 500 455)"/>`).join('');
  let scene='';
  if(p.kind==='rose'){
    const outer=Array.from({length:11},(_,i)=>`<ellipse cx="500" cy="${245+i%2*18}" rx="${77+i%3*11}" ry="206" fill="url(#petal)" stroke="${p.d}" stroke-opacity=".2" stroke-width="2" transform="rotate(${i*360/11} 500 432)" opacity=".88"/>`).join('');
    const inner=Array.from({length:7},(_,i)=>`<ellipse cx="500" cy="330" rx="46" ry="118" fill="url(#inner)" stroke="${p.d}" stroke-opacity=".45" stroke-width="2" transform="rotate(${i*360/7+13} 500 438)"/>`).join('');
    scene=`<path d="M506 569 C490 670 554 748 506 850" fill="none" stroke="${p.e}" stroke-width="16" stroke-linecap="round"/><path d="M509 699 C395 605 370 708 470 745 Q501 757 509 699ZM521 763 C638 676 673 789 542 806 Q515 801 521 763Z" fill="${p.e}" opacity=".65"/>${outer}${inner}<circle cx="500" cy="438" r="36" fill="${p.d}" opacity=".85"/><path d="M473 442q27-49 54-12q-8 38-42 27" fill="none" stroke="${p.a}" stroke-width="8" stroke-linecap="round" opacity=".55"/>`;
  } else if(p.kind==='space'){
    scene=`<ellipse cx="515" cy="482" rx="358" ry="138" fill="none" stroke="${p.d}" stroke-width="8" stroke-opacity=".7" transform="rotate(-23 515 482)"/><circle cx="504" cy="450" r="231" fill="url(#planet)" stroke="${p.d}" stroke-opacity=".45" stroke-width="3"/><path d="M291 524 Q475 363 711 456M300 576 Q524 460 673 568M353 319 Q556 390 703 276" fill="none" stroke="${p.e}" stroke-opacity=".19" stroke-width="18"/><circle cx="745" cy="248" r="39" fill="${p.d}" opacity=".9"/>`;
  } else if(p.kind==='landscape'){
    scene=`<circle cx="684" cy="323" r="142" fill="${p.d}" opacity=".86"/><circle cx="684" cy="323" r="198" fill="none" stroke="${p.d}" stroke-opacity=".22" stroke-width="5"/><path d="M0 620 185 416 360 602 518 365 780 679 1000 470V1000H0Z" fill="${p.b}"/><path d="M0 704 228 554 399 737 648 490 1000 738V1000H0Z" fill="${p.c}" opacity=".64"/><path d="M0 795 Q250 724 499 778 T1000 742V1000H0Z" fill="${p.a}" opacity=".67"/><path d="M0 858Q250 819 500 858T1000 838" fill="none" stroke="${p.d}" stroke-opacity=".31" stroke-width="6"/>`;
  } else {
    const ribbons=Array.from({length:6},(_,i)=>`<path d="M${-170+i*48} ${240+i*117} C${212+i*35} ${-25+i*69}, ${581-i*22} ${1015-i*68}, ${1125-i*29} ${210+i*93}" fill="none" stroke="${[p.c,p.d,p.e][i%3]}" stroke-width="${36-i*3}" stroke-opacity="${(.2+i*.055).toFixed(2)}" stroke-linecap="round"/>`).join('');
    scene=`${ribbons}<circle cx="505" cy="452" r="205" fill="url(#orb)" stroke="${p.d}" stroke-opacity=".5" stroke-width="3"/><path d="M429 480c45-121 96-141 152-24 58 121-48 176-138 81" fill="none" stroke="${p.d}" stroke-width="31" stroke-linecap="round" opacity=".72"/><circle cx="506" cy="448" r="29" fill="${p.e}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Procedural artwork: ${safeTitle}">
<title>${safeTitle}</title><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="${p.a}"/><stop offset="1" stop-color="${p.b}"/></linearGradient><radialGradient id="glow"><stop stop-color="${p.c}" stop-opacity=".48"/><stop offset="1" stop-color="${p.c}" stop-opacity="0"/></radialGradient><radialGradient id="orb" cx=".35" cy=".3"><stop stop-color="${p.d}"/><stop offset=".48" stop-color="${p.c}"/><stop offset="1" stop-color="${p.b}"/></radialGradient><radialGradient id="planet" cx=".3" cy=".2"><stop stop-color="${p.e}"/><stop offset=".4" stop-color="${p.c}"/><stop offset="1" stop-color="${p.a}"/></radialGradient><linearGradient id="petal" x2=".8" y2="1"><stop stop-color="${p.d}"/><stop offset=".4" stop-color="${p.c}"/><stop offset="1" stop-color="${p.b}"/></linearGradient><linearGradient id="inner" x2="1" y2="1"><stop stop-color="${p.d}"/><stop offset=".6" stop-color="${p.c}"/><stop offset="1" stop-color="${p.a}"/></linearGradient></defs>
<rect width="1000" height="1000" fill="url(#bg)"/><circle cx="700" cy="310" r="520" fill="url(#glow)"/><circle cx="220" cy="670" r="400" fill="url(#glow)" opacity=".42"/>${orbits}${stars}${scene}<rect x="24" y="24" width="952" height="952" rx="39" fill="none" stroke="${p.d}" stroke-opacity=".25" stroke-width="2"/><path d="M70 870h860" stroke="${p.d}" stroke-opacity=".3" stroke-width="2"/><text x="72" y="918" fill="#fff" opacity=".83" font-family="system-ui,sans-serif" font-size="24" letter-spacing="7">ROSSI STUDIO</text><text x="929" y="919" text-anchor="end" fill="${p.d}" opacity=".82" font-family="system-ui,sans-serif" font-size="22">✦</text></svg>`;
}

export async function recordClip(prompt,onProgress=()=>{},signal) {
  if(typeof document==='undefined'||typeof MediaRecorder==='undefined')throw Error('Video recording needs a browser with MediaRecorder support.');
  const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;
  if(typeof canvas.captureStream!=='function')throw Error('This browser cannot capture a canvas video.');
  const context=canvas.getContext('2d');if(!context)throw Error('Canvas is unavailable.');
  const source=URL.createObjectURL(new Blob([makeSvg(prompt,{width:960,height:540})],{type:'image/svg+xml'}));
  const image=new Image();image.src=source;
  try{await image.decode();}catch{URL.revokeObjectURL(source);throw Error('The artwork could not be prepared for video.');}
  const stream=canvas.captureStream(24);
  const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'].find(type=>MediaRecorder.isTypeSupported(type));
  if(!mime){stream.getTracks().forEach(track=>track.stop());URL.revokeObjectURL(source);throw Error('This browser cannot export a video file.');}
  const chunks=[];const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:3000000});
  const finished=new Promise((resolve,reject)=>{recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};recorder.onerror=event=>reject(event.error||Error('Recording failed.'));recorder.onstop=()=>resolve(new Blob(chunks,{type:mime}));});
  const title=String(prompt||'Rossi creation').trim().slice(0,68);
  const start=performance.now(),duration=4500;
  recorder.start(250);
  try{
    while(performance.now()-start<duration){
      if(signal?.aborted)throw Error('Video cancelled.');
      const progress=Math.min(1,(performance.now()-start)/duration),zoom=1.04+progress*.09;
      context.clearRect(0,0,960,540);context.save();context.translate(480,270);context.scale(zoom,zoom);context.drawImage(image,-480,-270,960,540);context.restore();
      context.fillStyle='rgba(10,8,23,.38)';context.fillRect(0,398,960,142);
      context.font='600 35px system-ui,sans-serif';context.fillStyle='#fff';context.fillText(title||'Rossi creation',44,468,870);
      context.font='500 16px system-ui,sans-serif';context.fillStyle='#f1c0d4';context.fillText('ROSSI  ·  CREATED ON YOUR DEVICE',46,505);
      for(let i=0;i<16;i++){const angle=i*2.399+progress*4, radius=60+i*26,x=480+Math.cos(angle)*radius,y=265+Math.sin(angle)*radius;context.beginPath();context.arc(x,y,1.5+i%3,0,Math.PI*2);context.fillStyle=`rgba(255,218,224,${.12+(i%4)*.08})`;context.fill();}
      onProgress(Math.round(progress*100));
      await new Promise(resolve=>requestAnimationFrame(resolve));
    }
  }finally{recorder.stop();stream.getTracks().forEach(track=>track.stop());URL.revokeObjectURL(source);}
  const blob=await finished;onProgress(100);
  if(!blob.size)throw Error('The video file was empty. Please retry in a supported browser.');
  return {blob,extension:mime.includes('mp4')?'mp4':'webm'};
}

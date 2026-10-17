import { MODES, replyTo } from './engine.js?v=3';
import { makeSvg, recordClip } from './studio.js?v=2';

const el = (selector) => document.querySelector(selector);
const all = (selector) => [...document.querySelectorAll(selector)];
const STORAGE_KEY = 'rossi.conversations.v1';
const SETTINGS_KEY = 'rossi.settings.v1';
const VALID_MODES = new Set(Object.keys(MODES));
const MODE_NAMES = MODES;

function safeRead(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function safeWrite(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
function safeRemove(key) { try { localStorage.removeItem(key); } catch {} }
const savedSettings = safeRead(SETTINGS_KEY, {});
const state = {
  conversations: (safeRead(STORAGE_KEY, []) || []).filter(c => c && typeof c.id === 'string' && Array.isArray(c.messages)).slice(0, 60),
  currentId: null,
  mode: VALID_MODES.has(savedSettings.mode) ? savedSettings.mode : 'auto',
  language: ['auto', 'English', 'Tamil', 'Tanglish'].includes(savedSettings.language) ? savedSettings.language : 'auto',
  working: false,
  epoch: 0
};

const currentChat = () => state.conversations.find(c => c.id === state.currentId) || null;
function saveAll() {
  safeWrite(STORAGE_KEY, state.conversations.slice(0, 60));
  safeWrite(SETTINGS_KEY, { mode: state.mode, language: state.language });
}
function newConversation() {
  if (state.working) stopResponse();
  const chat = { id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`, title: 'New conversation', messages: [], updatedAt: Date.now() };
  state.conversations.unshift(chat);
  state.currentId = chat.id;
  saveAll(); render(); closeSidebar(); el('#prompt-input').focus();
}
function ensureConversation() { if (!currentChat()) newConversation(); return currentChat(); }
function selectConversation(id) {
  if (state.working) stopResponse();
  if (!state.conversations.some(c => c.id === id)) return;
  state.currentId = id; render(); closeSidebar();
}
function clearHistory() {
  if (!state.conversations.length || !confirm('Delete all Rossi conversations saved in this browser?')) return;
  if (state.working) stopResponse();
  state.conversations = []; state.currentId = null; safeRemove(STORAGE_KEY); render(); toast('Conversation history deleted');
}
function setMode(mode) {
  if (!VALID_MODES.has(mode)) return;
  state.mode = mode;
  all('.mode-button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  el('#current-mode-label').textContent = MODE_NAMES[mode];
  saveAll(); closeSidebar();
}
function syncSidebarAccess(){
  const mobile=matchMedia('(max-width:760px)').matches;
  const open=el('#sidebar').classList.contains('is-open');
  const hidden=mobile&&!open;
  el('#sidebar').inert=hidden;
  el('#sidebar').setAttribute('aria-hidden',String(hidden));
  el('#main-content').inert=mobile&&open;
  el('#main-content').setAttribute('aria-hidden',String(mobile&&open));
  el('#sidebar-backdrop').inert=!mobile||!open;
  el('#sidebar-backdrop').setAttribute('aria-hidden',String(!mobile||!open));
}
function closeSidebar() {
  const hadFocus=el('#sidebar').contains(document.activeElement);
  el('#sidebar').classList.remove('is-open');
  el('#sidebar-backdrop').classList.remove('is-open');
  el('#sidebar-toggle').setAttribute('aria-expanded', 'false');
  syncSidebarAccess();
  if(hadFocus&&matchMedia('(max-width:760px)').matches)el('#sidebar-toggle').focus();
}
function toggleSidebar() {
  const open = !el('#sidebar').classList.contains('is-open');
  el('#sidebar').classList.toggle('is-open', open);
  el('#sidebar-backdrop').classList.toggle('is-open', open);
  el('#sidebar-toggle').setAttribute('aria-expanded', String(open));
  syncSidebarAccess();
  if(open)el('#sidebar-close').focus();else el('#sidebar-toggle').focus();
}
let toastTimer;
function toast(message) {
  const node = el('#toast'); node.textContent = message; node.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { node.hidden = true; }, 4200);
}
function updateStatus(label, status = 'idle') {
  el('#status-label').textContent = label;
  el('#status-dot').dataset.status = status;
}
function updateComposer() {
  const text = el('#prompt-input').value.trim();
  el('#send-button').disabled = state.working || !text;
  el('#stop-button').hidden = !state.working;
  el('#prompt-input').style.height = 'auto';
  el('#prompt-input').style.height = `${Math.min(el('#prompt-input').scrollHeight, 160)}px`;
}
function renderHistory() {
  const list = el('#conversation-list'); list.replaceChildren();
  const chats = state.conversations.filter(c => c.messages.length).sort((a,b) => (b.updatedAt||0)-(a.updatedAt||0));
  if (!chats.length) { const empty = document.createElement('p'); empty.className='empty-history'; empty.textContent='Your conversations will appear here.'; list.append(empty); return; }
  for (const chat of chats) {
    const button = document.createElement('button'); button.type='button'; button.className='conversation-item';
    button.setAttribute('aria-current', String(chat.id === state.currentId)); button.title=chat.title;
    const label = document.createElement('span'); label.textContent=chat.title; button.append(label);
    button.addEventListener('click', () => selectConversation(chat.id)); list.append(button);
  }
}
function appendInline(parent, text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) { const strong=document.createElement('strong'); strong.textContent=part.slice(2,-2); parent.append(strong); }
    else if (part.startsWith('`') && part.endsWith('`')) { const code=document.createElement('code'); code.className='inline-code'; code.textContent=part.slice(1,-1); parent.append(code); }
    else parent.append(document.createTextNode(part));
  }
}
function appendPlainText(container, text) {
  const lines=text.replace(/\r\n/g,'\n').split('\n');
  let list=null, listType='', paragraph=[];
  const flushParagraph=()=>{ if(!paragraph.length)return; const p=document.createElement('p'); appendInline(p,paragraph.join('\n')); container.append(p); paragraph=[]; };
  const flushList=()=>{list=null;listType='';};
  for(const line of lines){
    const trim=line.trim();
    if(!trim){flushParagraph();flushList();continue;}
    const heading=/^(#{2,3})\s+(.+)$/.exec(trim);
    if(heading){flushParagraph();flushList();const h=document.createElement(heading[1].length===2?'h2':'h3');appendInline(h,heading[2]);container.append(h);continue;}
    const bullet=/^[-*]\s+(.+)$/.exec(trim), numbered=/^\d+[.)]\s+(.+)$/.exec(trim);
    if(bullet||numbered){flushParagraph();const type=bullet?'ul':'ol';if(!list||listType!==type){list=document.createElement(type);container.append(list);listType=type;}const li=document.createElement('li');appendInline(li,(bullet||numbered)[1]);list.append(li);continue;}
    flushList();paragraph.push(line);
  }
  flushParagraph();
}
function renderRichText(container, text) {
  container.replaceChildren();
  const chunks=String(text||'').split(/```([^\n`]*)\n([\s\S]*?)```/g);
  for(let i=0;i<chunks.length;i+=3){
    if(chunks[i])appendPlainText(container,chunks[i]);
    if(i+2<chunks.length){
      const block=document.createElement('div');block.className='code-block';
      const header=document.createElement('div');header.className='code-header';
      const lang=document.createElement('span');lang.textContent=(chunks[i+1]||'code').trim()||'code';
      const copy=document.createElement('button');copy.className='copy-code';copy.type='button';copy.textContent='Copy code';
      const codeText=chunks[i+2].replace(/\n$/,'');
      copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(codeText);copy.textContent='Copied';setTimeout(()=>copy.textContent='Copy code',1800);}catch{toast('Copy failed on this browser');}});
      header.append(lang,copy);const pre=document.createElement('pre');const code=document.createElement('code');code.textContent=codeText;pre.append(code);block.append(header,pre);container.append(block);
    }
  }
}
function buildMessage(message) {
  const item=document.createElement('article');item.className=`message message--${message.role==='user'?'user':'assistant'}`;
  const avatar=document.createElement('div');avatar.className='message-avatar';avatar.setAttribute('aria-hidden','true');avatar.textContent=message.role==='user'?'Y':'R';
  const body=document.createElement('div');body.className='message-body';
  const meta=document.createElement('div');meta.className='message-meta';meta.textContent=message.role==='user'?'You':'Rossi';
  const content=document.createElement('div');content.className='message-content';
  if(message.pending&&!message.content){const typing=document.createElement('span');typing.className='typing-indicator';typing.setAttribute('aria-label','Rossi is thinking');typing.innerHTML='<i></i><i></i><i></i>';content.append(typing);}else renderRichText(content,message.content);
  body.append(meta,content);item.append(avatar,body);return item;
}
function renderMessages() {
  const list=el('#messages');list.replaceChildren();
  const chat=currentChat();
  el('#welcome-screen').hidden=!!chat?.messages?.length;
  for(const message of chat?.messages||[])list.append(buildMessage(message));
  requestAnimationFrame(()=>{const scroll=el('#chat-scroll');scroll.scrollTop=chat?.messages?.length?scroll.scrollHeight:0;});
}
function render(){renderHistory();renderMessages();updateComposer();}
function setWorking(working){state.working=working;updateComposer();}
function stopResponse(){
  state.epoch++;
  const chat=currentChat();if(chat?.messages.at(-1)?.pending){const m=chat.messages.at(-1);m.pending=false;if(!m.content)chat.messages.pop();}
  setWorking(false);saveAll();renderMessages();toast('Response stopped');
}
async function sendMessage(rawText){
  const text=rawText.trim();if(!text||state.working)return;
  const chat=ensureConversation();chat.messages.push({role:'user',content:text});
  if(chat.title==='New conversation')chat.title=text.slice(0,48)+(text.length>48?'…':'');
  chat.updatedAt=Date.now();
  const reply={role:'assistant',content:'',pending:true};chat.messages.push(reply);
  el('#prompt-input').value='';state.epoch++;const epoch=state.epoch;
  setWorking(true);saveAll();render();
  try{
    await new Promise(resolve=>requestAnimationFrame(resolve));
    if(epoch!==state.epoch)return;
    reply.content=replyTo(text,{mode:state.mode,language:state.language});
    reply.pending=false;
    if(!reply.content.trim())throw new Error('Rossi could not work that out locally.');
    chat.updatedAt=Date.now();saveAll();render();
  }catch(error){
    if(epoch!==state.epoch)return;
    reply.pending=false;
    reply.failed=true;
    reply.content=`I couldn’t complete that response locally. ${String(error.message||error)} Try a narrower question or another focus.`;
    saveAll();render();
  }finally{if(epoch===state.epoch)setWorking(false);}
}
let studioObjectURL=null,studioController=null,installPrompt=null;
function studioPrompt(){return el('#studio-prompt').value.trim().slice(0,140);}
function setStudioOutput(node,url,filename){
  if(studioObjectURL)URL.revokeObjectURL(studioObjectURL);
  studioObjectURL=url;
  el('#studio-preview').replaceChildren(node);
  const download=el('#studio-download');download.href=url;download.download=filename;download.hidden=false;
}
function openStudio(kind='image'){
  el('#studio-dialog').showModal();
  if(kind==='video')el('#studio-video').focus();else el('#studio-prompt').focus();
}
function createImage(){
  const prompt=studioPrompt();if(!prompt){el('#studio-status').textContent='Describe the image first.';el('#studio-prompt').focus();return;}
  const svg=makeSvg(prompt),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
  const image=document.createElement('img');image.src=url;image.alt=`Rossi procedural art: ${prompt}`;
  setStudioOutput(image,url,'rossi-art.svg');
  el('#studio-status').textContent='Original vector artwork is ready. Download the SVG to keep it.';
}
async function createVideo(){
  const prompt=studioPrompt();if(!prompt){el('#studio-status').textContent='Describe the video first.';el('#studio-prompt').focus();return;}
  studioController=new AbortController();
  el('#studio-video').disabled=true;el('#studio-image').disabled=true;el('#studio-cancel').hidden=false;
  el('#studio-status').textContent='Drawing video on this device…';
  try{
    const result=await recordClip(prompt,percent=>{el('#studio-status').textContent=`Rendering video: ${percent}%`;},studioController.signal);
    const url=URL.createObjectURL(result.blob),video=document.createElement('video');
    video.src=url;video.controls=true;video.playsInline=true;video.setAttribute('aria-label','Generated Rossi video preview');
    setStudioOutput(video,url,`rossi-clip.${result.extension}`);
    el('#studio-status').textContent='Your short, silent animated clip is ready to download.';
  }catch(error){el('#studio-status').textContent=String(error.message||error);}
  finally{studioController=null;el('#studio-video').disabled=false;el('#studio-image').disabled=false;el('#studio-cancel').hidden=true;}
}
async function installApp(){
  if(installPrompt){const event=installPrompt;installPrompt=null;await event.prompt();return;}
  toast('Use your browser menu → Install app, or Share → Add to Home Screen on iPhone.');
}
function init(){
  el('#language-select').value=state.language;
  setMode(state.mode);render();syncSidebarAccess();updateStatus('Offline engine ready','ready');
  el('#new-chat').addEventListener('click',newConversation);
  el('#clear-history').addEventListener('click',clearHistory);
  el('#sidebar-toggle').addEventListener('click',toggleSidebar);
  el('#sidebar-close').addEventListener('click',closeSidebar);
  el('#sidebar-backdrop').addEventListener('click',closeSidebar);
  addEventListener('resize',syncSidebarAccess);
  all('.mode-button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  all('[data-prompt]').forEach(b=>b.addEventListener('click',()=>{const prompt=b.dataset.prompt;el('#prompt-input').value=prompt;updateComposer();el('#prompt-input').focus();}));
  all('[data-studio]').forEach(b=>b.addEventListener('click',()=>openStudio(b.dataset.studio)));
  el('#language-select').addEventListener('change',e=>{state.language=e.target.value;saveAll();toast(`Language: ${e.target.selectedOptions[0].text}`);});
  el('#settings-button').addEventListener('click',()=>el('#settings-dialog').showModal());
  el('#close-settings').addEventListener('click',()=>el('#settings-dialog').close());
  el('#settings-dialog').addEventListener('click',e=>{if(e.target===el('#settings-dialog'))el('#settings-dialog').close();});
  el('#open-studio').addEventListener('click',()=>openStudio());
  el('#studio-close').addEventListener('click',()=>el('#studio-dialog').close());
  el('#studio-dialog').addEventListener('click',e=>{if(e.target===el('#studio-dialog'))el('#studio-dialog').close();});
  el('#studio-dialog').addEventListener('close',()=>studioController?.abort());
  el('#studio-image').addEventListener('click',createImage);
  el('#studio-video').addEventListener('click',createVideo);
  el('#studio-cancel').addEventListener('click',()=>studioController?.abort());
  el('#install-app').addEventListener('click',installApp);
  addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;});
  addEventListener('appinstalled',()=>toast('Rossi is installed. Open it from your apps.'));
  el('#prompt-input').addEventListener('input',updateComposer);
  el('#prompt-input').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();el('#composer-form').requestSubmit();}});
  el('#composer-form').addEventListener('submit',e=>{e.preventDefault();sendMessage(el('#prompt-input').value);});
  el('#stop-button').addEventListener('click',stopResponse);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSidebar();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();el('#prompt-input').focus();}});
  if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
init();

const ASSETS = __ROSSI_ASSETS__;
const JSON_HEADERS = {'content-type':'application/json; charset=utf-8','cache-control':'no-store'};
const MODES = {
  auto: 'Help with the actual task. Be clear and useful.',
  code: 'Teach app and website development, including Python, Java, HTML, CSS and JavaScript. Give complete runnable examples, setup steps, accessible UI and honest notes about untested code.',
  design: 'Suggest original interface design and animations with useful HTML/CSS/JS examples. Include mobile design, keyboard accessibility and reduced-motion support.',
  fitness: 'Offer general fitness education, not diagnosis or treatment. Ask about goals, ability, injury and constraints before detailed plans. Favor gradual progress; recommend a qualified clinician for symptoms or medical conditions.',
  support: 'Respond empathetically. Do not diagnose or claim to be a therapist. Suggest practical coping steps and connection with trusted people. In immediate danger, direct the person to local emergency services or nearby human help without inventing a hotline.',
  reason: 'Help with decisions by clarifying goals, options, trade-offs, risk and uncertainty. Preserve the user’s choice and avoid false certainty.',
  math: 'Explain mathematics step by step, state formulas, check the calculation and admit uncertainty.',
  ideas: 'Offer diverse, specific ideas and a simple experiment or next action for each.'
};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:JSON_HEADERS});
const SYSTEM='You are Rossi, a practical and thoughtful AI companion. Reply naturally in English, Tamil script, or Tanglish based on the user preference. Be warm, clear and honest. Do not claim custom training or superiority. Do not invent sources, tests, credentials, diagnoses or emergency numbers. For code, offer usable examples; for decisions, explain trade-offs; for mathematics, show and verify steps.';
const TANGLISH_CRISIS=/\b(?:suicide\s+panna|tharkolai|saaganum|saaga\s*poren|saagaporen|seththu\s*poganum|sethu\s*poganum|uyira?\s*vidanum)\b/i;
const CRISIS=/\b(kill myself|suicide|end my life|hurt myself|self harm|self-harm|i want to die|take my life)\b|(?:தற்கொலை|உயிரை\s*(?:மாய்த்து|விட)|சாக\s*வேண்டும்|சாகணும்|செத்துப்\s*போக)/i;
function safeMessages(input){
  if(!Array.isArray(input))return null;
  const list=input.slice(-16);
  if(!list.length||list.length>16)return null;
  const clean=[];
  for(const message of list){if(!message||!['user','assistant'].includes(message.role)||typeof message.content!=='string'||message.content.length>12000)return null;clean.push({role:message.role,content:message.content});}
  if(clean.at(-1).role!=='user')return null;
  return clean;
}
function extractReply(data){
  const output=data?.output;
  if(!Array.isArray(output))return '';
  return output.flatMap(item=>Array.isArray(item?.content)?item.content:[]).filter(part=>part?.type==='output_text'&&typeof part.text==='string').map(part=>part.text).join('\n').trim();
}
async function handleChat(request,env){
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  const type=request.headers.get('content-type')||'';
  if(!type.includes('application/json'))return json({error:'Send JSON.'},415);
  const length=Number(request.headers.get('content-length')||0);
  if(length>120000)return json({error:'Conversation is too long.'},413);
  let body;try{body=await request.json();}catch{return json({error:'Invalid JSON.'},400);}
  const messages=safeMessages(body?.messages);
  if(!messages)return json({error:'Send a valid conversation ending with a user message.'},400);
  const mode=Object.hasOwn(MODES,body.mode)?body.mode:'auto';
  const language=['auto','English','Tamil','Tanglish'].includes(body.language)?body.language:'auto';
  const latest=messages.at(-1).content;
  if(CRISIS.test(latest)||TANGLISH_CRISIS.test(latest))return json({reply:language==='Tamil'||/[\u0B80-\u0BFF]/.test(latest)
    ? 'நீங்கள் இப்போது பாதுகாப்பாக இருக்க உதவி பெறுவது முக்கியம். உடனடி ஆபத்து இருந்தால் உங்கள் உள்ளூர் அவசர சேவையை இப்போதே அழைக்கவும் அல்லது அருகிலிருக்கும் நம்பகமான ஒருவரிடம் உடனே சொல்லவும். நீங்கள் தனியாக இருக்க வேண்டாம். இப்போது அருகில் யாரை அணுக முடியும்?'
    : language==='Tanglish'||TANGLISH_CRISIS.test(latest)
    ? 'Neenga ippo safe-a irukka udhavi vaangradhu mukkiyam. Udane aabathu irundha, unga local emergency service-ku call pannunga; illa pakkathula irukkura nambikkaiyana oruthar kitte ippove sollunga. Thaniya irukka vendam. Ippo yaarai contact panna mudiyum?'
    : 'I’m sorry you’re facing this. If you might hurt yourself soon, call your local emergency service now or go to someone nearby you trust. Please don’t stay alone with this. Who can you contact right now?'});
  if(!env.OPENAI_API_KEY)return json({error:'Cloud AI is not configured. Start a local model in Settings.'},503);
  const instructions=`${SYSTEM}\nFocus: ${MODES[mode]}\nLanguage: ${language==='auto'?'Match the user’s language.':`Respond in ${language}.`}`;
  let result;
  try{
    result=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'authorization':`Bearer ${env.OPENAI_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({model:env.OPENAI_MODEL||'gpt-6.1-sol',instructions,input:messages,store:false,max_output_tokens:1500})});
  }catch{return json({error:'AI provider could not be reached. Please retry.'},502);}
  let data;try{data=await result.json();}catch{return json({error:'AI provider returned an unreadable response.'},502);}
  if(!result.ok){
    const kind=data?.error?.code;
    if(result.status===401)return json({error:'Cloud AI credentials need attention.'},503);
    if(result.status===429){
      if(kind==='billing_not_active')return json({error:'OpenAI API billing is not active for this project. You can enable billing in OpenAI Platform or start a local model in Settings.',code:kind},503);
      if(kind==='insufficient_quota')return json({error:'OpenAI API credits or spending quota have been exhausted. The local model in Settings remains available.',code:kind},503);
      if(kind==='rate_limit_exceeded')return json({error:'OpenAI is rate limiting requests. Wait briefly and retry.',code:kind},503);
      return json({error:'OpenAI returned a usage limit response. Check API billing and project limits.',code:kind||'limit_reached'},503);
    }
    return json({error:typeof kind==='string'?`AI provider error: ${kind}`:'AI provider could not complete the response.'},502);
  }
  const reply=extractReply(data);
  if(!reply)return json({error:'AI provider returned no text.'},502);
  return json({reply});
}
export default {
  async fetch(request,env){
    const url=new URL(request.url),path=url.pathname;
    if(path==='/api/status'&&request.method==='GET')return json({cloud:!!env.OPENAI_API_KEY,model:env.OPENAI_MODEL||'gpt-6.1-sol'});
    if(path==='/api/chat')return handleChat(request,env);
    if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
    const asset=ASSETS[path];
    if(!asset)return new Response('Not found',{status:404});
    return new Response(request.method==='HEAD'?null:asset.body,{headers:{'content-type':asset.type,'cache-control':'no-cache','x-content-type-options':'nosniff'}});
  }
};

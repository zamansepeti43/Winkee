import { supabase, supabaseConfigured } from './lib/supabase';

const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const avatar = p => p?.avatar_url?.startsWith('emoji:') ? esc(p.avatar_url.slice(6)) : '🙂';

async function me(){ if(!supabaseConfigured) return null; const {data:{user}}=await supabase.auth.getUser(); return user; }

async function search(term){
  if(!supabaseConfigured || !term.trim()) return [];
  const {data,error}=await supabase.rpc('search_winkee_users',{search_term:term.trim().replace(/^@/,'')});
  if(error){ console.error('Winkee search',error); return []; }
  return data||[];
}

async function openChat(p){
  const u=await me(); if(!u||!p?.id) return;
  const {data:mine}=await supabase.from('conversation_members').select('conversation_id').eq('user_id',u.id);
  const ids=(mine||[]).map(x=>x.conversation_id);
  if(ids.length){
    const {data:members}=await supabase.from('conversation_members').select('conversation_id,user_id').in('conversation_id',ids);
    const existing=(members||[]).find(x=>x.user_id===p.id);
    if(existing){ location.reload(); return; }
  }
  const {data:c,error}=await supabase.from('conversations').insert({created_by:u.id,is_group:false}).select('id').single();
  if(error){ alert(error.message); return; }
  const {error:merr}=await supabase.from('conversation_members').insert([{conversation_id:c.id,user_id:u.id},{conversation_id:c.id,user_id:p.id}]);
  if(merr){ alert(merr.message); return; }
  location.reload();
}

function renderResults(list,items){
  list.innerHTML=items.length ? items.map(p=>`<div class="wk-contact-row"><div class="wk-contact-avatar">${avatar(p)}</div><div class="wk-contact-copy"><strong>${esc(p.display_name||p.username)}</strong><span>@${esc(p.username)}</span></div><button class="wk-contact-btn" data-hotfix-user="${p.id}">Mesaj</button></div>`).join('') : '<div class="wk-contact-empty">Bu kullanıcı adı veya isimle Winkee üyesi bulunamadı.</div>';
  list.querySelectorAll('[data-hotfix-user]').forEach(b=>b.onclick=()=>{const p=items.find(x=>x.id===b.dataset.hotfixUser);openChat(p)});
}

function hookSearch(){
  document.addEventListener('input',e=>{
    const input=e.target.closest?.('.wk-contact-search input');
    if(!input) return;
    const list=document.querySelector('.wk-contact-list'); if(!list)return;
    clearTimeout(window.__wkSearchTimer);
    const term=input.value;
    window.__wkSearchTimer=setTimeout(async()=>{
      if(!term.trim()){ list.innerHTML='<div class="wk-contact-empty">Kullanıcı adını veya ismi yaz.</div>'; return; }
      list.innerHTML='<div class="wk-contact-empty">Aranıyor…</div>';
      renderResults(list,await search(term));
    },180);
  },true);
}

function setReactInput(input,value){
  if(!input)return;
  const next=String(value??'');
  if(input.value===next)return;
  const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
  setter?.call(input,next);
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
}
function setReactTextarea(input,value){
  if(!input)return;
  const next=String(value??'');
  if(input.value===next)return;
  const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')?.set;
  setter?.call(input,next);
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
}

async function hydrateProfile(){
  if(!supabaseConfigured)return;
  const u=await me(); if(!u)return;
  const {data:p}=await supabase.from('profiles').select('*').eq('id',u.id).maybeSingle();
  if(!p)return;
  const page=document.querySelector('main.profile');
  if(page){
    const display=p.display_name||p.username||'Winkee Kullanıcısı';
    const h=page.querySelector('.profile-info h1'); const sub=page.querySelector('.profile-info p');
    if(h)h.textContent=`${display} ✨`; if(sub)sub.textContent=`@${p.username||''}`;
    const a=page.querySelector('.profile-avatar'); if(a)a.textContent=p.avatar_url?.startsWith('emoji:')?p.avatar_url.slice(6):'🙂';
    const s=page.querySelectorAll('.stats b'); if(s[0])s[0].textContent=p.xp??0; if(s[1])s[1].textContent=p.level??1; if(s[2])s[2].textContent=p.coins??100;
  }
  const modal=[...document.querySelectorAll('.modal-card')].find(x=>/Profilini düzenle/i.test(x.textContent||''));
  if(!modal)return;
  const inputs=[...modal.querySelectorAll('input')];
  const textareas=[...modal.querySelectorAll('textarea')];
  if(inputs[0])setReactInput(inputs[0],p.display_name||p.username||'');
  if(inputs[1])setReactInput(inputs[1],p.username||'');
  if(textareas[0])setReactTextarea(textareas[0],p.bio||'');
  const phone=modal.querySelector('.wk-profile-phone'); if(phone)setReactInput(phone,p.phone||'');
}

function injectMobileChatLayout(){
  if(document.getElementById('wk-mobile-chat-fix')) return;
  const style=document.createElement('style');
  style.id='wk-mobile-chat-fix';
  style.textContent=`
    html,body,#root{height:100%;min-height:100%;}
    body{overflow:hidden;}
    .app{height:100dvh;min-height:100dvh;overflow:hidden;}
    .mobile-shell{height:100dvh;min-height:100dvh;overflow:hidden;}
    .conversation{height:calc(100dvh - 76px)!important;min-height:0!important;margin-bottom:0!important;overflow:hidden;}
    .conversation .chat-header{flex:0 0 64px;height:64px;min-height:64px;}
    .conversation .messages{flex:1 1 auto;min-height:0;overflow-y:auto;padding:12px 14px 8px;}
    .conversation .composer-tools{flex:0 0 auto;padding:5px 12px 6px;min-height:42px;}
    .conversation .composer{flex:0 0 auto;margin:2px 12px 8px;min-height:50px;max-height:58px;}
    .conversation .composer input{height:42px;}
    .conversation .bottom-nav{display:none;}
    .bottom-nav{height:76px;bottom:0;}
    .wk-chat-panel{background:#17101f;border:1px solid #ffffff12;border-radius:18px;margin:0 12px 6px;padding:9px;display:flex;gap:7px;overflow-x:auto;box-shadow:0 12px 30px #0007;}
    .wk-chat-panel button{flex:0 0 auto;background:#24182d;border:1px solid #ffffff0b;border-radius:12px;padding:8px 10px;color:#eee;font-size:18px;}
    .wk-chat-panel button small{display:block;font-size:8px;color:#9b8da2;margin-top:2px;}
    @media(min-width:700px){.conversation{height:100dvh!important;margin-bottom:0!important}.bottom-nav{display:flex!important}.conversation .bottom-nav{display:flex!important}}
  `;
  document.head.appendChild(style);
}

function composerInput(){return document.querySelector('.conversation .composer input');}
function closePanels(){document.querySelectorAll('.wk-chat-panel').forEach(x=>x.remove());}
function appendToComposer(value){
  const input=composerInput(); if(!input)return;
  const next=`${input.value||''}${value}`;
  setReactInput(input,next);
  input.focus();
}

function showEmojiPicker(){
  closePanels();
  const box=document.createElement('div'); box.className='wk-chat-panel wk-emoji-panel';
  const list=['😀','😂','😍','🥳','😎','🤔','😭','🔥','❤️','👍','🎉','🎮','🎬','🎵','🍿','👀','✨','💜','💯','🙌','👏','🤩','😜','🫶','🚀','🎁','🏆','😇','😈','🤯','🥹','😉'];
  list.forEach(e=>{const b=document.createElement('button');b.type='button';b.textContent=e;b.onclick=()=>appendToComposer(e);box.appendChild(b)});
  const composer=document.querySelector('.conversation .composer'); composer?.before(box);
}
function showGifPicker(){
  closePanels();
  const box=document.createElement('div'); box.className='wk-chat-panel wk-gif-panel';
  [['😂','Kahkaha'],['❤️','Aşk'],['🔥','Ateş'],['👏','Bravo'],['🥹','Duygusal'],['🎉','Kutlama'],['😎','Cool'],['🤯','Şok']].forEach(([e,t])=>{
    const b=document.createElement('button');b.type='button';b.innerHTML=`${e}<small>${t}</small>`;b.onclick=()=>{appendToComposer(` ${e}`);closePanels()};box.appendChild(b);
  });
  const composer=document.querySelector('.conversation .composer'); composer?.before(box);
}
function showAttachmentPicker(){
  const input=document.createElement('input'); input.type='file'; input.accept='image/*,video/*'; input.multiple=false; input.style.display='none';
  input.onchange=()=>{const f=input.files?.[0];if(f){appendToComposer(` 📎 ${f.name}`);window.setTimeout(()=>input.remove(),0)}else input.remove()};
  document.body.appendChild(input); input.click();
}

function hookComposerControls(){
  document.addEventListener('click',e=>{
    const conv=e.target.closest?.('.conversation'); if(!conv)return;
    const btn=e.target.closest?.('.composer button'); if(!btn)return;
    const buttons=[...conv.querySelectorAll('.composer button')]; const idx=buttons.indexOf(btn);
    if(idx===0){e.preventDefault();e.stopImmediatePropagation();showAttachmentPicker();return;}
    if(btn.classList.contains('send')) return;
    if(btn.querySelector('svg[data-lucide="smile"]')){e.preventDefault();e.stopImmediatePropagation();showEmojiPicker();return;}
  },true);
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('.composer-tools button'); if(!b)return;
    const text=(b.textContent||'').trim();
    if(text==='GIF'){
      e.preventDefault();e.stopImmediatePropagation();showGifPicker();
    }
  },true);
  document.addEventListener('click',e=>{
    if(!e.target.closest('.wk-chat-panel')&&!e.target.closest('.composer button')&&!e.target.closest('.composer-tools button'))closePanels();
  });
}

function start(){
  injectMobileChatLayout();
  hookSearch();
  hookComposerControls();
  const observer=new MutationObserver(()=>{clearTimeout(window.__wkHydrateTimer);window.__wkHydrateTimer=setTimeout(()=>{injectMobileChatLayout();hydrateProfile()},120)});
  observer.observe(document.body,{subtree:true,childList:true});
  hydrateProfile();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();

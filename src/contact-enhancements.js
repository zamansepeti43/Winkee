import { supabase, supabaseConfigured } from './lib/supabase';

const css = `
.wk-contact-backdrop{position:fixed;inset:0;z-index:9999;background:rgba(5,2,14,.72);backdrop-filter:blur(12px);display:flex;align-items:flex-end;justify-content:center;padding:0}
.wk-contact-sheet{width:min(680px,100%);max-height:88vh;overflow:auto;background:#120d1b;border:1px solid rgba(255,255,255,.1);border-radius:28px 28px 0 0;box-shadow:0 -20px 70px rgba(151,45,255,.25);padding:22px;color:#fff;font-family:inherit}
.wk-contact-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.wk-contact-head h2{margin:0;font-size:22px}.wk-contact-head button,.wk-contact-close{border:0;background:#24192e;color:#fff;border-radius:12px;width:40px;height:40px;font-size:22px;cursor:pointer}
.wk-contact-search{display:flex;align-items:center;gap:10px;background:#1d1525;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:0 14px;margin-bottom:12px}.wk-contact-search input{flex:1;background:transparent;border:0;outline:0;color:#fff;padding:14px 4px;font-size:16px}.wk-contact-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}.wk-contact-action{border:1px solid rgba(255,255,255,.08);background:#1d1525;color:#fff;border-radius:16px;padding:14px;text-align:left;cursor:pointer}.wk-contact-action strong{display:block}.wk-contact-action small{color:#9e94a8}.wk-contact-list{display:flex;flex-direction:column;gap:8px}.wk-contact-row{display:flex;align-items:center;gap:12px;background:#191220;border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:10px}.wk-contact-avatar{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#742cff,#f229c7);font-size:22px;overflow:hidden}.wk-contact-avatar img{width:100%;height:100%;object-fit:cover}.wk-contact-copy{flex:1;min-width:0}.wk-contact-copy strong{display:block}.wk-contact-copy span{display:block;color:#9e94a8;font-size:13px;margin-top:3px}.wk-contact-btn{border:0;border-radius:12px;padding:10px 13px;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#8d2cff,#f22bc9);color:#fff}.wk-contact-btn.invite{background:#2a2032}.wk-contact-empty{text-align:center;color:#9e94a8;padding:28px 10px}.wk-contact-note{font-size:12px;color:#8f8699;line-height:1.5;margin:12px 2px}.wk-contact-toast{position:fixed;z-index:10000;left:50%;bottom:24px;transform:translateX(-50%);background:#21172a;color:#fff;border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px 16px;box-shadow:0 10px 30px #0008}
@media(max-width:560px){.wk-contact-actions{grid-template-columns:1fr}.wk-contact-sheet{padding:18px;border-radius:24px 24px 0 0}}
`;

document.head.appendChild(Object.assign(document.createElement('style'),{textContent:css}));

let contacts = [];
let registered = [];
let query = '';
let backdrop = null;

function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function avatarHtml(p){return p?.avatar_url&&!p.avatar_url.startsWith('emoji:')?`<img src="${esc(p.avatar_url)}" alt="">`:(p?.avatar_url?.startsWith('emoji:')?esc(p.avatar_url.slice(6)):'🙂')}
function toast(text){const el=document.createElement('div');el.className='wk-contact-toast';el.textContent=text;document.body.appendChild(el);setTimeout(()=>el.remove(),2600)}

async function currentUser(){if(!supabaseConfigured)return null;const {data:{user}}=await supabase.auth.getUser();return user}
async function searchUsers(q){if(!supabaseConfigured||!q.trim())return[];const needle=q.trim().replace(/[%_]/g,'');const {data,error}=await supabase.from('profiles').select('id,username,display_name,avatar_url,xp,level,phone').or(`username.ilike.%${needle}%,display_name.ilike.%${needle}%`).limit(30);if(error){toast(error.message);return[]}return data||[]}
async function createConversation(other){
 const me=await currentUser(); if(!me||!other?.id)return;
 const {data:mine}=await supabase.from('conversation_members').select('conversation_id,user_id').eq('user_id',me.id);
 const ids=(mine||[]).map(x=>x.conversation_id);
 if(ids.length){const {data:members}=await supabase.from('conversation_members').select('conversation_id,user_id').in('conversation_id',ids);const existing=(members||[]).filter(x=>x.user_id===other.id).map(x=>x.conversation_id);if(existing.length){location.reload();return;}}
 const {data:c,error:e}=await supabase.from('conversations').insert({created_by:me.id,is_group:false}).select('id').single();
 if(e){toast(e.message);return}
 const {error:m}=await supabase.from('conversation_members').insert([{conversation_id:c.id,user_id:me.id},{conversation_id:c.id,user_id:other.id}]);
 if(m){toast(m.message);return}
 toast(`${other.display_name||other.username} ile sohbet hazır 💬`);location.reload();
}
async function shareInvite(name=''){const url=`${location.origin}/?invite=winkee`;const text=name?`${name}, Winkee'ye katılalım! 💜`:'Winkee’ye katıl! 💜 Mesajlaş, oyna, eğlen.';try{if(navigator.share){await navigator.share({title:'Winkee',text,url});return}await navigator.clipboard.writeText(`${text} ${url}`);toast('Davet bağlantısı kopyalandı.')}catch(e){if(e?.name!=='AbortError')toast('Paylaşım açılamadı.')}}
async function importPhoneContacts(){
 if(!('contacts' in navigator)||!navigator.contacts?.select){toast('Bu tarayıcı rehber erişimini desteklemiyor. Aşağıdaki davet bağlantısını kullanabilirsin.');return}
 try{
  const picked=await navigator.contacts.select(['name','tel'],{multiple:true});
  contacts=picked||[];
  const phones=contacts.flatMap(c=>c.tel||[]).filter(Boolean);
  let matches=[];
  if(phones.length&&supabaseConfigured){const {data,error}=await supabase.rpc('find_winkee_contacts',{phone_numbers:phones});if(!error)matches=data||[]}
  registered=matches.map(p=>({...p,_contact:contacts.find(c=>(c.tel||[]).some(t=>normalizePhone(t)===normalizePhone(p.phone)))}));
  render();
 }catch(e){if(e?.name!=='AbortError')toast('Rehber izni alınamadı.')}
}
function normalizePhone(v){return String(v||'').replace(/[^0-9+]/g,'')}
function close(){backdrop?.remove();backdrop=null}
async function openSheet(){
 if(backdrop) return;
 backdrop=document.createElement('div');backdrop.className='wk-contact-backdrop';backdrop.innerHTML=`<section class="wk-contact-sheet" role="dialog" aria-modal="true"><div class="wk-contact-head"><div><h2>Yeni sohbet</h2><div class="wk-contact-note">Winkee kullanıcılarını kullanıcı adı veya görünen adıyla bul. Rehberden izin verdiğinde kayıtlı olanları da eşleştiririz.</div></div><button class="wk-contact-close" aria-label="Kapat">×</button></div><div class="wk-contact-search"><span>⌕</span><input autocomplete="off" placeholder="Kullanıcı ara..."/></div><div class="wk-contact-actions"><button class="wk-contact-action" data-contacts><strong>📱 Rehberden kişileri bul</strong><small>İzin ver, kayıtlı Winkee kişilerini eşleştirelim</small></button><button class="wk-contact-action" data-invite><strong>💜 Winkee’ye davet et</strong><small>WhatsApp, Mesajlar ve diğer uygulamalarda paylaş</small></button></div><div class="wk-contact-list"></div></section>`;
 document.body.appendChild(backdrop);backdrop.querySelector('.wk-contact-close').onclick=close;backdrop.onclick=e=>{if(e.target===backdrop)close()};backdrop.querySelector('[data-contacts]').onclick=importPhoneContacts;backdrop.querySelector('[data-invite]').onclick=()=>shareInvite();const input=backdrop.querySelector('input');input.oninput=()=>{query=input.value;clearTimeout(input._t);input._t=setTimeout(async()=>{registered=await searchUsers(query);render()},220)};render();setTimeout(()=>input.focus(),60);
}
function render(){const list=backdrop?.querySelector('.wk-contact-list');if(!list)return;if(query.trim()){if(!registered.length){list.innerHTML='<div class="wk-contact-empty">Bu isim/kullanıcı adıyla Winkee kullanıcısı bulunamadı.</div>';return}list.innerHTML=registered.map(p=>row(p,false)).join('');bindRows();return}if(contacts.length){const registeredIds=new Set(registered.map(p=>p.id));const rows=contacts.map(c=>{const p=registered.find(x=>x._contact&&x._contact.name?.join(' ')===c.name?.join(' '));return p?row(p,false):`<div class="wk-contact-row"><div class="wk-contact-avatar">👤</div><div class="wk-contact-copy"><strong>${esc((c.name||[]).join(' ')||'Kişi')}</strong><span>${esc((c.tel||[])[0]||'')}</span></div><button class="wk-contact-btn invite" data-invite-contact="${esc((c.name||[]).join(' '))}">Davet et</button></div>`}).join('');list.innerHTML=rows||'<div class="wk-contact-empty">Rehberinde kişi bulunamadı.</div>';bindRows();return}list.innerHTML='<div class="wk-contact-empty">Yukarıdan bir kullanıcı ara veya rehberini bağla.</div>'}
function row(p){return `<div class="wk-contact-row"><div class="wk-contact-avatar">${avatarHtml(p)}</div><div class="wk-contact-copy"><strong>${esc(p.display_name||p.username||'Winkee Kullanıcısı')}</strong><span>@${esc(p.username||'')}</span></div><button class="wk-contact-btn" data-user="${p.id}">Mesaj</button></div>`}
function bindRows(){backdrop?.querySelectorAll('[data-user]').forEach(b=>b.onclick=()=>{const p=registered.find(x=>x.id===b.dataset.user);if(p)createConversation(p)});backdrop?.querySelectorAll('[data-invite-contact]').forEach(b=>b.onclick=()=>shareInvite(b.dataset.inviteContact))}

function hook(){
 document.addEventListener('click',e=>{
  const target=e.target.closest?.('.plus,.quick-actions button');
  if(target){e.preventDefault();e.stopPropagation();openSheet();return}
  const people=e.target.closest?.('.tabs button');
  if(people&&people.textContent.trim()==='Kişiler'){e.preventDefault();e.stopPropagation();openSheet()}
 },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();

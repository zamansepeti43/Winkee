import { supabase, supabaseConfigured } from './lib/supabase';

const css = `
.wk-profile-hint{display:block;color:#9e94a8;font-size:12px;line-height:1.4;margin:-4px 0 10px}
.wk-profile-phone-wrap{margin-top:10px}.wk-profile-phone-label{display:block;color:#a79caf;font-size:13px;margin:0 0 7px}.wk-profile-phone-label span{color:#77707f}
.wk-profile-phone{width:100%;box-sizing:border-box;background:#0e0914;border:1px solid rgba(255,255,255,.08);color:#fff;border-radius:14px;padding:14px;outline:0;font:inherit}.wk-profile-phone:focus{border-color:#a632ff;box-shadow:0 0 0 3px rgba(166,50,255,.12)}
.wk-birth-label{display:block;color:#a79caf;font-size:13px;margin:0 0 7px}.wk-profile-saving{opacity:.7;pointer-events:none}
`;
document.head.appendChild(Object.assign(document.createElement('style'),{textContent:css}));

let cachedUser=null;
let cachedProfile=null;
let observer=null;

async function getProfile(){
  if(!supabaseConfigured)return null;
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return null;
  if(cachedUser?.id===user.id&&cachedProfile)return cachedProfile;
  cachedUser=user;
  let {data,error}=await supabase.from('profiles').select('*').eq('id',user.id).maybeSingle();
  if(error)return null;
  if(!data){
    const m=user.user_metadata||{};
    let username=String(m.username||user.email?.split('@')[0]||'kullanici').toLowerCase().replace(/[^a-z0-9_]/g,'').slice(0,24);
    if(username.length<3)username=(username+'user').slice(0,24);
    const r=await supabase.from('profiles').insert({id:user.id,username,display_name:m.display_name||'Winkee Kullanıcısı',birth_date:m.birth_date||null,avatar_url:'emoji:😉',bio:'',xp:0,coins:100,level:1}).select('*').maybeSingle();
    data=r.data||null;
  }
  cachedProfile=data?{...user,...data}:user;
  return cachedProfile;
}

function setInputValue(input,value){
  if(!input)return;
  const next=String(value??'');
  if(!input.value||input.dataset.wkHydrated!=='1')input.value=next;
  input.dataset.wkHydrated='1';
}

function updateProfilePage(profile){
  const page=document.querySelector('main.profile');
  if(!page||!profile)return;
  const display=profile.display_name||profile.username||'Winkee Kullanıcısı';
  const username=profile.username||'kullanici';
  const h1=page.querySelector('.profile-info h1');
  const sub=page.querySelector('.profile-info p');
  if(h1)h1.textContent=`${display} ✨`;
  if(sub)sub.textContent=`@${username}`;
  const stats=page.querySelectorAll('.stats span');
  if(stats[0]?.querySelector('b'))stats[0].querySelector('b').textContent=profile.xp??0;
  if(stats[1]?.querySelector('b'))stats[1].querySelector('b').textContent=profile.level??1;
  if(stats[2]?.querySelector('b'))stats[2].querySelector('b').textContent=profile.coins??100;
  const avatar=page.querySelector('.profile-avatar');
  if(avatar&&String(profile.avatar_url||'').startsWith('emoji:'))avatar.textContent=profile.avatar_url.slice(6)||'😉';
}

function addBirthLabel(){
  document.querySelectorAll('.auth-field input[type="date"]').forEach(input=>{
    input.setAttribute('aria-label','Doğum tarihi');input.setAttribute('title','Doğum tarihi');
    const field=input.closest('.auth-field');
    if(field&&!field.querySelector('.wk-birth-label')){
      const label=document.createElement('span');label.className='wk-birth-label';label.textContent='Doğum tarihi';field.insertBefore(label,input);
    }
  });
}

function findEditModal(){return [...document.querySelectorAll('.modal-card')].find(x=>/Profilini düzenle/i.test(x.textContent||''));}

function hydrateEditModal(profile){
  const modal=findEditModal();if(!modal||!profile)return;
  const inputs=[...modal.querySelectorAll('input')];const textareas=[...modal.querySelectorAll('textarea')];
  if(inputs.length>=2){
    setInputValue(inputs[0],profile.display_name||profile.username||'');setInputValue(inputs[1],profile.username||'');
    inputs[0].placeholder='Adın';inputs[1].placeholder='@kullanıcı adı';inputs[1].setAttribute('autocomplete','username');
  }
  if(textareas[0]){setInputValue(textareas[0],profile.bio||'');textareas[0].placeholder='Kendinden bahset...';}
  let phoneWrap=modal.querySelector('.wk-profile-phone-wrap');
  if(!phoneWrap){
    phoneWrap=document.createElement('div');phoneWrap.className='wk-profile-phone-wrap';
    phoneWrap.innerHTML='<label class="wk-profile-phone-label">Telefon numarası <span>(rehber eşleşmesi için)</span></label><input class="wk-profile-phone" type="tel" autocomplete="tel" placeholder="05xx xxx xx xx">';
    const bio=textareas[0];const save=[...modal.querySelectorAll('button')].find(b=>b.textContent.trim()==='Kaydet');
    if(bio?.parentElement)bio.parentElement.insertAdjacentElement('afterend',phoneWrap);else if(save?.parentElement)save.parentElement.insertBefore(phoneWrap,save);
  }
  setInputValue(phoneWrap.querySelector('input'),profile.phone||'');
  const usernameInput=inputs[1];
  if(usernameInput&&!modal.querySelector('.wk-profile-username-hint')){
    const hint=document.createElement('span');hint.className='wk-profile-hint wk-profile-username-hint';hint.textContent='Benzersiz @kullanıcı adın. Güvenlik için haftada 1 kez değiştirilebilir.';usernameInput.insertAdjacentElement('afterend',hint);
  }
  if(inputs[0]&&!modal.querySelector('.wk-profile-display-hint')){
    const hint=document.createElement('span');hint.className='wk-profile-hint wk-profile-display-hint';hint.textContent='Sohbetlerde ve profilinde başkalarının göreceği isim.';inputs[0].insertAdjacentElement('afterend',hint);
  }
}

async function saveEdit(){
  const modal=findEditModal();if(!modal||!supabaseConfigured)return false;
  const profile=await getProfile();if(!profile)return false;
  const inputs=[...modal.querySelectorAll('input')];const textareas=[...modal.querySelectorAll('textarea')];
  const displayName=(inputs[0]?.value||profile.display_name||'').trim();
  const username=(inputs[1]?.value||profile.username||'').trim().toLowerCase();
  const bio=(textareas[0]?.value||'').trim();
  const phone=(modal.querySelector('.wk-profile-phone')?.value||'').trim();
  if(!displayName){alert('Adını yazmalısın.');return true}
  if(!/^[a-z0-9_]{3,24}$/.test(username)){alert('Kullanıcı adı 3-24 karakter olmalı; sadece harf, rakam ve _ kullan.');return true}
  const save=[...modal.querySelectorAll('button')].find(b=>b.textContent.trim()==='Kaydet');
  if(save)save.classList.add('wk-profile-saving');
  try{
    const {data,error}=await supabase.rpc('update_winkee_profile',{p_display_name:displayName,p_username:username,p_bio:bio,p_avatar_url:profile.avatar_url||'emoji:😉',p_phone:phone});
    if(error)throw error;
    cachedProfile={...profile,...data};
    await supabase.auth.updateUser({data:{username:data.username,display_name:data.display_name,birth_date:data.birth_date}});
    modal.closest('.modal')?.remove();
    location.reload();
  }catch(e){alert(e?.message||'Profil kaydedilemedi.')}finally{if(save)save.classList.remove('wk-profile-saving')}
  return true;
}

function hookSave(){
  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('.modal-card button');
    if(!btn||btn.textContent.trim()!=='Kaydet')return;
    const modal=findEditModal();if(!modal)return;
    e.preventDefault();e.stopImmediatePropagation();saveEdit();
  },true);
}

async function hydrate(){
  addBirthLabel();
  const profile=await getProfile();if(!profile)return;
  updateProfilePage(profile);hydrateEditModal(profile);
}

function start(){
  hookSave();
  observer=new MutationObserver(()=>{clearTimeout(start._t);start._t=setTimeout(hydrate,60)});
  observer.observe(document.body,{subtree:true,childList:true});
  hydrate();
  if(supabaseConfigured)supabase.auth.onAuthStateChange(()=>{cachedUser=null;cachedProfile=null;setTimeout(hydrate,150)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();

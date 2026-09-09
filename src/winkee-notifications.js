import { supabase, supabaseConfigured } from './lib/supabase';

const VAPID_PUBLIC_KEY = 'BNTM9bxvkXEgggCq03NEvV9h7p-9vTW_K8V4cYXj5qnPlfkeLaHcEEJqdGGqnPhcdwGsH9JOydHqyw2og--APTE';
const css = `.wk-push{position:fixed;z-index:10001;left:50%;bottom:92px;transform:translateX(-50%);display:flex;align-items:center;gap:10px;background:#1b1224;border:1px solid #ffffff18;border-radius:16px;padding:10px 12px;box-shadow:0 14px 45px #0009;color:#fff;font:700 12px Inter,system-ui,sans-serif}.wk-push button{border:0;border-radius:11px;padding:9px 12px;background:linear-gradient(135deg,#9d39ff,#ff3fa8);color:#fff;font-weight:800}.wk-push button.x{background:#ffffff0b;padding:8px}`;
document.head.appendChild(Object.assign(document.createElement('style'), { textContent: css }));

function urlBase64ToUint8Array(base64String){const padding='='.repeat((4-base64String.length%4)%4);const raw=atob((base64String+padding).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));}
async function currentUser(){if(!supabaseConfigured)return null;const {data:{user}}=await supabase.auth.getUser();return user;}

async function registerPush(){
  if(!supabaseConfigured||!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))return false;
  const reg=await navigator.serviceWorker.register('/sw.js');
  if(Notification.permission!=='granted')return false;
  let sub=await reg.pushManager.getSubscription();
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)});
  const u=await currentUser();if(!u)return false;
  const {error}=await supabase.from('winkee_push_subscriptions').upsert({user_id:u.id,subscription:sub.toJSON()},{onConflict:'user_id,subscription'});
  if(error)console.error('Winkee push save',error);
  return !error;
}
async function enablePush(){
  if(!('Notification' in window)){alert('Bu tarayıcı bildirimleri desteklemiyor.');return;}
  const permission=await Notification.requestPermission();
  if(permission==='granted'){await registerPush();document.querySelector('.wk-push')?.remove();showToast('Bildirimler açıldı 🔔');}
}
function showToast(text){const el=document.createElement('div');el.textContent=text;Object.assign(el.style,{position:'fixed',zIndex:10002,left:'50%',bottom:'24px',transform:'translateX(-50%)',background:'#21172a',color:'#fff',border:'1px solid #ffffff18',borderRadius:'14px',padding:'12px 16px',boxShadow:'0 10px 30px #0008',font:'600 12px Inter,system-ui,sans-serif'});document.body.appendChild(el);setTimeout(()=>el.remove(),2600);}
function showPrompt(){if(document.querySelector('.wk-push')||Notification.permission==='granted'||Notification.permission==='denied')return;const el=document.createElement('div');el.className='wk-push';el.innerHTML='<span>🔔 Mesaj bildirimlerini aç</span><button>Bildirimleri aç</button><button class="x">×</button>';el.querySelector('button').onclick=enablePush;el.querySelector('.x').onclick=()=>el.remove();document.body.appendChild(el);}

async function sendPushToRecipients(message){
  if(!message?.id||message.sender_id!==(await currentUser())?.id)return;
  const key='winkee-pushed-'+message.id;if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');
  const {data:members,error}=await supabase.from('conversation_members').select('user_id').eq('conversation_id',message.conversation_id);
  if(error)return;
  const recipient_ids=(members||[]).map(x=>x.user_id).filter(Boolean).filter(id=>id!==message.sender_id);
  if(!recipient_ids.length)return;
  const {error:pushError}=await supabase.functions.invoke('winkee-push',{body:{recipient_ids,title:'Winkee 💜',body:message.body||'Yeni mesajın var.',url:`/?chat=${message.conversation_id}`}});
  if(pushError)console.error('Winkee push send',pushError);
}
async function notifyNewMessage(n){
  if(!n||n.user_id!==(await currentUser())?.id)return;
  if(Notification.permission!=='granted')return;
  const reg=await navigator.serviceWorker.getRegistration('/');
  if(reg)await reg.showNotification(n.title||'Winkee 💜',{body:n.body||'Yeni mesajın var.',icon:'/favicon.ico',badge:'/favicon.ico',data:{url:n.url||'/'},tag:'winkee-'+n.id});
}
async function start(){
  if(!supabaseConfigured)return;
  const u=await currentUser();if(!u)return;
  if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(console.error);
  if(Notification.permission==='granted')registerPush().catch(console.error);else setTimeout(showPrompt,1200);
  const notifications=supabase.channel('winkee-notifications-'+u.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'winkee_notifications',filter:`user_id=eq.${u.id}`},payload=>notifyNewMessage(payload.new)).subscribe();
  const messages=supabase.channel('winkee-message-push-'+u.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},payload=>sendPushToRecipients(payload.new)).subscribe();
  window.addEventListener('beforeunload',()=>{supabase.removeChannel(notifications);supabase.removeChannel(messages)});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();

import { supabase, supabaseConfigured } from './lib/supabase';

const css=`
html,body,#root{width:100%;min-height:100%;}
.app,.mobile-shell{min-height:100dvh;height:100dvh;}
.mobile-shell{overflow:hidden;}
.conversation{height:100dvh!important;min-height:0!important;max-height:100dvh!important;margin:0!important;padding:0!important;overflow:hidden;display:flex;flex-direction:column;}
.chat-header{flex:0 0 76px;height:76px;min-height:76px;}
.messages{flex:1 1 auto;min-height:0;height:auto;overflow-y:auto;overscroll-behavior:contain;padding:14px 14px 8px;}
.composer-tools{flex:0 0 auto;min-height:49px;padding:6px 12px 5px;}
.composer-tools button{flex:0 0 auto;}
.emoji-convert{flex:0 0 auto;max-height:142px;overflow:auto;margin:0 12px 5px;}
.composer{flex:0 0 54px;min-height:54px;margin:3px 12px 8px;}
.composer-tools,.emoji-convert,.composer{position:relative;z-index:20;}
.composer input{min-width:0;}
.bottom-nav{height:76px;padding:7px 12px max(7px,env(safe-area-inset-bottom));z-index:100;}
@media (max-width:600px){.conversation{height:100dvh!important;margin:0!important;padding:0!important;}.chat-header{padding-left:10px;padding-right:10px;}.messages{padding-left:12px;padding-right:12px;}.composer-tools{padding-left:12px;padding-right:12px;}.composer{margin-left:12px;margin-right:12px;}}
@media(min-width:700px){.conversation{height:100dvh!important;margin:0!important;padding:0!important}.bottom-nav{display:flex!important}.conversation .bottom-nav{display:flex!important}}
`;
const style=document.createElement('style');style.id='winkee-mobile-chat-fix';style.textContent=css;document.head.appendChild(style);

function reactInputValue(input,value){if(!input)return;const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;setter?.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}

async function findCurrentConversation(userId){const title=document.querySelector('.conversation .chat-title strong')?.textContent?.trim();if(!title)return null;const{data:mine,error:mineError}=await supabase.from('conversation_members').select('conversation_id').eq('user_id',userId);if(mineError||!mine?.length)return null;const ids=mine.map(x=>x.conversation_id);const{data:members,error:membersError}=await supabase.from('conversation_members').select('conversation_id,user_id').in('conversation_id',ids);if(membersError)return null;const otherIds=[...new Set((members||[]).filter(x=>x.user_id!==userId).map(x=>x.user_id))];if(!otherIds.length)return null;const{data:profiles}=await supabase.from('profiles').select('id,username,display_name').in('id',otherIds);const wanted=(profiles||[]).find(p=>p.display_name===title||p.username===title);if(!wanted)return null;const member=(members||[]).find(x=>x.user_id===wanted.id);return member?.conversation_id||null;}

function addSentBubble(body){const box=document.querySelector('.conversation .messages');if(!box)return;const row=document.createElement('div');row.className='msg mine wk-direct-message';row.innerHTML='<div class="bubble"></div>';const bubble=row.querySelector('.bubble');bubble.textContent=body;const meta=document.createElement('small');meta.textContent=new Intl.DateTimeFormat('tr-TR',{hour:'2-digit',minute:'2-digit'}).format(new Date());bubble.appendChild(meta);box.appendChild(row);box.scrollTop=box.scrollHeight;}

async function sendDirect(){if(!supabaseConfigured)return false;const input=document.querySelector('.conversation .composer input');const body=input?.value?.trim();if(!body)return false;const{data:{user}}=await supabase.auth.getUser();if(!user)return false;const conversationId=await findCurrentConversation(user.id);if(!conversationId)return false;const{error}=await supabase.from('messages').insert({conversation_id:conversationId,sender_id:user.id,body,message_type:'text'});if(error){console.error('Winkee send message',error);return false;}reactInputValue(input,'');addSentBubble(body);return true;}

function hookSend(){document.addEventListener('click',async e=>{const conv=e.target.closest?.('.conversation');if(!conv)return;const btn=e.target.closest?.('.composer .send');if(!btn)return;e.preventDefault();e.stopImmediatePropagation();if(btn.dataset.wkSending==='1')return;btn.dataset.wkSending='1';try{await sendDirect();}finally{btn.dataset.wkSending='0';}},true);document.addEventListener('keydown',async e=>{const input=e.target.closest?.('.conversation .composer input');if(!input||e.key!=='Enter'||e.shiftKey)return;e.preventDefault();e.stopImmediatePropagation();await sendDirect();},true);}

hookSend();

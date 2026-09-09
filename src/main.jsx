import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, Plus, MessageCircle, Gamepad2, Compass, UserRound, Send, Smile, Paperclip, Mic, MoreVertical, Phone, Video, Sparkles, Trophy, Users, Bell, Camera, ChevronRight, X, CheckCheck, Heart, Swords, Settings, Image, Volume2, Gift } from 'lucide-react';
import './styles.css';
import { supabase, supabaseConfigured } from './lib/supabase';

const chats = [
  {id:1,name:'Ayşe',emoji:'👩🏻',preview:'Yarın sinemaya gidelim mi? 🎬',time:'10:24',unread:2,online:true},
  {id:2,name:'Aile Grubu',emoji:'👨‍👩‍👧‍👦',preview:'Akşam oyun var mı? 😄',time:'09:51',unread:5,group:true},
  {id:3,name:'Mert',emoji:'🧑🏻',preview:'Tamamdır 👍',time:'09:12',unread:1,online:true},
  {id:4,name:'Zeynep',emoji:'👩🏻‍🦰',preview:'Bu emoji ne? 🎵🎬❓',time:'Dün',online:true},
  {id:5,name:'Oyun Kulübü',emoji:'🎮',preview:'Yeni oyun başladı! 🎯',time:'Dün',unread:3,group:true,game:true},
  {id:6,name:'Emre',emoji:'👨🏻',preview:'Görüşürüz 👋',time:'Pzt'},
  {id:7,name:'Selin',emoji:'👩🏼',preview:'Harika! 😍',time:'Pzt'},
  {id:8,name:'Film Severler',emoji:'🍿',preview:'Fotoğraf gönderdi',time:'Pzt',group:true}
];
const gameCatalog = [
  {name:'Emoji Tahmin',icon:'😉',desc:'Emojileri çöz, kelimeyi bul.',tone:'pink',answer:'Sinemaya gitmek'},
  {name:'Şarkı Tahmin',icon:'🎵',desc:'İpuçlarından şarkıyı yakala.',tone:'violet',answer:'Bir şarkı'},
  {name:'Film & Dizi',icon:'🎬',desc:'İpuçlarından yapımı bul.',tone:'blue',answer:'Sinema'},
  {name:'Deyim & Atasözü',icon:'💡',desc:'Anlamını bil, puanı kap.',tone:'orange',answer:'Deyim'},
  {name:'This or That',icon:'⚖️',desc:'İki seçenekten birini seç.',tone:'cyan',answer:'Seçimini yap'},
  {name:'Hızlı Quiz',icon:'🧠',desc:'10 soruda zirveye çık.',tone:'green',answer:'Doğru cevap'}
];
const quickEmojis=['😀','😂','😍','🥳','😎','🤔','😭','🔥','❤️','👍','🎉','🎮','🎬','🎵','🍿','👀','✨','💜','💯','🙌','👏','😴','🤩','😜','🫶','🚀','🎁','🏆'];
const starterMessages={1:[{id:'a1',text:'Nasılsın? 😊',mine:false,time:'10:15'},{id:'a2',text:'İyiyim, sen nasılsın?',mine:true,time:'10:16'},{id:'a3',text:'Harika! 🎉',mine:false,time:'10:16'},{id:'a4',text:'Yarın sinemaya gidelim mi?',mine:false,time:'10:17'},{id:'a5',text:'Olur! Hangi filmi izleyelim? 🎬',mine:true,time:'10:17'}],2:[{id:'b1',text:'Akşam oyun var mı? 😄',mine:false,time:'09:51'}],3:[{id:'c1',text:'Tamamdır 👍',mine:false,time:'09:12'}]};

function Logo(){return <div className="logo"><span className="logo-face">😉</span><span>Winkee</span></div>}
function Avatar({emoji='🙂',online=false,small=false}){return <div className={`avatar ${small?'small':''}`}>{emoji}<i className={online?'online':''}/></div>}
function Modal({children,onClose,wide=false}){return <div className="modal" onClick={onClose}><div className={`modal-card ${wide?'wide':''}`} onClick={e=>e.stopPropagation()}>{children}</div></div>}

function Chats({onOpen,onNew}){
 const [filter,setFilter]=useState('Tümü'); const [query,setQuery]=useState('');
 const list=useMemo(()=>chats.filter(c=>(filter==='Tümü'||(filter==='Gruplar'&&c.group)||(filter==='Kişiler'&&!c.group)||(filter==='Oyunlar'&&c.game))&&`${c.name} ${c.preview}`.toLowerCase().includes(query.toLowerCase())),[filter,query]);
 return <main className="page chats-page">
  <header className="topbar"><Logo/><div className="top-actions"><button title="Kamera"><Camera size={19}/></button><button onClick={()=>document.getElementById('chat-search')?.focus()}><Search size={20}/></button><button className="plus" onClick={onNew}><Plus size={21}/></button></div></header>
  <div className="searchbox"><Search size={17}/><input id="chat-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Sohbetlerde ara..."/></div>
  <div className="tabs">{['Tümü','Kişiler','Gruplar','Oyunlar'].map(x=><button className={filter===x?'active':''} onClick={()=>setFilter(x)} key={x}>{x}</button>)}</div>
  <section className="stories"><button className="story add-story" onClick={onNew}><div>＋</div><span>Yeni</span></button>{['👩🏻','🧑🏻','👩🏻‍🦰','👨🏻','👩🏼'].map((e,i)=><button className="story" key={i}><Avatar emoji={e} online/><span>{['Ayşe','Mert','Zeynep','Emre','Selin'][i]}</span></button>)}</section>
  <div className="section-title"><b>Mesajlar</b><span>{list.length} sohbet</span></div>
  <section className="chat-list">{list.map(c=><button className="chat-row" key={c.id} onClick={()=>onOpen(c)}><Avatar emoji={c.emoji} online={c.online}/><div className="chat-copy"><div><strong>{c.name}</strong><time>{c.time}</time></div><div><span>{c.preview}</span>{c.unread&&<em>{c.unread}</em>}</div></div></button>)}{!list.length&&<div className="empty">Sonuç bulunamadı 😶</div>}</section>
 </main>
}

function NewChat({onClose,onOpen}){
 const [q,setQ]=useState(''); const list=chats.filter(c=>c.name.toLowerCase().includes(q.toLowerCase()));
 return <Modal onClose={onClose}><button className="close" onClick={onClose}><X/></button><span className="eyebrow">YENİ SOHBET</span><h2>Kiminle konuşalım? 💜</h2><div className="searchbox compact"><Search size={17}/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="İsim ara..."/></div><div className="contact-list">{list.map(c=><button key={c.id} onClick={()=>onOpen(c)}><Avatar emoji={c.emoji} online={c.online} small/><span><b>{c.name}</b><small>{c.group?'Grup':'Çevrimiçi'}</small></span><ChevronRight size={17}/></button>)}</div></Modal>
}

function Conversation({chat,onBack,onStartGame}){
 const key=`winkee-messages-${chat.id}`;
 const initial=()=>{try{return JSON.parse(localStorage.getItem(key))||starterMessages[chat.id]||[]}catch{return starterMessages[chat.id]||[]}};
 const [messages,setMessages]=useState(initial); const [text,setText]=useState(''); const [emojiOpen,setEmojiOpen]=useState(false); const [attachOpen,setAttachOpen]=useState(false); const [typing,setTyping]=useState(false);
 useEffect(()=>{localStorage.setItem(key,JSON.stringify(messages))},[messages,key]);
 useEffect(()=>{if(!supabaseConfigured||!supabase)return; const channel=supabase.channel(`winkee-chat-${chat.id}`).on('broadcast',{event:'message'},({payload})=>{if(payload?.mine===false)setMessages(m=>[...m,payload])}).subscribe(); return()=>{supabase.removeChannel(channel)}},[chat.id]);
 const send=async(value=text)=>{const body=value.trim();if(!body)return;const msg={id:crypto.randomUUID?.()||Date.now(),text:body,mine:true,time:new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})};setMessages(m=>[...m,msg]);setText('');setEmojiOpen(false);setTyping(false);if(supabaseConfigured&&supabase){const ch=supabase.channel(`winkee-chat-${chat.id}`);await ch.subscribe();await ch.send({type:'broadcast',event:'message',payload:msg});await supabase.removeChannel(ch)}};
 const addEmoji=e=>setText(t=>t+e);
 const emojiGame=()=>{const msg={id:Date.now(),text:'🎬🍿👫❓',mine:true,time:'şimdi',game:true};setMessages(m=>[...m,msg]);setTyping(false)};
 return <main className="conversation page"><header className="chat-header"><button className="back" onClick={onBack}>‹</button><Avatar emoji={chat.emoji} online={chat.online}/><div><strong>{chat.name}</strong><small>{typing?'yazıyor...':chat.online?'Çevrimiçi':'Winkee kullanıcısı'}</small></div><div className="header-tools"><button title="Ara"><Phone size={19}/></button><button title="Görüntülü"><Video size={20}/></button><button><MoreVertical size={20}/></button></div></header>
 <div className="messages"><div className="date-pill">BUGÜN</div>{messages.map(m=><div className={`msg ${m.mine?'mine':''}`} key={m.id}><div className="bubble">{m.game?<div className="game-message"><div className="game-emoji">🎬🍿👫❓</div><b>Bu ne? 🤔</b><span>Emojiyi tahmin et!</span><button className="game-answer" onClick={()=>onStartGame(gameCatalog[0])}>🎯 Tahmin Et</button></div>:m.text}<small>{m.time} {m.mine&&<CheckCheck size={13}/>}</small></div></div>)}</div>
 <div className="composer-tools"><button onClick={emojiGame}><Sparkles size={17}/> Emojiyle anlat</button><button onClick={()=>onStartGame(gameCatalog[0])}><Gamepad2 size={17}/> Oyun başlat</button></div>
 {emojiOpen&&<div className="emoji-panel">{quickEmojis.map(e=><button key={e} onClick={()=>addEmoji(e)}>{e}</button>)}</div>}
 {attachOpen&&<div className="attach-panel"><button onClick={()=>setAttachOpen(false)}><Image/>Fotoğraf</button><button onClick={()=>setAttachOpen(false)}><Gift/>Hediye</button><button onClick={()=>setAttachOpen(false)}><Volume2/>Ses</button></div>}
 <div className="composer"><button onClick={()=>setAttachOpen(v=>!v)}><Paperclip size={21}/></button><input value={text} onChange={e=>{setText(e.target.value);setTyping(Boolean(e.target.value))}} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Mesaj yaz..."/><button onClick={()=>setEmojiOpen(v=>!v)}><Smile size={21}/></button>{text?<button className="send" onClick={()=>send()}><Send size={19}/></button>:<button><Mic size={21}/></button>}</div>
 </main>
}

function GameModal({game,onClose}){
 const [choice,setChoice]=useState(null); const [done,setDone]=useState(false); const options=game.name==='This or That'?['🍕 Pizza','🍔 Burger']:game.name==='Emoji Tahmin'?['Sinemaya gitmek','Tatile gitmek','Oyun oynamak']:['A','B','C','D'];
 const answer=game.name==='Emoji Tahmin'?'Sinemaya gitmek':options[0];
 const choose=o=>{setChoice(o);setDone(true)};
 return <Modal onClose={onClose}><button className="close" onClick={onClose}><X/></button><div className="big-emoji">{game.icon}</div><span className="eyebrow">WİNKEE OYUNU</span><h2>{game.name}</h2>{!done?<><p>{game.desc}</p><div className="question">{game.name==='Emoji Tahmin'?'🎬 🍿 👫 ❓':'Hazır mısın? En iyi seçimi yap!'}</div><div className="answer-grid">{options.map(o=><button key={o} onClick={()=>choose(o)}>{o}</button>)}</div></>:<div className="result"><div className="result-emoji">{choice===answer?'🎉':'😄'}</div><h3>{choice===answer?'Doğru! +30 XP':'Güzel seçim! +10 XP'}</h3><p>{choice===answer?'Seriyi devam ettir.':'Bir sonraki turda yakalarsın.'}</p><button className="primary" onClick={onClose}>Devam Et <Swords size={18}/></button></div>}</Modal>
}

function Games({onPlay}){return <main className="page games-page"><header className="topbar"><Logo/><div className="coin">🪙 <b>1.250</b></div></header><div className="hero-game"><div className="confetti">✦　✧　✦</div><span>BUGÜNÜN WİNKEE'Sİ</span><h1>Oyna, tahmin et,<br/><b>eğlen! 😉</b></h1><p>Arkadaşlarınla kapış, puanını yükselt.</p><button onClick={()=>onPlay(gameCatalog[0])}>⚡ Hızlı Oyun</button></div><section><div className="section-title"><b>Popüler Oyunlar</b><span>6 oyun</span></div><div className="game-grid">{gameCatalog.map(g=><button className={`game-card ${g.tone}`} key={g.name} onClick={()=>onPlay(g)}><span className="game-icon">{g.icon}</span><b>{g.name}</b><small>{g.desc}</small><span className="play">Oyna →</span></button>)}</div></section><section className="daily"><div><span>🎁 GÜNLÜK GÖREV</span><h3>5 oyunda 30 puan kazan</h3><div className="progress"><i/></div><small>2 / 5 tamamlandı</small></div><Trophy size={43}/></section></main>}

function Discover(){const [liked,setLiked]=useState({});const [counts,setCounts]=useState({1:124,2:98});const like=id=>{setLiked(l=>({...l,[id]:!l[id]}));setCounts(c=>({...c,[id]:c[id]+(liked[id]?-1:1)}))};const posts=[{id:1,user:'Selin',emoji:'👩🏼',text:'Bu emojinin anlamını kim biliyor? 🤔',art:'🍃 🏠 ❤️',comments:42},{id:2,user:'Mert',emoji:'🧑🏻',text:'Hangi şarkı? 🎵 Tahmin edebilen var mı?',art:'🎵 🌙 ⭐',comments:31}];return <main className="page discover"><header className="topbar"><Logo/><button className="iconbtn"><Bell size={20}/></button></header><div className="discover-hero"><span>✨ KEŞFET</span><h1>Winkee dünyasında<br/><b>ne var ne yok?</b></h1></div>{posts.map(p=><article className="feed-card" key={p.id}><div className="feed-head"><Avatar emoji={p.emoji} online={p.id===1} small/><div><b>{p.user}</b><small>{p.id===1?'2 saat':'5 saat'} önce</small></div><button>•••</button></div><p>{p.text}</p><div className="emoji-post">{p.art}</div><div className="feed-actions"><button className={liked[p.id]?'liked':''} onClick={()=>like(p.id)}><Heart size={18}/>{counts[p.id]}</button><button><MessageCircle size={18}/>{p.comments}</button><button>↗ Paylaş</button></div></article>)}</main>}

function Profile({onMenu}){return <main className="page profile"><div className="profile-cover"><div className="profile-top"><Logo/><button className="iconbtn" onClick={()=>onMenu('Ayarlar')}><Settings/></button></div><div className="profile-avatar">😎</div><h1>PATRON</h1><p>@winkee_patron</p><div className="level"><b>Seviye 12</b><span>1.840 / 2.500 XP</span><div><i/></div></div></div><div className="stats"><div><b>128</b><span>Arkadaş</span></div><div><b>1.840</b><span>XP</span></div><div><b>24</b><span>Rozet</span></div></div><div className="profile-menu">{[[Users,'Arkadaşlar'],[Gamepad2,'Oyun Geçmişi'],[Trophy,'Rozetler'],[Bell,'Bildirimler'],[Settings,'Ayarlar']].map(([I,t])=><button key={t} onClick={()=>onMenu(t)}><I size={20}/><span>{t}</span><ChevronRight size={17}/></button>)}</div></main>}

function InfoModal({title,onClose}){return <Modal onClose={onClose}><button className="close" onClick={onClose}><X/></button><span className="eyebrow">WİNKEE</span><h2>{title}</h2>{title==='Arkadaşlar'?<div className="contact-list">{chats.slice(0,5).map(c=><div className="contact-static" key={c.id}><Avatar emoji={c.emoji} online={c.online} small/><span><b>{c.name}</b><small>Arkadaş</small></span><button>Mesaj</button></div>)}</div>:title==='Ayarlar'?<div className="settings-list"><label>Bildirimler <input type="checkbox" defaultChecked/></label><label>Sesler <input type="checkbox" defaultChecked/></label><label>Çevrimiçi görün <input type="checkbox" defaultChecked/></label><label>Koyu tema <input type="checkbox" defaultChecked/></label></div>:<div className="info-big">🏆<p>Bu bölüm Winkee ilerlemeni ve başarılarını gösterecek.</p></div>}</Modal>}

function App(){const [tab,setTab]=useState('chat');const [chat,setChat]=useState(null);const [modal,setModal]=useState(null);const [newChat,setNewChat]=useState(false);const openChat=c=>{setChat(c);setNewChat(false)};return <div className="app"><div className="mobile-shell">{chat?<Conversation chat={chat} onBack={()=>setChat(null)} onStartGame={g=>setModal({type:'game',game:g})}/>:tab==='chat'?<Chats onOpen={openChat} onNew={()=>setNewChat(true)}/>:tab==='games'?<Games onPlay={g=>setModal({type:'game',game:g})}/>:tab==='discover'?<Discover/>:<Profile onMenu={t=>setModal({type:'info',title:t})}/>}<nav className="bottom-nav"><button className={tab==='chat'?'active':''} onClick={()=>{setChat(null);setTab('chat')}}><MessageCircle/><span>Sohbet</span></button><button className={tab==='games'?'active':''} onClick={()=>{setChat(null);setTab('games')}}><Gamepad2/><span>Oyunlar</span></button><button className="nav-plus" onClick={()=>setNewChat(true)}><Plus/></button><button className={tab==='discover'?'active':''} onClick={()=>{setChat(null);setTab('discover')}}><Compass/><span>Keşfet</span></button><button className={tab==='profile'?'active':''} onClick={()=>{setChat(null);setTab('profile')}}><UserRound/><span>Profil</span></button></nav>{newChat&&<NewChat onClose={()=>setNewChat(false)} onOpen={openChat}/>} {modal?.type==='game'&&<GameModal game={modal.game} onClose={()=>setModal(null)}/>} {modal?.type==='info'&&<InfoModal title={modal.title} onClose={()=>setModal(null)}/>}</div></div>}

createRoot(document.getElementById('root')).render(<App/>);

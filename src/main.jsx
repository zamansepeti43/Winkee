import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, Plus, MessageCircle, Gamepad2, Compass, UserRound, Send, Smile, Paperclip, Mic, MoreVertical, Phone, Video, Sparkles, Trophy, Users, Bell, Camera, ChevronRight, X, CheckCheck, Heart, Swords, Film, Music2, Lightbulb, Brain, Vote, Zap } from 'lucide-react';
import './styles.css';

const chats = [
  {id:1,name:'Ayşe',emoji:'👩🏻',preview:'Yarın sinemaya gidelim mi? 🎬',time:'10:24',unread:2,online:true},
  {id:2,name:'Aile Grubu',emoji:'👨‍👩‍👧‍👦',preview:'Akşam oyun var mı? 😄',time:'09:51',unread:5,group:true},
  {id:3,name:'Mert',emoji:'🧑🏻',preview:'Tamamdır 👍',time:'09:12',unread:1,online:true},
  {id:4,name:'Zeynep',emoji:'👩🏻‍🦰',preview:'Bu emoji ne? 🎵🎬❓',time:'Dün',online:true},
  {id:5,name:'Oyun Kulübü',emoji:'🎮',preview:'Yeni oyun başladı! 🎯',time:'Dün',unread:3,group:true},
  {id:6,name:'Emre',emoji:'👨🏻',preview:'Görüşürüz 👋',time:'Pzt'},
  {id:7,name:'Selin',emoji:'👩🏼',preview:'Harika! 😍',time:'Pzt'},
  {id:8,name:'Film Severler',emoji:'🍿',preview:'Fotoğraf gönderdi',time:'Pzt',group:true}
];
const games = [
  {name:'Emoji Tahmin',icon:'😉',desc:'Emojileri çöz, kelimeyi bul.',tone:'pink'},
  {name:'Şarkı Tahmin',icon:'🎵',desc:'İpuçlarından şarkıyı yakala.',tone:'violet'},
  {name:'Film & Dizi',icon:'🎬',desc:'Sahneyi gör, yapımı bul.',tone:'blue'},
  {name:'Deyim & Atasözü',icon:'💡',desc:'Anlamını bil, puanı kap.',tone:'orange'},
  {name:'This or That',icon:'⚖️',desc:'İki seçenekten birini seç.',tone:'cyan'},
  {name:'Hızlı Quiz',icon:'🧠',desc:'10 soruda zirveye çık.',tone:'green'}
];

function Logo(){return <div className="logo"><span className="logo-face">😉</span><span>Winkee</span></div>}
function Avatar({emoji='🙂',online=false,small=false}){return <div className={`avatar ${small?'small':''}`}>{emoji}<i className={online?'online':''}/></div>}

function Chats({onOpen}){
 const [filter,setFilter]=useState('Tümü'); const [query,setQuery]=useState('');
 const list=useMemo(()=>chats.filter(c=>(filter==='Tümü'||(filter==='Gruplar'&&c.group)||(filter==='Kişiler'&&!c.group)||(filter==='Oyunlar'&&c.name.includes('Oyun')))&&c.name.toLowerCase().includes(query.toLowerCase())),[filter,query]);
 return <main className="page chats-page">
   <header className="topbar"><Logo/><div className="top-actions"><button><Camera size={19}/></button><button onClick={()=>document.getElementById('search').focus()}><Search size={20}/></button><button className="plus"><Plus size={21}/></button></div></header>
   <div className="searchbox"><Search size={17}/><input id="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Sohbetlerde ara..."/></div>
   <div className="tabs">{['Tümü','Kişiler','Gruplar','Oyunlar'].map(x=><button className={filter===x?'active':''} onClick={()=>setFilter(x)} key={x}>{x}</button>)}</div>
   <section className="stories"><div className="story add-story"><div>＋</div><span>Hikayen</span></div>{['👩🏻','🧑🏻','👩🏻‍🦰','👨🏻','👩🏼'].map((e,i)=><div className="story" key={i}><Avatar emoji={e} online/><span>{['Ayşe','Mert','Zeynep','Emre','Selin'][i]}</span></div>)}</section>
   <div className="section-title"><b>Mesajlar</b><span>{list.length} sohbet</span></div>
   <section className="chat-list">{list.map(c=><button className="chat-row" key={c.id} onClick={()=>onOpen(c)}><Avatar emoji={c.emoji} online={c.online}/><div className="chat-copy"><div><strong>{c.name}</strong><time>{c.time}</time></div><div><span>{c.preview}</span>{c.unread&&<em>{c.unread}</em>}</div></div></button>)}</section>
 </main>
}

function Conversation({chat,onBack}){
 const [messages,setMessages]=useState([{id:1,text:'Nasılsın? 😊',mine:false,time:'10:15'},{id:2,text:'İyiyim, sen nasılsın?',mine:true,time:'10:16'},{id:3,text:'Harika! 🎉',mine:false,time:'10:16'},{id:4,text:'Yarın sinemaya gidelim mi?',mine:false,time:'10:17'},{id:5,text:'Olur! Hangi filmi izleyelim? 🎬',mine:true,time:'10:17'}]);
 const [text,setText]=useState(''); const send=()=>{if(!text.trim())return;setMessages(m=>[...m,{id:Date.now(),text:text.trim(),mine:true,time:new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}]);setText('')};
 const emojiGame=()=>{setMessages(m=>[...m,{id:Date.now(),text:'🎬🍿👫❓',mine:true,time:'şimdi',game:true}])};
 return <main className="conversation page"><header className="chat-header"><button className="back" onClick={onBack}>‹</button><Avatar emoji={chat.emoji} online/><div><strong>{chat.name}</strong><small>{chat.online?'Çevrimiçi':'Winkee kullanıcısı'}</small></div><div className="header-tools"><button><Phone size={19}/></button><button><Video size={20}/></button><button><MoreVertical size={20}/></button></div></header>
 <div className="messages"><div className="date-pill">BUGÜN</div>{messages.map(m=><div className={`msg ${m.mine?'mine':''}`} key={m.id}><div className="bubble">{m.game?<div className="game-message"><div className="game-emoji">🎬🍿👫❓</div><b>Bu ne?</b><span>Tahmin et!</span><div className="game-options"><button>Film</button><button>Etkinlik</button><button>Diğer</button></div></div>:m.text}<small>{m.time} {m.mine&&<CheckCheck size={13}/>}</small></div></div>)}</div>
 <div className="composer-tools"><button onClick={emojiGame} title="Emojiyle anlat"><Sparkles size={17}/> Emojiyle anlat</button><button><Gamepad2 size={17}/> Oyun başlat</button></div>
 <div className="composer"><button><Paperclip size={21}/></button><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Mesaj yaz..."/><button><Smile size={21}/></button>{text?<button className="send" onClick={send}><Send size={19}/></button>:<button><Mic size={21}/></button>}</div>
 </main>
}

function Games(){const [selected,setSelected]=useState(null); return <main className="page games-page"><header className="topbar"><Logo/><div className="coin">🪙 <b>1.250</b></div></header><div className="hero-game"><div className="confetti">✦　✧　✦</div><span>BUGÜNÜN WİNKEE'Sİ</span><h1>Oyna, tahmin et,<br/><b>eğlen! 😉</b></h1><p>Arkadaşlarınla kapış, puanını yükselt.</p><button onClick={()=>setSelected(games[0])}>⚡ Hızlı Oyun</button></div><section><div className="section-title"><b>Popüler Oyunlar</b><button>Tümünü gör <ChevronRight size={16}/></button></div><div className="game-grid">{games.map(g=><button className={`game-card ${g.tone}`} key={g.name} onClick={()=>setSelected(g)}><span className="game-icon">{g.icon}</span><b>{g.name}</b><small>{g.desc}</small><span className="play">Oyna →</span></button>)}</div></section><section className="daily"><div><span>🎁 GÜNLÜK GÖREV</span><h3>5 oyunda 30 puan kazan</h3><div className="progress"><i/></div><small>2 / 5 tamamlandı</small></div><Trophy size={43}/></section>{selected&&<div className="modal" onClick={()=>setSelected(null)}><div className="modal-card" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}><X/></button><div className="big-emoji">{selected.icon}</div><span className="eyebrow">WİNKEE OYUNU</span><h2>{selected.name}</h2><p>{selected.desc}</p><button className="primary">Arkadaşlarınla Başlat <Swords size={18}/></button></div></div>}</main>}

function Discover(){return <main className="page discover"><header className="topbar"><Logo/><button className="iconbtn"><Bell size={20}/></button></header><div className="discover-hero"><span>✨ KEŞFET</span><h1>Winkee dünyasında<br/><b>ne var ne yok?</b></h1></div><div className="feed-card"><div className="feed-head"><Avatar emoji="👩🏼" online small/><div><b>Selin</b><small>2 saat önce</small></div><button>•••</button></div><p>Bu emojinin anlamını kim biliyor? 🤔</p><div className="emoji-post">🍃 🏠 ❤️</div><div className="feed-actions"><span><Heart size={18}/>124</span><span><MessageCircle size={18}/>42</span><span>↗ Paylaş</span></div></div><div className="feed-card"><div className="feed-head"><Avatar emoji="🧑🏻" small/><div><b>Mert</b><small>5 saat önce</small></div></div><p>Hangi şarkı? 🎵 Tahmin edebilen var mı?</p><div className="emoji-post">🎵 🌙 ⭐</div><div className="feed-actions"><span><Heart size={18}/>98</span><span><MessageCircle size={18}/>31</span><span>↗ Paylaş</span></div></div></main>}

function Profile(){return <main className="page profile"><div className="profile-cover"><div className="profile-top"><Logo/><button className="iconbtn"><MoreVertical/></button></div><div className="profile-avatar">😎</div><h1>PATRON</h1><p>@winkee_patron</p><div className="level"><b>Seviye 12</b><span>1.840 / 2.500 XP</span><div><i/></div></div></div><div className="stats"><div><b>128</b><span>Arkadaş</span></div><div><b>1.840</b><span>XP</span></div><div><b>24</b><span>Rozet</span></div></div><div className="profile-menu">{[[Users,'Arkadaşlar'],[Gamepad2,'Oyun Geçmişi'],[Trophy,'Rozetler'],[Bell,'Bildirimler'],[Zap,'Ayarlar']].map(([I,t])=><button key={t}><I size={20}/><span>{t}</span><ChevronRight size={17}/></button>)}</div></main>}

function App(){const [tab,setTab]=useState('chat');const [chat,setChat]=useState(null); return <div className="app"><div className="mobile-shell">{chat?<Conversation chat={chat} onBack={()=>setChat(null)}/>:tab==='chat'?<Chats onOpen={setChat}/>:tab==='games'?<Games/>:tab==='discover'?<Discover/>:<Profile/>}<nav className="bottom-nav"><button className={tab==='chat'?'active':''} onClick={()=>{setChat(null);setTab('chat')}}><MessageCircle/><span>Sohbet</span></button><button className={tab==='games'?'active':''} onClick={()=>{setChat(null);setTab('games')}}><Gamepad2/><span>Oyunlar</span></button><button className="nav-plus" onClick={()=>setTab('games')}><Plus/></button><button className={tab==='discover'?'active':''} onClick={()=>{setChat(null);setTab('discover')}}><Compass/><span>Keşfet</span></button><button className={tab==='profile'?'active':''} onClick={()=>{setChat(null);setTab('profile')}}><UserRound/><span>Profil</span></button></nav></div></div>}

createRoot(document.getElementById('root')).render(<App/>);

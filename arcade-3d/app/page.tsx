'use client';
import {useState,useEffect,useRef,type CSSProperties} from 'react';
import FishingPond from '@/components/game/FishingPond';
import FrogGarden from '@/components/game/FrogGarden';
import SkyDash from '@/components/game/SkyDash';
import ArcadeWorld3D from '@/components/game/ArcadeWorld3D';
import {gameLooks} from '@/lib/game-look';
import {games,reactions,type GameView} from '@/lib/game';
const safeStore={getItem:(key:string)=>{try{const v=localStorage.getItem(key);if(v)return v;}catch{}try{return sessionStorage.getItem(key);}catch{return null;}},setItem:(key:string,value:string)=>{try{localStorage.setItem(key,value);}catch{try{sessionStorage.setItem(key,value);}catch{}}},removeItem:(key:string)=>{try{localStorage.removeItem(key);}catch{}try{sessionStorage.removeItem(key);}catch{}}};
type Reply={state:GameView,code:string,token?:string,serverTime:number,error?:string,revision:number};

export default function Home(){
 const [s,setS]=useState<GameView|null>(null),[name,setName]=useState(''),[code,setCode]=useState(''),[entry,setEntry]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[now,setNow]=useState(0),[copied,setCopied]=useState(false),[selected,setSelected]=useState('fishing'),[restoring,setRestoring]=useState(true),[connected,setConnected]=useState(true);
 const auth=useRef({code:'',token:''}),offset=useRef(0),current=useRef<GameView|null>(null),lastVersion=useRef(-1),commandFlight=useRef(false),lastPing=useRef(0),lastNetwork=useRef(0),minimumRtt=useRef(Infinity);
 const apply=(d:Reply)=>{if(d.code!==auth.current.code||d.revision<lastVersion.current)return;const v=d.state;if(current.current&&v.round<current.current.round)return;lastVersion.current=d.revision;current.current=v;setS(v);setSelected(v.game);};
 async function api(action:string,extra:Record<string,unknown>={}){
  const sent=Date.now(),abort=new AbortController(),timer=setTimeout(()=>abort.abort(),8000);
  try{const r=await fetch('/api/game',{method:'POST',headers:{'Content-Type':'application/json'},signal:abort.signal,body:JSON.stringify({action,...auth.current,round:current.current?.round,...extra})});const d=await r.json() as Reply;
   if(!r.ok)throw Error(d.error||'Could not connect. Please try again.');const elapsed=Date.now()-sent;if(elapsed<=minimumRtt.current+30){minimumRtt.current=Math.min(elapsed,minimumRtt.current);offset.current=d.serverTime-(sent+Date.now())/2;}
   lastNetwork.current=Date.now();setConnected(true);return d;
  }catch(e){if(e instanceof Error&&e.name==='AbortError')throw Error('Connection timed out. Your room is saved.');throw e;}finally{clearTimeout(timer);}
 }
 async function action(a:string,extra:Record<string,unknown>={}){
  if(commandFlight.current)return false;commandFlight.current=true;setBusy(true);
  try{apply(await api(a,{expected:current.current?.moves,requestId:crypto.randomUUID(),...extra}));setError('');return true;}catch(e){setError((e as Error).message);return false;}finally{setBusy(false);commandFlight.current=false;}
 }
 async function enter(a:string){
  if(restoring)return;if(!name.trim()){setError('Add your name first.');return;}if(commandFlight.current)return;commandFlight.current=true;setBusy(true);
  try{const d=await api(a,{name,code:entry.trim().toUpperCase()});auth.current={code:d.code,token:d.token!};lastVersion.current=-1;safeStore.setItem('tap-together-session',JSON.stringify(auth.current));safeStore.setItem('tap-together-name',name);setCode(d.code);apply(d);if(a==='create'&&selected!=='race')apply(await api('select',{game:selected,requestId:crypto.randomUUID()}));setError('');}catch(e){setError((e as Error).message);}finally{setBusy(false);commandFlight.current=false;}
 }
 useEffect(()=>{
  const invite=new URLSearchParams(location.search).get('room')||'';setEntry(invite);setName(safeStore.getItem('tap-together-name')||'');const saved=safeStore.getItem('tap-together-session');
  if(saved){try{const value=JSON.parse(saved);if(typeof value.code!=='string'||typeof value.token!=='string')throw Error('Invalid saved room');if(!invite||invite.toUpperCase()===value.code){auth.current=value;api('state',{heartbeat:true}).then(d=>{if(auth.current.code!==value.code)return;setCode(d.code);apply(d);safeStore.setItem('tap-together-session',saved);}).catch(()=>{auth.current={code:'',token:''};setError('Your saved room could not be reopened. Check your connection, or create a new room.');}).finally(()=>setRestoring(false));}else setRestoring(false);}catch{setRestoring(false);safeStore.removeItem('tap-together-session');}}else setRestoring(false);
  setNow(Date.now());const timer=setInterval(()=>{setNow(Date.now()+offset.current);if(auth.current.code&&lastNetwork.current&&Date.now()-lastNetwork.current>12000)setConnected(false);},80);return()=>clearInterval(timer);
 },[]);
 useEffect(()=>{
  if(!code)return;let stop=false,timer:ReturnType<typeof setTimeout>,failures=0;
  async function poll(){if(stop)return;try{const heartbeat=Date.now()-lastPing.current>15000;const d=await api('state',{heartbeat});if(heartbeat)lastPing.current=Date.now();if(!stop)apply(d);failures=0;}catch{failures++;if(!stop)setConnected(false);}
   if(!stop){const v=current.current,delay=document.hidden?10000:failures?Math.min(6000,1000*failures):v?.start&&!v.finished?500:1800;timer=setTimeout(poll,delay);}}
  poll();return()=>{stop=true;clearTimeout(timer);};
 },[code]);
 async function runMove(value:string){try{apply(await api('run',{value,requestId:crypto.randomUUID()}));setError('');}catch(e){setError((e as Error).message);}}
 useEffect(()=>{const ctx=(document as Document&{modelContext?:{registerTool:(t:unknown,o:unknown)=>unknown}}).modelContext;if(!ctx?.registerTool)return;const life=new AbortController();Promise.resolve(ctx.registerTool({name:'read_game_room',description:'Read this room’s game, scores and round state.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({room:auth.current.code,state:current.current})},{signal:life.signal})).catch(()=>{});return()=>life.abort();},[]);
 const game=games.find(g=>g.id===(s?.game||selected))||games[0],playing=!!s?.start&&!s.finished,go=playing&&now>=s!.start,me=s?.players[s.me],isTurn=s?.turn===s?.me,turnGame=['ttt','connect','memory','number'].includes(game.id),remaining=s?.deadline?Math.max(0,Math.ceil((s.deadline-now)/1000)):0;
 const outcome=!s?'':s.winner===-3?'Round ended together':s.winner===-2?s.game==='garden'?'Garden goal complete! You both win 🌸':'Same wavelength! You both win 💗':s.winner===-1?s.game==='garden'?'Garden session complete. Try for 12 flowers next time.':s.game==='sync'?'Different picks. Still a good team.':'It’s a tie!':`${s.players[s.winner!]?.name} wins!`;
 const status=!s?game.id==='fishing'?'Start a solo fishing round below, or invite your partner.':game.id==='garden'?'Your solo garden is ready. Create a room to grow together.':'Create a room or join your partner.':s.finished?outcome:s.players.length<2?'Waiting for your favourite person…':!s.start?'Both ready? Let’s play.':!go?s.game==='reaction'?'Wait for green…':`Starting in ${Math.max(1,Math.ceil((s.start-now)/1000))}`:turnGame?isTurn?'Your turn!':`${s.players[s.turn]?.name}’s turn`:s.game==='reaction'?'GO! Tap now!':'Your move. Make it count!';
 async function share(){try{await navigator.clipboard.writeText(`${location.origin}/?room=${code}`);setCopied(true);setTimeout(()=>setCopied(false),2500);}catch{setError(`Share this room code: ${code}`);}}
 function leave(){safeStore.removeItem('tap-together-session');location.href=location.pathname;}
 function pick(id:string,reveal=false){setError('');const show=()=>{if(reveal)document.getElementById('play-area')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});};if(id===game.id){show();return;}if(s)void action('select',{game:id}).then(ok=>{if(ok)show();});else{setSelected(id);show();}}
 function openRoom(){document.getElementById('room-setup')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});document.getElementById('name')?.focus({preventScroll:true});}
 const waitingChoice=['rps','sync'].includes(game.id)&&!!me?.choice&&!s?.finished;
 return <main className="sky-mode arcade-shell" data-game={game.id} style={{'--game-accent':gameLooks[game.id].accent,'--game-tint':gameLooks[game.id].bg} as CSSProperties}>
  <a href="#play-area" className="skip-link">Skip to game</a>
  <header><a className="brand" href="/">tap<span>together</span><i>✦</i></a><nav aria-label="Main navigation"><a href="#game-library">All games</a><button onClick={openRoom}>{s?'Your room':'Play together'}</button></nav></header>
  <div className="intro compact-intro"><div><div className="eyebrow">YOUR LITTLE ARCADE</div><h1>A little play. <em>A lot closer.</em></h1></div><span className="online-label">12 games · 3 solo modes</span></div>
  <nav className="game-switcher" aria-label="Choose a game">{games.map(g=><button key={g.id} aria-pressed={game.id===g.id} disabled={restoring||busy||!!s&&(s.me!==0||playing)} onClick={()=>pick(g.id)}><span aria-hidden="true">{g.icon}</span>{gameLooks[g.id].name}</button>)}</nav>
  {s&&(s.me!==0||playing)&&<p className="switch-help">{playing?'Finish the round to switch games.':'Your partner chooses the next game between rounds.'}</p>}
  <div className="workspace">
   <section id="play-area" tabIndex={-1} className="arena" aria-label="Game table">
    <div className="arena-top"><span>{gameLooks[game.id].world}</span><span>{s?`ROUND ${s.round}`:'PICK YOUR FIRST GAME'}</span></div>
    <div className="game-title"><div><h2>{game.title}</h2><p className="game-desc">{game.desc}</p></div><span className="title-emoji" aria-hidden="true">{game.icon}</span></div>
    {s&&<div className="score-strip">{[0,1].map(i=><div key={i} className={s.me===i?'you-score':''}><span>{i===0?'🐇':'🐢'} {s.players[i]?.name||'Waiting…'}{s.me===i?' · you':''}</span><b>{s.players[i]?.score||0}<small> pts</small></b></div>)}</div>}
    <div className="play-mode"><span>{s?'ONLINE · 2 PLAYERS':['race','garden','fishing'].includes(game.id)?'SOLO AVAILABLE':'ONLINE · 2 PLAYERS'}</span>{!s&&<button onClick={openRoom}>Invite your partner ↗</button>}</div>
    <div className={`status ${s?.finished?'win':''}`} role="status">{restoring?'Checking your saved room…':status}</div>
    {playing&&go&&<div className="round-meta"><span>{turnGame?(isTurn?'You’re up':'Partner’s turn'):'Both players are playing'}</span><span>{Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')} left</span></div>}
    {game.id==='race'&&<SkyDash state={s} now={now} onMove={runMove}/>}
    {game.id==='fishing'&&<FishingPond state={s} now={now} busy={busy} onAction={action}/>}
    {game.id==='garden'&&<FrogGarden state={s} now={now} busy={busy} onAction={action}/>}
    {game.id!=='race'&&game.id!=='garden'&&game.id!=='fishing'&&<ArcadeWorld3D game={game.id} state={s} now={now} busy={busy} onAction={action}/>}
    {waitingChoice&&<p className="hint">Your choice is locked. Waiting for your partner.</p>}
    {s?.finished&&<div className="results">{['rps','sync'].includes(s.game)&&s.players.map((p,i)=><span key={i}>{p.name}: {p.choice||'No choice'}</span>)}{s.game==='reaction'&&s.players.map((p,i)=><span key={i}>{p.name}: {p.reaction===null?'No tap':p.reaction===99999?'Too early':`${p.reaction} ms`}</span>)}<div className="celebrate">✦ &nbsp; ♡ &nbsp; ✦</div></div>}
    {!s?<button className="primary play" onClick={openRoom}>{['garden','race','fishing'].includes(game.id)?'Play online with your partner':'Set up your two-player room'}</button>:(!s.start||s.finished)?<button className="primary play" disabled={busy||(!s.finished&&!!me?.ready)} onClick={()=>action('ready')}>{s.finished?'Play another round ↻':me?.ready?'Ready! Waiting for your partner…':'I’m ready ✦'}</button>:null}
    {error&&s&&<p className="error" role="alert">{error}</p>}
    <details className="rules"><summary>How to play</summary><p>{game.rules}</p><p>Room scores: win +3 · tie +1 · matching emoji choices or completing the garden goal +2 each. Scores stay with this room for 24 hours.</p></details>
    {playing&&<button className="text-button end-round" disabled={busy||s?.abortVotes.includes(s.me)} onClick={()=>action('abort')}>{s?.abortVotes.includes(s.me)?'Waiting for your partner to end the round':s?.abortVotes.length?'Partner wants to end · agree?':'Vote to end this round'}</button>}
   </section>
   <aside><section className="room-card" id="room-setup"><div className="eyebrow">{s?'YOUR SHARED ROOM':'ONLINE PLAY'}</div><h2>{s?'Party of two ♡':'Together, anywhere.'}</h2>
    {!s?<><ol className="room-steps"><li>Create your room.</li><li>Share the invite link.</li><li>Both tap ready to begin.</li></ol><label htmlFor="name">Your name</label><input id="name" value={name} maxLength={20} placeholder="What should we call you?" onChange={e=>setName(e.target.value)}/><button className="primary" disabled={busy||restoring} onClick={()=>enter('create')}>{restoring?'Checking saved room…':busy?'Connecting…':'Create a room'} <span>↗</span></button><div className="divider">or join your partner</div><label htmlFor="code">Room code</label><div className="join"><input id="code" value={entry} maxLength={8} placeholder="8-character code" autoCapitalize="characters" onChange={e=>setEntry(e.target.value.toUpperCase())}/><button disabled={busy||restoring||entry.length!==8} onClick={()=>enter('join')}>Join</button></div><p className="fine">Your partner opens the invite on their own device.<br/>Your room and scores last 24 hours.</p></>:<><div className="connection"><span className={connected?'connected':'reconnecting'}>{connected?'Connected':'Reconnecting…'}</span><small>Room saved</small></div><div className="room-code">{code}</div><button className="primary" onClick={share}>{copied?'Link copied ✓':'Copy invite link ♡'}</button><div className="people">{[0,1].map(i=><div key={i}><span className="avatar">{i===0?'🐇':'🐢'}</span><span>{s.players[i]?.name||'Your partner'}<small>{!s.players[i]?'Waiting to join':now-s.players[i].lastSeen>35000?'Away · waiting to reconnect':s.players[i].ready?'Ready to play':i===s.me?'That’s you':'In the room'}</small></span>{s.players[i]?.emoji&&now-s.players[i].emoji!.at<6000&&<span className="live-emoji" aria-label="Player reaction">{s.players[i].emoji!.value}</span>}</div>)}</div><div className="reaction-bar" aria-label="Send your partner a reaction">{reactions.map(v=><button key={v} aria-label={`Send ${v}`} disabled={busy} onClick={()=>action('emoji',{value:v})}>{v}</button>)}</div><p className="fine">Send a little reaction.</p><button className="text-button" onClick={leave}>Leave room</button></>}
    {error&&!s&&<p className="error" role="alert">{error}</p>}
   </section>
   {s&&s.history.length>0?<section className="history"><h3>Your last rounds</h3>{s.history.slice(0,4).map(h=><div key={h.round}><span>{games.find(g=>g.id===h.game)?.icon} {games.find(g=>g.id===h.game)?.title}</span><b>{h.winner===-3?'Ended':h.winner===-2?'Both win':h.winner===-1?'Tie':s.players[h.winner]?.name}</b></div>)}</section>:<div className="little-note"><span>💌</span><p>A little competition.<br/><strong>A lot of time together.</strong></p></div>}
   </aside>
  </div>
  <section className="games" id="game-library"><div className="games-heading"><h2>Find your next favourite</h2><span>A DIFFERENT WORLD IN EVERY GAME</span></div><div className="game-list">{games.map((g,i)=><button key={g.id} style={{'--card-accent':gameLooks[g.id].accent,'--card-tint':gameLooks[g.id].bg} as CSSProperties} className={`game-card ${game.id===g.id?'selected':''}`} aria-pressed={game.id===g.id} disabled={(!!s&&(s.me!==0||playing))||busy} onClick={()=>pick(g.id,true)}><span className="game-icon">{g.icon}</span><small>{['race','garden','fishing'].includes(g.id)?'SOLO + ONLINE':'2 PLAYERS'} · {g.tag}</small><strong>{gameLooks[g.id].name}</strong><span>{g.desc}</span>{game.id===g.id&&<b className="selected-label">PLAYING NOW</b>}</button>)}</div>{s&&<p className="hint">The room creator picks games between rounds. Both players tap “I’m ready”.</p>}</section>
  <footer><span>tap together</span><span>Your own little place to play.</span><a href="#play-area">Back to game ↑</a></footer>
 </main>;
}

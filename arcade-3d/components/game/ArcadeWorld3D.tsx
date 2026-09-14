'use client';
import {installWeather} from '@/game/weather/WeatherEffects';
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {gameLooks} from '@/lib/game-look';
import {moodChoices,type GameView} from '@/lib/game';

type Props={game:string;state:GameView|null;now:number;busy:boolean;onAction:(a:string,b?:Record<string,unknown>)=>Promise<unknown>};
type Pick={label:string;face:string;action:string;data:Record<string,unknown>;disabled:boolean};
const moods=['Pizza night','Movie night','Sunset walk','Beach day','Cosy cuddles','Game night'];
function options(game:string,s:GameView|null,now:number,busy:boolean):Pick[]{
 const p=s?.players[s.me],go=!!s?.start&&!s.finished&&now>=s.start,turn=go&&s?.turn===s?.me,base=busy||!go;
 const make=(label:string,face:string,action:string,data:Record<string,unknown>,disabled=base)=>({label,face,action,data,disabled});
 if(game==='hearts')return Array.from({length:9},(_,i)=>make(`Catch heart ${i+1}`,i===((p?.taps||0)*7+(s?.round||1)*3)%9?'♥':'·','heart',{cell:i,expected:p?.taps},base||i!==((p?.taps||0)*7+(s?.round||1)*3)%9));
 if(game==='reaction')return [make(go?'Tap now!':'Wait for green',p?.reaction!=null?'✓':go?'GO':'WAIT','react',{ms:s?now-s.start:0},busy||!s?.start||s.finished||p?.reaction!==null)];
 if(game==='rps')return ['rock','paper','scissors'].map((v,i)=>make(v,['ROCK','PAPER','SCISSORS'][i],'choose',{choice:v},base||!!p?.choice));
 if(game==='ttt')return Array.from({length:9},(_,i)=>make(`Square ${i+1}: ${s?.board[i]||'empty'}`,s?.board[i]==='heart'?'♥':s?.board[i]==='star'?'★':String(i+1),'move',{cell:i},busy||!turn||!!s?.board[i]));
 if(game==='memory')return Array.from({length:16},(_,i)=>make(`Card ${i+1}: ${s?.memory?.deck[i]==='?'?'hidden':s?.memory?.deck[i]||'hidden'}`,s?.memory?.deck[i]||'?','flip',{cell:i},busy||!turn||(s?.memory?.deck[i]||'?')!=='?'||!!s?.memory?.hideAt));
 if(game==='connect')return Array.from({length:7},(_,i)=>make(`Drop in column ${i+1}`,String(i+1),'drop',{cell:i},busy||!turn||!!s?.board[i]));
 if(game==='sync')return moodChoices.map((v,i)=>make(moods[i],v,'choose',{choice:v},base||!!p?.choice));
 if(game==='words')return (s?.word?.letters||'CUDDLE').toUpperCase().split('').map((v,i)=>make(`Add ${v}`,v,'letter',{value:v,index:i}));
 return [];
}
export default function ArcadeWorld3D({game,state,now,busy,onAction}:Props){
 const host=useRef<HTMLDivElement>(null),live=useRef({state,now,busy,onAction}),[fault,setFault]=useState(''),[answer,setAnswer]=useState('');
 const addLetter=useRef<(value:string)=>void>(()=>{});addLetter.current=v=>setAnswer(a=>(a+v).slice(0,30));live.current={state,now,busy,onAction};
 useEffect(()=>{setAnswer('');},[game,state?.round]);
 const picks=options(game,state,now,busy),go=!!state?.start&&!state.finished&&now>=state.start,turn=state?.turn===state?.me,p=state?.players[state.me];
 const invoke=(pick:Pick)=>{if(pick.disabled)return;if(pick.action==='letter')addLetter.current(String(pick.data.value));else void onAction(pick.action,pick.data);};
 useEffect(()=>{
  const el=host.current;if(!el)return;const look=gameLooks[game];setFault('');let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});}catch{setFault('3D isn’t available on this device. You can still play with the buttons below.');return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(look.bg);el.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','Interactive 3D game board. Matching keyboard controls are below.');
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-6,6,5,-5,.1,100);camera.position.set(0,10,11);camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xffffff,0x7161a3,2.7));const light=new THREE.DirectionalLight(0xfff3dd,3);light.position.set(-5,12,8);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-9;light.shadow.camera.right=9;light.shadow.camera.top=9;light.shadow.camera.bottom=-9;scene.add(light);
  const resources:{dispose:()=>void}[]=[],hits:THREE.Object3D[]=[],animated:{object:THREE.Object3D;kind:string;index:number;key:string;label?:THREE.Mesh;piece?:THREE.Group;baseY:number}[]=[];
  const mat=(color:THREE.ColorRepresentation,extra:THREE.MeshStandardMaterialParameters={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.38,metalness:.08,...extra});resources.push(m);return m;};
  const pink=mat('#ff68b0'),gold=mat('#ffc95c'),purple=mat(look.accent),white=mat('#fff9ff'),mint=mat('#58dec3'),dark=mat('#352659');
  function mesh(geo:THREE.BufferGeometry,m:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0){resources.push(geo);const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function label(value:string,parent:THREE.Object3D,x:number,y:number,z:number,size=.72,color='#39265e'){
   const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d')!;ctx.clearRect(0,0,512,256);ctx.fillStyle=color;ctx.font='bold 100px system-ui, "Apple Color Emoji", "Segoe UI Emoji"';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(value,256,128,490);
   const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;resources.push(texture);const m=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false});resources.push(m);return mesh(new THREE.PlaneGeometry(size*2,size),m,parent,x,y,z);
  }
  function symbol(star:boolean,parent:THREE.Object3D,m:THREE.Material){const shape=new THREE.Shape();if(star){for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.23:.5;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?shape.lineTo(x,y):shape.moveTo(x,y);}shape.closePath();}else{shape.moveTo(0,-.43);shape.bezierCurveTo(-.85,.03,-.45,.8,0,.38);shape.bezierCurveTo(.45,.8,.85,.03,0,-.43);}const o=mesh(new THREE.ExtrudeGeometry(shape,{depth:.2,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.065,bevelThickness:.065}),m,parent);o.rotation.x=-Math.PI/2;return o;}
  const island=new THREE.Group();scene.add(island);mesh(game==='memory'||game==='ttt'?new THREE.BoxGeometry(8.5,.65,8.5):new THREE.CylinderGeometry(6.1,5.3,.65,game==='rps'?6:64),purple,island,0,-.65);mesh(game==='memory'||game==='ttt'?new THREE.BoxGeometry(8.5,.14,8.5):new THREE.CylinderGeometry(6.08,6.08,.14,game==='rps'?6:64),mat(look.floor),island,0,-.25);
  for(let i=0;i<20&&game!=='memory'&&game!=='ttt';i++){const a=i*Math.PI*2/20;mesh(new THREE.SphereGeometry(.10,8,6),i%2?pink:gold,island,Math.cos(a)*5.75,-.04,Math.sin(a)*5.75);}
  function removePiece(piece:THREE.Group){const drop=(r:{dispose:()=>void})=>{r.dispose();const i=resources.indexOf(r);if(i>=0)resources.splice(i,1);};piece.traverse(o=>{if(!(o instanceof THREE.Mesh))return;drop(o.geometry);const m=o.material;if(m instanceof THREE.MeshBasicMaterial){if(m.map)drop(m.map);drop(m);}});piece.removeFromParent();}
  function target(index:number,x:number,z:number,width=1.35,depth=1.35,kind=game){const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);const base=mesh(new THREE.BoxGeometry(width,.22,depth),mat('#fff9ff'),group);base.userData.pick=index;hits.push(base);animated.push({object:group,kind,index,key:'',baseY:0});return group;}
  if(['hearts','ttt','memory'].includes(game)){const n=game==='memory'?4:3,step=game==='memory'?1.7:2;for(let i=0;i<n*n;i++){const g=target(i,(i%n-(n-1)/2)*step,(Math.floor(i/n)-(n-1)/2)*step,game==='memory'?1.43:1.7,game==='memory'?1.43:1.7);if(game==='memory'){const back=label('✦',g,0,.13,0,.7,'#9470dc');back.rotation.x=-Math.PI/2;}}}
  if(game==='connect'){
   camera.position.set(0,6.8,12);camera.lookAt(0,1,0);
   for(let col=0;col<7;col++){const g=target(col,(col-3)*1.2,-.45,1.1,.85,'column');g.position.y=4.5;const t=label(String(col+1),g,0,.18,0,.45);t.rotation.x=-Math.PI/2;}
   const frame=new THREE.Group();scene.add(frame);mesh(new THREE.BoxGeometry(9,.3,.8),purple,frame,0,.1,0);mesh(new THREE.BoxGeometry(.3,4.3,.6),purple,frame,-4.4,2,0);mesh(new THREE.BoxGeometry(.3,4.3,.6),purple,frame,4.4,2,0);
   for(let i=0;i<42;i++){const group=new THREE.Group();group.position.set((i%7-3)*1.2,3.9-Math.floor(i/7)*.7,0);scene.add(group);const ring=mesh(new THREE.TorusGeometry(.30,.09,8,24),white,group);ring.userData.pick=i%7;hits.push(ring);animated.push({object:group,kind:'disc',index:i,key:'',baseY:group.position.y});}
  }
  if(game==='rps')for(let i=0;i<3;i++){const g=target(i,(i-1)*2.7,0,2.2,2.6);const model=new THREE.Group();g.add(model);model.position.y=.8;if(i===0)mesh(new THREE.DodecahedronGeometry(.72),purple,model);if(i===1){const paper=mesh(new THREE.BoxGeometry(1,.08,1.35),white,model);paper.rotation.z=.2;for(let j=0;j<3;j++)mesh(new THREE.BoxGeometry(.6,.015,.04),purple,model,0,.06,-.3+j*.25);}if(i===2){for(let j=0;j<2;j++){const blade=mesh(new THREE.BoxGeometry(.12,.12,1.35),white,model,j?-.2:.2,.1,-.15);blade.rotation.y=j?-.4:.4;const handle=mesh(new THREE.TorusGeometry(.22,.09,8,20),j?pink:gold,model,j?-.32:.32,.1,.7);handle.rotation.x=-Math.PI/2;}}animated.push({object:model,kind:'float',index:i,key:'',baseY:.8});const t=label(['ROCK','PAPER','SCISSORS'][i],g,0,.14,1,.38);t.rotation.x=-Math.PI/2;}
  if(game==='sync')for(let i=0;i<6;i++){const angle=i*Math.PI/3;const g=target(i,Math.cos(angle)*3.1,Math.sin(angle)*3.1,1.6,1.6);const orb=mesh(new THREE.IcosahedronGeometry(.66,2),[pink,gold,mint,purple,white,gold][i],g,0,.75);const tag=label(moodChoices[i],g,0,.8,.69,.65);tag.rotation.x=-.45;animated.push({object:orb,kind:'planet',index:i,key:'',baseY:.75});}
  if(game==='reaction'){for(let i=0;i<3;i++){const ring=mesh(new THREE.TorusGeometry(1.4+i*.5,.045,8,48),mint,scene,0,.22);ring.rotation.x=-Math.PI/2;animated.push({object:ring,kind:'pulse',index:i,key:'',baseY:.22});}const g=target(0,0,0,4,3.5);const orb=mesh(new THREE.SphereGeometry(1.1,32,24),mat('#b69dcf'),g,0,1.35);orb.userData.pick=0;hits.push(orb);animated.push({object:orb,kind:'beacon',index:0,key:'',baseY:1.35});}
  if(game==='number'){const g=new THREE.Group();scene.add(g);mesh(new THREE.CylinderGeometry(1.3,1.6,.4,32),gold,g,0,.1);const ball=mesh(new THREE.IcosahedronGeometry(1.35,3),mat('#9d79f0',{metalness:.5,roughness:.12}),g,0,1.5);animated.push({object:ball,kind:'float',index:0,key:'',baseY:1.5});for(let i=0;i<2;i++){const ring=mesh(new THREE.TorusGeometry(1.7,.065,8,64),i?gold:pink,g,0,1.5);ring.rotation.x=1+i;animated.push({object:ring,kind:'orbit',index:i,key:'',baseY:1.5});}}
  if(game==='words'){const letters=live.current.state?.word?.letters||'CUDDLE';for(let i=0;i<letters.length;i++){const columns=Math.min(4,letters.length),rows=Math.ceil(letters.length/columns);const g=target(i,(i%columns-(columns-1)/2)*1.75,(Math.floor(i/columns)-(rows-1)/2)*2,1.45,1.45);mesh(new THREE.BoxGeometry(1.4,.7,1.4),i%2?gold:pink,g,0,.4);const t=label(letters[i].toUpperCase(),g,0,.77,0,.8);t.rotation.x=-Math.PI/2;animated.push({object:g,kind:'letter',index:i,key:'',baseY:0});}}
  const particles=new THREE.Group();scene.add(particles);for(let i=0;i<24;i++){const o=mesh(new THREE.OctahedronGeometry(.055),i%2?pink:gold,particles,(Math.random()-.5)*11,1+Math.random()*3,(Math.random()-.5)*9);animated.push({object:o,kind:'spark',index:i,key:'',baseY:o.position.y});}
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down={x:0,y:0};
  const pd=(e:PointerEvent)=>{down={x:e.clientX,y:e.clientY};};
  const pu=(e:PointerEvent)=>{if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>12)return;const box=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(hits,false)[0];if(!hit)return;const v=live.current,pick=options(game,v.state,v.now,v.busy)[hit.object.userData.pick];if(pick&&!pick.disabled){if(pick.action==='letter')addLetter.current(String(pick.data.value));else void v.onAction(pick.action,pick.data);}};
  renderer.domElement.addEventListener('pointerdown',pd);renderer.domElement.addEventListener('pointerup',pu);
  const lost=(e:Event)=>{e.preventDefault();setFault('3D paused on this device. Use the controls below, or reload to restore the scene.');};renderer.domElement.addEventListener('webglcontextlost',lost);
  function resize(){const w=el!.clientWidth,h=el!.clientHeight;renderer.setSize(w,h);const aspect=w/h,halfWidth=game==='connect'?5.4:5.05,halfHeight=game==='connect'?4.0:4.6;const y=Math.max(halfHeight,halfWidth/aspect);camera.left=-y*aspect;camera.right=y*aspect;camera.top=y;camera.bottom=-y;camera.updateProjectionMatrix();}const observer=new ResizeObserver(resize);observer.observe(el);resize();
  let frame=0,previous=performance.now();const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const disposeWeather=installWeather(renderer,scene,camera);
  function draw(t:number){frame=requestAnimationFrame(draw);if(document.hidden)return;const dt=Math.min(.1,(t-previous)/1000);previous=t;const v=live.current,s=v.state,opts=options(game,s,v.now,v.busy),player=s?.players[s.me];
   for(const a of animated){const o=a.object;
    if(a.kind==='letter'){o.position.y=reduced?0:Math.sin(t*.002+a.index*.9)*.12;o.rotation.y=reduced?0:Math.sin(t*.001+a.index)*.055;}
    else if(a.kind==='planet'){o.position.y=a.baseY+(reduced?0:Math.sin(t*.0018+a.index)*.25);if(!reduced)o.rotation.y+=dt*.4;}
    else if(a.kind==='pulse'){const ready=!!s?.start&&!s.finished&&v.now>=s.start;o.visible=ready;const scale=reduced?1:1+((t*.001+a.index*.4)%1);o.scale.setScalar(scale);}
    else if(a.kind==='float'){if(!reduced){o.position.y=a.baseY+Math.sin(t*.002+a.index)*.1;o.rotation.y+=dt*.3;}}
    else if(a.kind==='orbit'){if(!reduced){o.rotation.y+=dt*.5;o.rotation.z+=dt*.25;}}
    else if(a.kind==='spark'){o.visible=!reduced;o.position.y=a.baseY+Math.sin(t*.001+a.index)*.5;o.rotation.y+=dt;}
    else if(a.kind==='rps'||a.kind==='sync'){const value=a.kind==='rps'?['rock','paper','scissors'][a.index]:moodChoices[a.index];const chosen=player?.choice===value;const target=chosen?.32:0;o.position.y=THREE.MathUtils.damp(o.position.y,target,9,dt);const base=o.children[0] as THREE.Mesh;if(base?.material)(base.material as THREE.MeshStandardMaterial).emissive.set(chosen?'#382445':'#000000');}
    else if(a.kind==='beacon'){const ready=!!s?.start&&!s.finished&&v.now>=s.start;((o as THREE.Mesh).material as THREE.MeshStandardMaterial).color.set(player?.reaction!=null?'#ffc95c':ready?'#40eab3':'#d397b2');o.scale.setScalar(reduced?1:1+Math.sin(t*.004)*.03);}
    else if(a.kind==='disc'){const key=s?.board[a.index]||'';if(key!==a.key){a.key=key;if(a.piece){removePiece(a.piece);}if(key){const piece=new THREE.Group();mesh(new THREE.CylinderGeometry(.25,.25,.18,24),key==='flower'?pink:gold,piece).rotation.x=Math.PI/2;o.add(piece);piece.position.y=reduced?0:4;a.piece=piece;}}if(a.piece)a.piece.position.y=THREE.MathUtils.damp(a.piece.position.y,0,8,dt);}
    else if(['memory','ttt','hearts'].includes(a.kind)){const key=game==='memory'?(s?.memory?.deck[a.index]||'?'):game==='ttt'?(s?.board[a.index]||''):opts[a.index]?.face==='♥'?'heart':'';
     if(key!==a.key){a.key=key;if(a.piece)removePiece(a.piece);a.piece=undefined;const piece=new THREE.Group();o.add(piece);a.piece=piece;
      if(game==='memory'){mesh(new THREE.BoxGeometry(1.38,.16,1.38),key==='?'?purple:mint,piece,0,.2);const face=label(key==='?'?'✦':key,piece,0,.29,0,.8);face.rotation.x=-Math.PI/2;piece.rotation.z=reduced?0:Math.PI/2;}
      else if(key){symbol(key==='star',piece,key==='star'?gold:pink);piece.position.y=.3;piece.scale.setScalar(reduced?1:.02);}
     }
     if(a.piece){a.piece.rotation.z=THREE.MathUtils.damp(a.piece.rotation.z,0,12,dt);a.piece.scale.lerp(new THREE.Vector3(1,1,1),1-Math.exp(-dt*10));if(game==='hearts'&&key){a.piece.position.y=1+(reduced?0:Math.sin(t*.004)*.3);a.piece.rotation.x=.7;a.piece.rotation.y=reduced?0:Math.sin(t*.002)*.22;}if(game==='ttt'&&key){a.piece.rotation.y=reduced?0:Math.sin(t*.001+a.index)*.12;}if(game==='memory'&&s?.memory?.matched.includes(a.index)){a.piece.position.y=reduced?0:Math.sin(t*.004+a.index)*.08;}}
    }
   }
   renderer.render(scene,camera);
  }frame=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();renderer.domElement.removeEventListener('pointerdown',pd);renderer.domElement.removeEventListener('pointerup',pu);renderer.domElement.removeEventListener('webglcontextlost',lost);resources.forEach(r=>r.dispose());disposeWeather();renderer.dispose();renderer.domElement.remove();};
 },[game,state?.round,state?.word?.letters]);
 return <div className={`arcade-world game-${game}`}>
  <div className="world-caption"><span>{gameLooks[game].world}</span><span>{game==='number'?'Find the secret number':game==='words'?'Tap letters or type below':'Tap an object to play'}</span></div>
  {game==='sync'&&<p className="world-prompt">{state?.prompt||'Pick our perfect Friday evening.'}</p>}
  <div ref={host} className="arcade-viewport"/>
  
  {fault&&<p role="status" className="hint">{fault}</p>}
  {['hearts','memory'].includes(game)&&<div className="scores">{state?.players.map((v,i)=><span key={i}>{v.name}: <b>{game==='hearts'?`${v.taps}/12`:`${v.pairs} pairs`}</b></span>)}</div>}
  {game==='reaction'&&<p className="hint" role="status">{p?.reaction!=null?p.reaction===99999?'Too early!':`${p.reaction} ms`:go?'Green! Tap now!':'Wait for the green light. Tapping early loses the round.'}</p>}
  {picks.length>0&&<div className={`world-controls controls-${game}`} aria-label="Game controls">{picks.map((pick,i)=><button key={i} disabled={pick.disabled} aria-label={pick.label} onClick={()=>invoke(pick)}>{game==='hearts'?pick.face==='♥'?'♥ Catch':'·':game==='memory'?pick.face==='?'?i+1:pick.face:game==='ttt'?pick.face:game==='connect'?`↓ ${i+1}`:game==='sync'?`${pick.face} ${pick.label}`:game==='rps'?pick.label:pick.face}</button>)}</div>}
  {game==='number'&&<div className="world-answer"><p className="number-range">{state?.number?.low||1}<span>to</span>{state?.number?.high||100}</p><p role="status">{state?.number?.last||'A secret number is waiting to be found.'}</p><form onSubmit={e=>{e.preventDefault();void onAction('guess',{value:answer}).then(ok=>{if(ok)setAnswer('');});}}><label htmlFor="guess">Your guess</label><div className="answer-row"><input id="guess" type="number" inputMode="numeric" min={state?.number?.low||1} max={state?.number?.high||100} required value={answer} disabled={!go||!turn} onChange={e=>setAnswer(e.target.value)}/><button className="primary" disabled={!go||!turn||busy||!answer}>Guess</button></div></form></div>}
  {game==='words'&&<div className="world-answer"><p>{state?.word?.hint||'A cosy word puzzle for two'}</p><form onSubmit={e=>{e.preventDefault();void onAction('answer',{value:answer});}}><label htmlFor="word-answer">Unscramble the word</label><div className="answer-row"><input id="word-answer" autoComplete="off" autoCapitalize="none" spellCheck={false} required maxLength={30} value={answer} disabled={!go} onChange={e=>setAnswer(e.target.value)} placeholder="Tap letters or type here"/><button className="primary" disabled={!go||busy||!answer.trim()}>Check</button></div><button type="button" className="text-button" disabled={!answer} onClick={()=>setAnswer('')}>Clear letters</button></form>{p?.feedback&&<p role="status">{p.feedback}</p>}{state?.finished&&<p>The word was <b>{state.word?.answer}</b>.</p>}</div>}
 </div>;
}

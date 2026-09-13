import {newAngler,fishMove,type Angler} from './fishing';
import {newGarden,gardenMove,type Garden} from './garden';
import {newRunner,controlRunner,advanceRunners,type Runner} from './runner';
export const games = [
 {id:'fishing',icon:'🎣',title:'Moonpond Anglers',desc:'Read the ripples. Reel in a perfect catch.',tag:'SOLO + DUEL',rules:'Cast a line, wait until the bite meter turns green, then reel. Reeling early or late loses the fish and resets your combo. Catch six fish to finish. A streak of catches earns bonus pond points. Solo rounds last 90 seconds. In a shared room, the first to six catches wins; at the time limit, most pond points wins.'},
  {id:'garden',icon:'🐸',title:'Lily & Lumi: Frog Garden',desc:'Grow a little world, alone or together.',tag:'SOLO + CO-OP',rules:'Solo: plant, water and harvest flowers in a garden saved on this device. Together: both ready up, then harvest 12 flowers in 3 minutes. Share petals and upgrade the garden to grow faster. Rain speeds up newly planted flowers. Tap a plot, choose seeds, then plant, water or harvest.'},
  {id:'race',icon:'🐇',title:'Bunny & Turtle: Sky Dash',desc:'A 3D race through the floating gardens.',tag:'3D MULTIPLAYER',rules:'Run automatically. Use left/right to switch lanes, Space or Jump to clear hurdles, and Shift or Boost for a burst of speed. Collect stars along the way. First to 240 metres wins.'},
  {id:'hearts',icon:'💗',title:'Heart Hunt',desc:'Catch the heart before it moves.',tag:'QUICK FINGERS',rules:'Tap only the pink heart. Catch 12 hearts before your partner.'},
  {id:'reaction',icon:'⚡',title:'Ready, Set, Love',desc:'Wait for green. Be the quickest.',tag:'REACTION',rules:'Wait for the green signal, then tap once. An early tap loses. Times are measured on your device.'},
  {id:'rps',icon:'✌️',title:'Paw, Paper, Scissors',desc:'A classic with a little rivalry.',tag:'SECRET CHOICES',rules:'Choose rock, paper or scissors. Both choices stay secret until you have both picked.'},
  {id:'ttt',icon:'💫',title:'Hearts & Stars',desc:'Three in a row wins the round.',tag:'TIC-TAC-TOE',rules:'Take turns placing hearts or stars. Get three in a row, column or diagonal.'},
  {id:'memory',icon:'🍓',title:'Berry Good Memory',desc:'Little treats. Matching pairs.',tag:'MEMORY MATCH',rules:'Flip two cards on your turn. A matching pair earns a point and another turn. Most pairs wins.'},
  {id:'connect',icon:'🌸',title:'Four in Bloom',desc:'Drop a flower. Grow a winning line.',tag:'CONNECT FOUR',rules:'Tap a column to drop your flower. Connect four horizontally, vertically or diagonally.'},
  {id:'number',icon:'🔮',title:'Lucky Little Number',desc:'Follow the clues. Find the number.',tag:'GUESSING DUEL',rules:'Take turns guessing the secret number from 1 to 100. Higher/lower clues narrow the range. Find it to win.'},
  {id:'words',icon:'💌',title:'Love Letter Shuffle',desc:'Untangle a tiny word together.',tag:'WORD RACE',rules:'You both get the same shuffled word and clue. First to type the correct word wins.'},
  {id:'sync',icon:'🧸',title:'Same Wavelength',desc:'Can you pick the same little thing?',tag:'PLAY TOGETHER',rules:'Read the prompt and secretly choose an emoji. Match without telling each other to earn two points each.'},
] as const;
export const reactions=['💗','😂','🥺','👏','😘','🔥'];
export const moodChoices=['🍕','🍿','🌅','🏖️','🧸','🎮'];
export type Player={name:string,token:string,ready:boolean,taps:number,choice:string,reaction:number|null,score:number,pairs:number,lastSeen:number,lastAction:number,emoji?:{value:string,at:number},feedback?:string,requestIds?:string[]};
export type State={game:string,round:number,players:Player[],start:number,deadline:number,winner:number|null,finished:boolean,board:string[],turn:number,moves:number,abortVotes:number[],history:{round:number,game:string,winner:number,at:number}[],memory?:{deck:string[],matched:number[],flipped:number[],hideAt:number},number?:{secret:number,low:number,high:number,last:string},word?:{answer:string,letters:string,hint:string},prompt?:string,runners?:Runner[],raceAt?:number,garden?:Garden,anglers?:Angler[]};
export type GameView=State&{me:number};
export function random(n:number){return crypto.getRandomValues(new Uint32Array(1))[0]%n;}
function shuffle<T>(a:T[]){for(let i=a.length-1;i>0;i--){const j=random(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
export function normalize(s:State,now:number){s.deadline??=0;s.board??=[];s.turn??=0;s.moves??=0;s.abortVotes??=[];s.history??=[];if(s.game==='race'){s.runners??=[newRunner(),newRunner()];s.raceAt??=s.start||now;}s.players.forEach(p=>{p.score??=0;p.pairs??=0;p.lastSeen??=now;p.lastAction??=0;p.requestIds??=[];});return s;}
export function player(name:string,now:number):Player{return {name:name.trim().slice(0,20)||'Player',token:crypto.randomUUID(),ready:false,taps:0,choice:'',reaction:null,score:0,pairs:0,lastSeen:now,lastAction:0,requestIds:[]};}
export function reset(s:State,game=s.game){
 s.game=game;s.start=0;s.deadline=0;s.finished=false;s.winner=null;s.round++;s.turn=s.round%2;s.moves=0;s.abortVotes=[];s.board=Array(game==='connect'?42:9).fill('');s.memory=undefined;s.number=undefined;s.word=undefined;s.prompt=undefined;s.runners=game==='race'?[newRunner(),newRunner()]:undefined;s.raceAt=0;s.garden=game==='garden'?newGarden():undefined;s.anglers=game==='fishing'?[newAngler(),newAngler()]:undefined;
 s.players.forEach(p=>{p.ready=false;p.taps=0;p.choice='';p.reaction=null;p.pairs=0;p.feedback='';p.lastAction=0;});
 if(game==='memory')s.memory={deck:shuffle(['🍓','🍒','🍋','🍇','🧁','🍩','🍪','🍑'].flatMap(x=>[x,x])),matched:[],flipped:[],hideAt:0};
 if(game==='number')s.number={secret:random(100)+1,low:1,high:100,last:'The secret is somewhere from 1 to 100.'};
 if(game==='words'){const entries=[['cuddle','A cosy hug'],['sunshine','A little warmth from above'],['picnic','Lunch on a blanket'],['sparkle','A tiny flash of light'],['blossom','A flower opening'],['pancake','A sweet breakfast'],['penguin','A bird in a tiny tuxedo'],['rainbow','Colour after the rain'],['chocolate','A cocoa treat'],['butterfly','A colourful garden visitor'],['starlight','A little glow after dark'],['cupcake','A small cake with frosting'],['laughter','The sound of a good joke'],['postcard','A little message from a trip']];const [answer,hint]=entries[random(entries.length)];let letters=shuffle(answer.split('')).join('');if(letters===answer)letters=answer.slice(1)+answer[0];s.word={answer,letters,hint};}
 if(game==='sync')s.prompt=['Pick our perfect Friday evening.','Pick a surprise you would send me.','Pick the one that feels most like us.','Pick our next little adventure.','Pick your instant mood booster.'][random(5)];
}
export function createState(p:Player):State{const s={game:'race',round:0,players:[p],start:0,deadline:0,winner:null,finished:false,board:[],turn:0,moves:0,abortVotes:[],history:[]} as State;reset(s);return s;}
function finish(s:State,winner:number,now:number,award=true){if(s.finished)return;s.finished=true;s.winner=winner;if(award)s.players.forEach((p,i)=>p.score+=winner===-2?2:winner===-1?1:winner===i?3:0);s.history.unshift({round:s.round,game:s.game,winner,at:now});s.history=s.history.slice(0,8);}
function higher(s:State,metric:(p:Player)=>number){const a=metric(s.players[0]),b=metric(s.players[1]);return a===b?-1:a>b?0:1;}
export function tick(s:State,now:number){
 if(s.game==='garden'&&s.garden&&s.start&&!s.finished){s.garden.weather=['sun','rain','night'][Math.floor(Math.max(0,now-s.start)/30000)%3];}
 if(s.game==='race'&&s.start&&now>=s.start&&!s.finished&&s.runners){const end=Math.min(now,s.deadline||now);const outcome=advanceRunners(s.runners,Math.max(s.raceAt||s.start,s.start),end,s.round);s.raceAt=end;if(outcome)finish(s,outcome.winner,outcome.at);}
 if(s.memory?.hideAt&&now>=s.memory.hideAt){s.memory.flipped=[];s.memory.hideAt=0;s.turn=1-s.turn;s.moves++;}
 if(!s.finished&&s.deadline&&now>=s.deadline){const winner=s.game==='fishing'?(s.anglers![0].points===s.anglers![1].points?-1:s.anglers![0].points>s.anglers![1].points?0:1):s.game==='race'?(s.runners?.[0].distance===s.runners?.[1].distance?-1:(s.runners?.[0].distance||0)>(s.runners?.[1].distance||0)?0:1):s.game==='hearts'?higher(s,p=>p.taps):s.game==='memory'?higher(s,p=>p.pairs):s.game==='reaction'?higher(s,p=>p.reaction===null?-100000:-p.reaction):-1;finish(s,winner,now);}
}
export type Command={action:string,game?:string,round?:number,taps?:number,ms?:number,choice?:string,cell?:number,expected?:number,value?:string,requestId?:string};
export function act(s:State,me:number,b:Command,now:number){
 const p=s.players[me];
 if(b.requestId&&p.requestIds?.includes(b.requestId))return;
 if(b.action==='emoji'){if(!reactions.includes(b.value||''))throw Error('Choose one of the reactions.');if(now-(p.emoji?.at||0)<1000)return;p.emoji={value:b.value!,at:now};return;}
 if(b.action==='select'){if(me!==0)throw Error('The room creator picks the game.');if(s.start&&!s.finished)throw Error('Finish this round first, or both vote to end it.');if(!games.some(g=>g.id===b.game))throw Error('Unknown game.');reset(s,b.game);}
 else if(b.action==='ready'){
 if(s.finished)reset(s);
 if(!s.start){p.ready=true;if(s.players.length===2&&s.players.every(p=>p.ready)){s.start=now+3000+(s.game==='reaction'?random(3000)+1000:0);s.deadline=s.start+(s.game==='memory'||s.game==='connect'||s.game==='garden'?180000:s.game==='reaction'?15000:90000);}}
 }
 else if(b.action==='abort'){if(s.start&&!s.finished&&!s.abortVotes.includes(me)){s.abortVotes.push(me);if(s.abortVotes.length===2)finish(s,-3,now,false);}}
 else if(b.action==='ping'||b.action==='state')return;
 else {
 if(b.round!==s.round)throw Error('A new round has started. Try again.');
 if(!s.start||s.finished)throw Error('This round is not running.');
 if(now<s.start&&b.action!=='react')throw Error('Wait for the countdown.');
 if(['flip','drop','move','guess'].includes(b.action)&&b.expected!==s.moves)throw Error('The board changed. Please try again.');
 if(['flip','drop','move','guess'].includes(b.action)&&s.turn!==me)throw Error('It is your partner’s turn.');
 switch(b.action){
 case 'fish':if(s.game!=='fishing'||!s.anglers)break;fishMove(s.anglers[me],b.value||'',now);if(s.anglers[me].catches>=6)finish(s,me,now);break;
 case 'garden':if(s.game!=='garden'||!s.garden)break;gardenMove(s.garden,me,b.value||'',b.cell??0,b.choice||'daisy',now);if(s.garden.harvests>=12)finish(s,-2,now);break;
 case 'run':if(s.game!=='race'||!s.runners)break;if(!['left','right','jump','boost'].includes(b.value||''))throw Error('Unknown movement.');controlRunner(s.runners[me],b.value!,now);break;
 case 'heart':if(s.game!=='hearts')break;if(b.expected===p.taps&&b.cell===(p.taps*7+s.round*3)%9){p.taps++;if(p.taps===12)finish(s,me,now);}break;
 case 'react':if(s.game!=='reaction'||p.reaction!==null)break;p.reaction=now<s.start||(b.ms??-1)<0?99999:Math.round(Math.max(0,Math.min(99998,b.ms??99998)));if(s.players.every(p=>p.reaction!==null))finish(s,higher(s,p=>-p.reaction!),now);break;
 case 'choose':if(!['rps','sync'].includes(s.game)||p.choice)break;{const allowed=s.game==='rps'?['rock','paper','scissors']:moodChoices;if(!allowed.includes(b.choice||''))throw Error('Choose an option shown.');p.choice=b.choice!;if(s.players.every(p=>p.choice)){const [a,c]=s.players.map(p=>p.choice);finish(s,s.game==='sync'?(a===c?-2:-1):a===c?-1:({rock:'scissors',paper:'rock',scissors:'paper'}[a]===c?0:1),now);}}break;
 case 'move':if(s.game!=='ttt')break;{const i=b.cell!;if(!Number.isInteger(i)||i<0||i>8||s.board[i])throw Error('Choose an empty square.');s.board[i]=me===0?'heart':'star';s.moves++;s.turn=1-me;const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];if(lines.some(a=>a.every(k=>s.board[k]===s.board[i])))finish(s,me,now);else if(s.board.every(Boolean))finish(s,-1,now);}break;
 case 'drop':if(s.game!=='connect')break;{const col=b.cell!;if(!Number.isInteger(col)||col<0||col>6)throw Error('Choose a column.');let row=5;while(row>=0&&s.board[row*7+col])row--;if(row<0)throw Error('That column is full.');const val=me===0?'flower':'sunflower';s.board[row*7+col]=val;s.moves++;s.turn=1-me;const win=[[0,1],[1,0],[1,1],[1,-1]].some(([dr,dc])=>{let n=1;for(const direction of [-1,1]){let r=row+dr*direction,c=col+dc*direction;while(r>=0&&r<6&&c>=0&&c<7&&s.board[r*7+c]===val){n++;r+=dr*direction;c+=dc*direction;}}return n>=4;});if(win)finish(s,me,now);else if(s.board.every(Boolean))finish(s,-1,now);}break;
 case 'flip':if(s.game!=='memory'||!s.memory)break;{const m=s.memory,i=b.cell!;if(m.hideAt)throw Error('Wait for the cards to turn back.');if(!Number.isInteger(i)||i<0||i>=16||m.matched.includes(i)||m.flipped.includes(i))throw Error('Choose a face-down card.');m.flipped.push(i);s.moves++;if(m.flipped.length===2){if(m.deck[m.flipped[0]]===m.deck[m.flipped[1]]){m.matched.push(...m.flipped);m.flipped=[];p.pairs++;if(m.matched.length===16)finish(s,higher(s,p=>p.pairs),now);}else m.hideAt=now+1600;}}break;
 case 'guess':if(s.game!=='number'||!s.number)break;{const n=Number(b.value);if(!Number.isInteger(n)||n<s.number.low||n>s.number.high)throw Error(`Choose a whole number from ${s.number.low} to ${s.number.high}.`);s.moves++;if(n===s.number.secret){s.number.last=`${n} is the lucky number!`;finish(s,me,now);}else{if(n<s.number.secret)s.number.low=n+1;else s.number.high=n-1;s.number.last=`${p.name} guessed ${n}. Go ${n<s.number.secret?'higher':'lower'}!`;s.turn=1-me;}}break;
 case 'answer':if(s.game!=='words'||!s.word)break;if(now-p.lastAction<750)throw Error('Take a moment, then try again.');p.lastAction=now;if(b.value?.trim().toLowerCase()===s.word.answer){p.feedback='You got it!';finish(s,me,now);}else p.feedback='Not quite. Try another word.';break;
 default:throw Error('Unknown move.');
 }
 }
 if(b.requestId){p.requestIds||=[];p.requestIds.push(b.requestId);p.requestIds=p.requestIds.slice(-20);}
}
export function publicState(s:State,me:number):GameView{return {...s,me,memory:s.memory?{...s.memory,deck:s.memory.deck.map((v,i)=>s.finished||s.memory!.matched.includes(i)||s.memory!.flipped.includes(i)?v:'?')}:undefined,number:s.number?{...s.number,secret:s.finished?s.number.secret:0}:undefined,word:s.word?{...s.word,answer:s.finished?s.word.answer:''}:undefined,players:s.players.map((p,i)=>({...p,token:'',requestIds:undefined,feedback:i===me?p.feedback:undefined,choice:s.finished||i===me?p.choice:p.choice?'locked':'',reaction:s.finished||i===me?p.reaction:p.reaction===null?null:-1}))};}

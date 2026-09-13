import {z} from 'zod';
import {db} from '@/lib/db';
import {publicState,player,createState,normalize,tick,act,type State} from '@/lib/game';
const schema=z.object({action:z.enum(['create','join','state','select','ready','fish','garden','run','react','choose','heart','move','flip','drop','guess','answer','emoji','abort']),name:z.string().max(100).optional(),code:z.string().max(16).optional(),token:z.string().max(100).optional(),game:z.string().optional(),round:z.number().int().optional(),taps:z.number().int().nonnegative().optional(),ms:z.number().optional(),choice:z.string().max(40).optional(),cell:z.number().int().optional(),expected:z.number().int().optional(),value:z.string().max(100).optional(),heartbeat:z.boolean().optional(),requestId:z.string().uuid().optional()});
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){
 try{
  if(Number(req.headers?.get('content-length')||0)>4096)return json({error:'Request too large.'},413);
  let body:unknown;try{body=await req.json();}catch{return json({error:'Send a valid game request.'},400);}const parsed=schema.safeParse(body);if(!parsed.success)return json({error:'Invalid game request.'},400);
  const b=parsed.data,database=db(),now=Date.now();
  if(b.action==='create'){
   const code=crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase(),p=player(b.name||'Player',now),s=createState(p);
   await database.prepare('INSERT INTO rooms (code,state,revision,expires) VALUES (?,?,0,?)').bind(code,JSON.stringify(s),now+86400000).run();
   return json({code,token:p.token,state:publicState(s,0),revision:0,serverTime:Date.now()});
  }
  const code=(b.code||'').toUpperCase();
  for(let attempt=0;attempt<6;attempt++){
   const row=await database.prepare('SELECT state,revision FROM rooms WHERE code=? AND expires>?').bind(code,now).first<{state:string,revision:number}>();
   if(!row)return json({error:'Room not found or expired. Check the code or create a new room.'},404);
   const s=normalize(JSON.parse(row.state) as State,now);let me=s.players.findIndex(p=>p.token===b.token),token=b.token;
   if(b.action==='join'&&me<0){if(s.players.length>=2)return json({error:'This room already has two players.'},409);const p=player(b.name||'Player',now);s.players.push(p);me=1;token=p.token;}
   else if(me<0)return json({error:'Please join the room first.'},403);
   tick(s,now);
   const p=s.players[me];if(b.heartbeat||b.action!=='state')p.lastSeen=now;
   if(!['join','state'].includes(b.action)){try{act(s,me,b,now);}catch(e){return json({error:(e as Error).message},409);}}
   const stateText=JSON.stringify(s);let revision=row.revision;
   if(stateText!==row.state){const update=await database.prepare('UPDATE rooms SET state=?,revision=revision+1 WHERE code=? AND revision=?').bind(stateText,code,row.revision).run();if(!update.meta.changes)continue;revision++;}
   return json({code,token,revision,state:publicState(s,me),serverTime:Date.now()});
  }
  return json({error:'Your partner just made a move. Please try again.'},409);
 }catch(e){console.error('Game service error',e);return json({error:'Connection trouble. Your room is saved; try again in a moment.'},503);}
}

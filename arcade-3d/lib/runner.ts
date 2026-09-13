export const TRACK_LENGTH=240;
export const JUMP_MS=1150;
export type Runner={distance:number,lane:number,jumpAt:number,boostUntil:number,boostReadyAt:number,slowUntil:number,hits:number,stars:number,lastObstacle:number,lastStar:number};
export const newRunner=():Runner=>({distance:0,lane:0,jumpAt:0,boostUntil:0,boostReadyAt:0,slowUntil:0,hits:0,stars:0,lastObstacle:-1,lastStar:-1});
export const hurdle=(i:number,round:number)=>({distance:18+i*17,lane:((i*7+round)%3)-1});
export const star=(i:number,round:number)=>({distance:11+i*12,lane:((i*5+round+1)%3)-1});
export function jumpHeight(r:Runner,t:number){const p=(t-r.jumpAt)/JUMP_MS;return r.jumpAt&&p>=0&&p<=1?Math.sin(p*Math.PI)*2.2:0;}
export function runnerSpeed(r:Runner,t:number){return t<r.slowUntil?2:t<r.boostUntil?10.5:6;}
export function controlRunner(r:Runner,move:string,now:number){
 if(move==='left')r.lane=Math.max(-1,r.lane-1);
 else if(move==='right')r.lane=Math.min(1,r.lane+1);
 else if(move==='jump'&&now-r.jumpAt>=JUMP_MS)r.jumpAt=now;
 else if(move==='boost'&&now>=r.boostReadyAt){r.boostUntil=now+1500;r.boostReadyAt=now+6500;}
}
export function stepRunner(r:Runner,from:number,to:number,round:number){
 if(r.distance>=TRACK_LENGTH)return;
 const before=r.distance;r.distance=Math.min(TRACK_LENGTH,before+runnerSpeed(r,from)*(to-from)/1000);
 for(let i=r.lastObstacle+1;hurdle(i,round).distance<=r.distance;i++){
  const h=hurdle(i,round);r.lastObstacle=i;if(h.distance<before)continue;
  const crossed=from+(to-from)*(h.distance-before)/(r.distance-before||1);
  if(r.lane===h.lane&&jumpHeight(r,crossed)<.75){r.hits++;r.slowUntil=crossed+1200;}
 }
 for(let i=r.lastStar+1;star(i,round).distance<=r.distance;i++){
  const item=star(i,round);r.lastStar=i;if(item.distance>=before&&r.lane===item.lane)r.stars++;
 }
}
export function advanceRunners(rs:Runner[],from:number,to:number,round:number){
 let t=from;while(t<to){const end=Math.min(to,t+50);const times=rs.map(r=>{const before=r.distance;stepRunner(r,t,end,round);return r.distance>=TRACK_LENGTH?t+(end-t)*(TRACK_LENGTH-before)/(r.distance-before||1):Infinity;});
  const fastest=Math.min(...times);if(Number.isFinite(fastest))return {at:fastest,winner:Math.abs(times[0]-times[1])<1?-1:times.indexOf(fastest)};t=end;
 }return null;
}

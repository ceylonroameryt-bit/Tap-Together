import type {World} from '../services/weather/weather.mapper';
import {opportunity} from '../game/weather/WeatherGameplay';
export type Angler={casts:number;catches:number;points:number;combo:number;biteAt:number;closesAt:number;last:string;collection:string[]};
export const fishTypes=[{name:'Moon minnow',points:1,color:'#93e9ea'},{name:'Rose koi',points:2,color:'#ff89b1'},{name:'Golden carp',points:3,color:'#ffd36f'}];
export function newAngler():Angler{return {casts:0,catches:0,points:0,combo:0,biteAt:0,closesAt:0,last:'Cast your line. Wait for a bite, then reel!',collection:[]};}
export function fishMove(p:Angler,value:string,now:number,world?:World){
 if(value==='cast'){if(p.biteAt&&now<=p.closesAt)throw Error('Your line is already in the water.');if(p.biteAt)p.combo=0;p.casts++;p.biteAt=now+1800+(p.casts*733)%1800;p.closesAt=p.biteAt+Math.max(900,1600-p.combo*100);p.last='Line cast. Watch for the bite!';return;}
 if(value!=='reel')throw Error('Choose cast or reel.');if(!p.biteAt)throw Error('Cast your line first.');
 if(now<p.biteAt||now>p.closesAt){p.combo=0;p.last=now<p.biteAt?'Too early! The fish got away.':'The fish escaped. Cast again.';}
 else{const base=fishTypes[(p.casts-1)%3];const fish=world&&p.casts%3===0?{...base,name:opportunity(world,now).fish,points:base.points+1}:base;p.catches++;p.combo++;p.points+=fish.points+Math.min(3,Math.floor(p.combo/3));if(!p.collection.includes(fish.name))p.collection.push(fish.name);p.last=`Caught a ${fish.name}! ${p.combo>1?`${p.combo} catch combo!`:''}`;}
 p.biteAt=0;p.closesAt=0;
}

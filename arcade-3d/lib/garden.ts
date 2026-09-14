import type {World} from '../services/weather/weather.mapper';
export type Plot={seed:string;planted:number;readyAt:number;watered:boolean};
export type Garden={plots:(Plot|null)[];coins:number;harvests:number;level:number;frogCells:number[];weather:string;log:string};
export const seeds=[{id:'daisy',name:'Daisy',cost:2,reward:5,grow:24000,color:'#fff2aa'},{id:'rose',name:'Rose',cost:4,reward:9,grow:35000,color:'#ff79b0'},{id:'moon',name:'Moonflower',cost:6,reward:14,grow:45000,color:'#b8abff'}];
export function newGarden():Garden{return {plots:Array(16).fill(null),coins:16,harvests:0,level:1,frogCells:[12,15],weather:'sun',log:'Plant a seed, water it, then harvest the flower.'};}
export function gardenMove(g:Garden,who:number,verb:string,cell:number,seed:string,now:number,world?:World){
 if(verb==='upgrade'){const cost=g.level*20;if(g.level>=3)throw Error('Your garden is fully upgraded.');if(g.coins<cost)throw Error(`You need ${cost} petals to upgrade.`);g.coins-=cost;g.level++;g.log=`Garden level ${g.level}! New flowers grow faster.`;return;}
 if(!Number.isInteger(cell)||cell<0||cell>15)throw Error('Choose a garden plot.');
 const plot=g.plots[cell];
 if(verb==='plant'){if(plot)throw Error('This plot is already planted.');const type=seeds.find(s=>s.id===seed);if(!type)throw Error('Choose a seed.');if(type.id==='moon'&&g.level<2)throw Error('Upgrade to level 2 for moonflowers.');if(g.coins<type.cost)throw Error('Harvest a flower to earn more petals.');g.coins-=type.cost;g.plots[cell]={seed,planted:now,readyAt:now+Math.round(type.grow*(1-(g.level-1)*.15)*(g.weather==='rain'?.7:1)*(world?.weather.temperature!==null&&world?.weather.temperature!==undefined&&world.weather.temperature>25? .9:1)),watered:false};g.log=`${type.name} planted in plot ${cell+1}.`;}
 else if(verb==='water'){if(!plot)throw Error('Plant a seed first.');if(plot.watered)throw Error('This flower is already watered.');plot.watered=true;plot.readyAt=Math.max(now+1000,plot.readyAt-10000);g.log='A little drink! This flower will bloom sooner.';}
 else if(verb==='harvest'){if(!plot||now<plot.readyAt)throw Error('This flower is still growing.');g.coins+=seeds.find(s=>s.id===plot.seed)!.reward;g.harvests++;g.plots[cell]=null;g.log=`Flower ${g.harvests} harvested. Lovely teamwork!`;}
 else throw Error('Choose plant, water or harvest.');
 g.frogCells[who]=cell;
}

export function restoreGarden(value:unknown):Garden|null{if(!value||typeof value!=='object')return null;const g=value as Garden;if(!Array.isArray(g.plots)||g.plots.length!==16||!Array.isArray(g.frogCells)||g.frogCells.length!==2||!g.frogCells.every(n=>Number.isInteger(n)&&n>=0&&n<16)||!Number.isFinite(g.coins)||g.coins<0||!Number.isInteger(g.harvests)||g.harvests<0||![1,2,3].includes(g.level)||!['sun','rain','night'].includes(g.weather)||typeof g.log!=='string')return null;if(!g.plots.every(p=>p===null||(typeof p==='object'&&seeds.some(s=>s.id===p.seed)&&Number.isFinite(p.planted)&&Number.isFinite(p.readyAt)&&p.readyAt>=p.planted&&typeof p.watered==='boolean')))return null;return g;}

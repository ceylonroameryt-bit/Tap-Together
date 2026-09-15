export const villagePlaces=[
 {id:'square',name:'Willow Square',icon:'⛲',x:0,z:3,text:'The heart of Lilybrook. Meet your partner beside the fountain.'},
 {id:'home',name:'Lily & Lumi’s cottage',icon:'🏡',x:0,z:-5,text:'A cosy little home for two. There is always room for another cup of tea.'},
 {id:'bakery',name:'Honeybun Bakery',icon:'🥐',x:-5,z:-1,text:'Mochi the baker has warm berry buns in the window. Follow the path to the pond for a picnic.'},
 {id:'pond',name:'Moonlily Pond',icon:'🪷',x:-6,z:8,text:'Listen to the water and watch the lily pads bob. Rain brings the frogs out.'},
 {id:'garden',name:'Community Garden',icon:'🌷',x:4,z:6,text:'Sixteen shared flower beds. Plant, water and harvest below to help the village bloom.'},
 {id:'market',name:'Fern’s flower stall',icon:'🌿',x:9,z:1,text:'Fern trades in petals. Use your harvest earnings to upgrade the community garden.'},
 {id:'lookout',name:'Sunset Lookout',icon:'🌅',x:-9,z:10,text:'A quiet bench above the stream. The sky follows your chosen world location.'},
] as const;
export const villageCell=(x:number,z:number)=>(Math.round(z)+12)*25+Math.round(x)+12;
export const villagePoint=(cell:number)=>({x:cell%25-12,z:Math.floor(cell/25)-12});
export const villageSpawn=[villageCell(0,5),villageCell(1,5)];
export function walkable(cell:number){if(!Number.isInteger(cell)||cell<0||cell>=625)return false;const {x,z}=villagePoint(cell);if(Math.hypot(x,z)>14)return false;if(Math.hypot(x+7,z-4)<3.2)return false;if(Math.hypot(x,z)<1.6)return false;for(const [hx,hz] of [[-7,-7],[0,-8],[7,-7],[-8,-1],[9,-2]])if(Math.abs(x-hx)<2&&Math.abs(z-hz)<2)return false;return true;}
export function villagePath(start:number,end:number){if(!walkable(start)||!walkable(end))return [];const queue=[start],previous=new Map<number,number>([[start,-1]]);for(let i=0;i<queue.length;i++){const cell=queue[i];if(cell===end){const path:number[]=[];for(let c=end;c!==start;c=previous.get(c)!)path.unshift(c);return path;}for(const step of [-25,25,-1,1]){const n=cell+step;if(Math.abs(step)===1&&Math.floor(n/25)!==Math.floor(cell/25))continue;if(walkable(n)&&!previous.has(n)){previous.set(n,cell);queue.push(n);}}}return [];}

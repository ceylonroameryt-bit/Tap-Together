import type {World} from '../../services/weather/weather.mapper';
// One active world feeds every local renderer; multiplayer values come only from the room API.
let current:World|undefined;let decorations:string[]=[];let serverOffset=0;
export const activeWorld=()=>current;
export const activeDecorations=()=>decorations;
export function publishWorld(world:World|undefined,items:string[]=[],offset=0){current=world;decorations=items;serverOffset=offset;}
export const worldNow=()=>Date.now()+serverOffset;

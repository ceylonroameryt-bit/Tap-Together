import {fallback,type World,type SharedWorld} from '../../services/weather/weather.mapper';
import {weatherFor} from '../../services/weather/weather.service';
import type {Location} from '../../services/weather/weather.mapper';
export const newShared=():SharedWorld=>({inventory:{},collectedAt:0,questCount:0});
export async function makeWorld(location:Location,mode:'real'|'relaxed'='real'):Promise<World>{const now=Date.now();return {location:{...location,selectedAt:now},weather:await weatherFor(location),mode,startedAt:now,changedAt:now,seed:Math.floor(now%1000000)};}
export async function refreshWorld(world:World){if(world.weather.expiresAt>Date.now())return;const weather=await weatherFor(world.location,world.weather);if(weather.type!==world.weather.type)world.changedAt=Date.now();world.weather=weather;}

import {lightingTarget} from './WeatherLighting';
import type {World} from '@/services/weather/weather.mapper';
export class WeatherController{value:ReturnType<typeof lightingTarget>|null=null;last=0;update(world:World,now:number){const target=lightingTarget(world,now);if(!this.value)this.value={...target};const dt=Math.min(.1,Math.max(0,(now-this.last)/1000));this.last=now;const blend=1-Math.exp(-dt/7);for(const key of Object.keys(target) as (keyof typeof target)[])this.value[key]+=(target[key]-this.value[key])*blend;return this.value;}}

import type {Weather,Location} from './weather.mapper';
export const cache=new Map<string,Weather>();
export const inflight=new Map<string,Promise<Weather>>();
export const cacheKey=(l:Location)=>`${l.latitude.toFixed(3)},${l.longitude.toFixed(3)},${l.timezone}`;
export function put(key:string,w:Weather){if(cache.size>=500)cache.delete(cache.keys().next().value!);cache.set(key,w);}

// Persistent cache uses the same database binding as rooms (ephemeral on Render Free).
export async function readStored(key:string):Promise<Weather|undefined>{try{const {db}=await import('@/lib/db');const row=await db().prepare('SELECT payload FROM weather_cache WHERE id=?').bind(key).first<{payload:string}>();if(row)return JSON.parse(row.payload);}catch{}return undefined;}
export async function storeWeather(key:string,w:Weather){try{const {db}=await import('@/lib/db');await db().prepare('INSERT INTO weather_cache (id,payload,fetched_at,expires_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,fetched_at=excluded.fetched_at,expires_at=excluded.expires_at').bind(key,JSON.stringify(w),w.fetchedAt,w.expiresAt).run();}catch{/* Memory cache remains available during migration or storage failure. */}}

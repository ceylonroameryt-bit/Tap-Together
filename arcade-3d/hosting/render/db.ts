import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
mkdirSync('/tmp/tap-together',{recursive:true});
const connection=new DatabaseSync('/tmp/tap-together/rooms.sqlite');
connection.exec('CREATE TABLE IF NOT EXISTS rooms (code TEXT PRIMARY KEY,state TEXT NOT NULL,revision INTEGER NOT NULL,expires INTEGER NOT NULL)');
const cleanup=setInterval(()=>connection.prepare('DELETE FROM rooms WHERE expires < ?').run(Date.now()),60000);
cleanup.unref();
export function db(){return {prepare(sql:string){return {bind(...args:(string|number)[]){return {
 async first<T>(){return connection.prepare(sql).get(...args) as T|undefined;},
 async run(){const result=connection.prepare(sql).run(...args);return {meta:{changes:Number(result.changes)}};}
};}};}};}

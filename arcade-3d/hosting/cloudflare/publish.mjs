import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
process.chdir(path.dirname(fileURLToPath(import.meta.url)));
const wrangler=path.resolve('node_modules/wrangler/bin/wrangler.js');
if(!existsSync(wrangler)){console.error('First run npm install in this folder, then npm run deploy.');process.exit(1);}
function run(args){const r=spawnSync(process.execPath,[wrangler,...args],{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});if(r.error)throw r.error;if(r.status!==0)throw Error(`Stopped during ${args[0]}. Fix the reported issue and run npm run deploy again.`);}
try{
 console.log('Tap Together: publish ten games to your Cloudflare account.');
 console.log('Stay on the Workers Free plan. This script does not enable paid services.');
 if(!process.env.CLOUDFLARE_API_TOKEN)run(['login']);
 let config=JSON.parse(readFileSync('wrangler.json','utf8'));
 if(!config.d1_databases?.some(x=>x.binding==='DB'&&x.database_id)){
  run(['d1','create',`${config.name}-rooms`,'--binding','DB','--update-config','--config','wrangler.json']);
  config=JSON.parse(readFileSync('wrangler.json','utf8'));
 }
 const database=config.d1_databases?.find(x=>x.binding==='DB'&&x.database_id);
 if(!database)throw Error('Cloudflare did not save the database binding. Keep this folder and check wrangler.json before trying again.');
 database.migrations_dir='migrations';writeFileSync('wrangler.json',JSON.stringify(config,null,2)+'\n');
 run(['d1','migrations','apply',database.database_name,'--remote','--config','wrangler.json']);
 run(['deploy','--config','wrangler.json']);
 console.log('\nOpen the workers.dev link above, create a room and send the invite link to your partner.');
 console.log('Keep this folder: its wrangler.json now identifies your Worker and room database.');
}catch(e){console.error(e.message);process.exit(1);}

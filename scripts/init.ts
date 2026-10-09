import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {db,vehicles} from '../lib/db';
import type {Vehicle} from '../lib/model';
const snapshotPath='./data/inventory.snapshot.json';
if(!vehicles().length&&existsSync(snapshotPath)){
 const snapshot=JSON.parse(readFileSync(snapshotPath,'utf8'));
 if(snapshot.version!==1||snapshot.source!=='https://ultimatemotor.ca'||!Array.isArray(snapshot.vehicles))throw new Error('Invalid source snapshot');
 const age=Date.now()-Date.parse(snapshot.observed_at);if(!Number.isFinite(age)||age< -300000)throw new Error('Invalid snapshot timestamp');
 db.exec('BEGIN IMMEDIATE');try{for(const v of snapshot.vehicles as Vehicle[]){if(!v.id||!v.source_vehicle_url.startsWith('https://www.ultimatemotor.ca/inventory/'))throw new Error('Invalid snapshot source');if(age>72*3600000&&v.availability==='available')v.availability='missing';db.prepare('INSERT INTO vehicles(id,payload,misses) VALUES(?,?,0)').run(v.id,JSON.stringify(v));}db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
 console.log('Restored '+snapshot.vehicles.length+' real source records; original observation times preserved.'+(age>72*3600000?' Snapshot stale; available records marked missing.':''));
}
// Create a local admin credential only when no credential/local configuration exists.
if(!process.env.ADMIN_PASSWORD&&!existsSync('.env.local')){
 writeFileSync('.env.local','ADMIN_PASSWORD='+randomBytes(32).toString('base64url')+'\n',{flag:'wx',mode:0o600});
 console.log('Generated local admin password in ignored .env.local. Read it privately in your editor; it is never logged.');
}
console.log('Database initialized. '+vehicles().length+' records.');

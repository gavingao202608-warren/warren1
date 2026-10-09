import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import type {Vehicle} from './model';
const path=resolve(process.env.DATABASE_PATH || './data/inventory.sqlite'); mkdirSync(dirname(path),{recursive:true});
export const db=new DatabaseSync(path); db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
db.exec(`CREATE TABLE IF NOT EXISTS vehicles(id TEXT PRIMARY KEY, payload TEXT NOT NULL, misses INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS sync_runs(id INTEGER PRIMARY KEY,started_at TEXT NOT NULL,finished_at TEXT,status TEXT NOT NULL,count INTEGER,error TEXT);
CREATE TABLE IF NOT EXISTS inquiries(inquiry_id TEXT PRIMARY KEY,session_id TEXT NOT NULL,vehicle_id TEXT,source TEXT NOT NULL,question TEXT NOT NULL,created_at TEXT NOT NULL,contact_method TEXT,contact_value TEXT,consent INTEGER);
CREATE TABLE IF NOT EXISTS visits(id INTEGER PRIMARY KEY,session_id TEXT NOT NULL,first_source TEXT NOT NULL,current_source TEXT NOT NULL,landing_page TEXT NOT NULL,vehicle_id TEXT,timestamp TEXT NOT NULL,utm TEXT);
CREATE INDEX IF NOT EXISTS visits_time ON visits(timestamp);`);
for(const table of ['inquiries','visits']){const columns=db.prepare('PRAGMA table_info('+table+')').all() as {name:string}[];if(!columns.some(c=>c.name==='is_test'))db.exec('ALTER TABLE '+table+' ADD COLUMN is_test INTEGER NOT NULL DEFAULT 0');}
const inquiryColumns=db.prepare('PRAGMA table_info(inquiries)').all() as {name:string}[];if(!inquiryColumns.some(c=>c.name==='lead_status'))db.exec("ALTER TABLE inquiries ADD COLUMN lead_status TEXT NOT NULL DEFAULT 'new'");
db.exec('CREATE TABLE IF NOT EXISTS site_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL)');db.prepare('INSERT OR IGNORE INTO site_settings(key,value) VALUES(?,?)').run('experiment_started_at',new Date().toISOString());
export function vehicles(availableOnly=false):Vehicle[]{return (db.prepare('SELECT payload FROM vehicles ORDER BY id').all() as {payload:string}[]).map(r=>JSON.parse(r.payload)).filter(v=>!availableOnly || v.availability==='available');}
export function vehicle(id:string){return vehicles().find(v=>v.id===id||v.stock_number===id);}
export function applyInventory(incoming:Vehicle[],complete:boolean,confirmedMissing?:Set<string>){
 if(!incoming.length) throw new Error('Empty inventory is not a successful sync; previous inventory retained');
 const now=new Date().toISOString();db.exec('BEGIN IMMEDIATE');try{
 const ids=new Set(incoming.map(v=>v.id));
 for(const v of incoming){const old=vehicle(v.id);const comparable=(x:Vehicle)=>JSON.stringify({...x,last_seen_at:'',updated_at:''});v.last_seen_at=now;v.updated_at=old&&comparable(old)===comparable(v)?old.updated_at:now;
 db.prepare('INSERT INTO vehicles(id,payload,misses) VALUES(?,?,0) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,misses=0').run(v.id,JSON.stringify(v));}
 if(complete)for(const old of vehicles()){if(ids.has(old.id)||old.availability==='sold'||(confirmedMissing&&!confirmedMissing.has(old.id)))continue;const row=db.prepare('SELECT misses FROM vehicles WHERE id=?').get(old.id) as {misses:number};const misses=row.misses+1;old.availability=misses>=3?'unavailable':'missing';old.updated_at=now;db.prepare('UPDATE vehicles SET payload=?,misses=? WHERE id=?').run(JSON.stringify(old),misses,old.id);}
 db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
}
export async function saveInquiry(input:{session_id:string;vehicle_id:string|null;source:string;question:string;contact_method?:string|null;contact_value?:string|null;consent?:boolean;is_test?:boolean}){
 if(!input.question.trim()||input.question.length>2000)throw new Error('Question must be 1–2000 characters');
 if(input.vehicle_id&&!vehicle(input.vehicle_id))throw new Error('Unknown vehicle');
 if(input.contact_value&&!input.consent)throw new Error('Consent required for contact details');
 if(input.contact_value){const value=input.contact_value.trim();if(input.contact_method==='Email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))throw new Error('Enter a valid email address');if(input.contact_method==='Phone'&&(value.replace(/\D/g,'').length<7||value.replace(/\D/g,'').length>15))throw new Error('Enter a valid phone number');if(!['Email','Phone'].includes(input.contact_method||''))throw new Error('Choose Email or Phone for contact details');}
 const {customerDB}=await import('./customer-store');const id=randomUUID();await customerDB.prepare('INSERT INTO inquiries(inquiry_id,session_id,vehicle_id,source,question,created_at,contact_method,contact_value,consent,is_test) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,input.session_id,input.vehicle_id,input.source,input.question.trim(),new Date().toISOString(),input.contact_method||null,input.contact_value||null,input.consent?1:0,input.is_test?1:0);return id;
}

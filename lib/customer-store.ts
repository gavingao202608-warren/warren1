import {Pool} from 'pg';
import {db} from './db';
let pool:Pool|undefined;let ready:Promise<void>|undefined;
function connection(){
 if(pool)return pool;
 const url=new URL(process.env.DATABASE_URL!);if(!['postgres:','postgresql:'].includes(url.protocol))throw new Error('DATABASE_URL must be PostgreSQL');
 const local=['localhost','127.0.0.1','::1'].includes(url.hostname);
 // The driver must not replace certificate verification through URL SSL options.
 for(const key of ['sslmode','sslcert','sslkey','sslrootcert','ssl'])url.searchParams.delete(key);
 pool=new Pool({connectionString:url.toString(),ssl:local?false:{rejectUnauthorized:true},max:3,connectionTimeoutMillis:10000,idleTimeoutMillis:10000});return pool;
}
async function ensure(){
 if(!ready){const p=connection();ready=p.query(`CREATE TABLE IF NOT EXISTS inquiries(inquiry_id TEXT PRIMARY KEY,session_id TEXT NOT NULL,vehicle_id TEXT,source TEXT NOT NULL,question TEXT NOT NULL,created_at TEXT NOT NULL,contact_method TEXT,contact_value TEXT,consent INTEGER,is_test INTEGER NOT NULL DEFAULT 0,lead_status TEXT NOT NULL DEFAULT 'new');
 CREATE TABLE IF NOT EXISTS visits(id BIGSERIAL PRIMARY KEY,session_id TEXT NOT NULL,first_source TEXT NOT NULL,current_source TEXT NOT NULL,landing_page TEXT NOT NULL,vehicle_id TEXT,timestamp TEXT NOT NULL,utm TEXT,is_test INTEGER NOT NULL DEFAULT 0);
 CREATE INDEX IF NOT EXISTS visits_time ON visits(timestamp);
 CREATE TABLE IF NOT EXISTS site_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);`).then(async()=>{await p.query('INSERT INTO site_settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO NOTHING',['experiment_started_at',new Date().toISOString()]);}).catch(e=>{ready=undefined;throw e;});}await ready;
}
export const customerDB={prepare(sql:string){
 return {
 async all(...params:any[]){if(!process.env.DATABASE_URL)return db.prepare(sql).all(...params);await ensure();let i=0;return (await connection().query(sql.replace(/\?/g,()=>'$'+(++i)),params)).rows;},
 async get(...params:any[]){return (await this.all(...params))[0];},
 async run(...params:any[]){if(!process.env.DATABASE_URL)return db.prepare(sql).run(...params);await ensure();let i=0;return connection().query(sql.replace(/\?/g,()=>'$'+(++i)),params);}
 };
}};
export async function closeCustomerDB(){if(pool)await pool.end();pool=undefined;ready=undefined;}

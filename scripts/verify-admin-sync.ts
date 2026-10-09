import assert from 'node:assert/strict';import {writeFileSync} from 'node:fs';import {DatabaseSync} from 'node:sqlite';
const base=process.env.TEST_BASE_URL||'http://localhost:3000';const password=process.env.ADMIN_PASSWORD;if(!password)throw new Error('Admin password must be configured securely');
const login=await fetch(base+'/api/admin/login',{method:'POST',headers:{origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password}),redirect:'manual'});assert.equal(login.status,303,'Admin login failed');
const cookie=login.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');const started=new Date().toISOString();
const response=await fetch(base+'/api/admin/sync',{method:'POST',headers:{origin:base,cookie},redirect:'manual',signal:AbortSignal.timeout(180000)});
const d=new DatabaseSync(process.env.DATABASE_PATH||'data/inventory.sqlite');const run=d.prepare('SELECT started_at,finished_at,status,count,error FROM sync_runs ORDER BY id DESC LIMIT 1').get();
const result={timestamp:new Date().toISOString(),http_status:response.status,sync:run};writeFileSync('reports/admin-sync.json',JSON.stringify(result,null,2)+'\n');
if(response.status!==303)console.error('Admin sync response',await response.text());assert.equal(response.status,303,'Admin sync failed');assert.equal(run?.status,'success');assert.ok(Number(run?.count)>=10);assert.ok(String(run?.started_at)>=started);console.log('PASS: authenticated Sync Inventory Now completed; '+run?.count+' real source records retained.');d.close();

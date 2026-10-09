import {createHash} from 'node:crypto';import {readFileSync,writeFileSync} from 'node:fs';import {load} from 'cheerio';import {fetch,EnvHttpProxyAgent} from 'undici';import {customerDB,closeCustomerDB} from '../lib/customer-store';import {indexNowBody} from '../lib/indexnow';
const origin=(process.env.PUBLIC_BASE_URL||process.env.RENDER_EXTERNAL_URL||'https://warren-vehicle-finder.onrender.com').replace(/\/$/,'');
const key=JSON.parse(readFileSync('data/discovery.json','utf8')).indexnow_key;
const dispatcher=new EnvHttpProxyAgent();
const report:{[key:string]:unknown}={timestamp:new Date().toISOString(),origin,platform:'IndexNow / Bing',indexing_guaranteed:false};
try{
 indexNowBody(origin,key,[origin]);
 const keyURL=origin+'/'+key+'.txt';const verification=await fetch(keyURL,{dispatcher,redirect:'error',signal:AbortSignal.timeout(75000)});
 const keyText=await verification.text();if(!verification.ok||keyText.trim()!==key)throw new Error('Public ownership key not deployed or does not match');
 const response=await fetch(origin+'/sitemap.xml',{dispatcher,redirect:'error',signal:AbortSignal.timeout(75000)});if(!response.ok){await response.body?.cancel();throw new Error('Sitemap is unavailable');}
 const xml=await response.text();if(xml.length>1000000)throw new Error('Sitemap is too large');const $=load(xml,{xmlMode:true});const urls=$('urlset > url > loc').toArray().map(x=>$(x).text());
 const body=indexNowBody(origin,key,urls);report.url_count=urls.length;
 const signature=createHash('sha256').update(xml+(process.env.RENDER_GIT_COMMIT||'')).digest('hex');
 const previous=await customerDB.prepare('SELECT value FROM site_settings WHERE key=?').get('indexnow_last_signature');
 if(process.argv.includes('--dry-run'))report.status='DRY_RUN';
 else if(previous?.value===signature)report.status='SKIPPED_UNCHANGED';
 else{const result=await fetch('https://www.bing.com/indexnow',{dispatcher,method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});report.http_status=result.status;await result.body?.cancel();
 report.status=result.status===200?'RECEIVED':result.status===202?'RECEIVED_KEY_VALIDATION_PENDING':'FAILED';
 if(![200,202].includes(result.status))throw new Error('IndexNow returned HTTP '+result.status);
 await customerDB.prepare('INSERT INTO site_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run('indexnow_last_signature',signature);}
 console.log(JSON.stringify(report));
}catch(e){report.status='FAILED';report.error=String(e);console.error(JSON.stringify(report));process.exitCode=1;}
finally{if(process.env.SAVE_INDEXNOW_REPORT==='1')writeFileSync('reports/indexnow-submission.json',JSON.stringify(report,null,2)+'\n');await closeCustomerDB();await dispatcher.close();}

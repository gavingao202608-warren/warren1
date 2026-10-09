import * as cheerio from 'cheerio';
import robotsParser from 'robots-parser';
import {openSync,closeSync,unlinkSync,statSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {db,applyInventory,vehicles} from './db';
import {parseVehicle} from './parser';
import {publishedSearchConfig,fetchPublicInventory} from './zop';
import {writeFileSync} from 'node:fs';
import {getSource,SourceHTTPError,authorizedURL,setCrawlDelay} from './source-http';
const AGENT='UltimateDiscoveryGateway';
let running=false;
export async function syncInventory(){
 if(running)throw new Error('Sync already running');
 const lock=resolve(dirname(process.env.DATABASE_PATH||'./data/inventory.sqlite'),'sync.lock');
 // CLI and admin may run in separate processes. Atomic lock prevents interleaved transitions.
 try{if(Date.now()-statSync(lock).mtimeMs>3600000)unlinkSync(lock);}catch{}
 let lockFd:number;try{lockFd=openSync(lock,'wx');}catch{throw new Error('Another sync holds the inventory lock');}
 running=true;const started=new Date().toISOString();const row=db.prepare('INSERT INTO sync_runs(started_at,status) VALUES(?,?)').run(started,'running');
 try{
 const base=new URL(process.env.SOURCE_BASE_URL||'https://ultimatemotor.ca');if(!authorizedURL(base.href))throw new Error('Only the authorized source host is allowed');
 const robotsURL=new URL('/robots.txt',base).href;let robotsText='';try{robotsText=await getSource(robotsURL);}catch(e){if(!(e instanceof SourceHTTPError&&[404,410].includes(e.status)))throw new Error('Cannot verify source robots.txt; fetch stopped: '+String(e));}
 const robots=robotsParser(robotsURL,robotsText);setCrawlDelay(robots.getCrawlDelay(AGENT)||0);
 const allowed=(url:string)=>authorizedURL(url)&&robots.isAllowed(url,AGENT)!==false;
 // Prefer the exact structured endpoint naturally exposed in the public listing.
 const listingURL=new URL('/inventory/',base).href;const listing=allowed(listingURL)?await getSource(listingURL):'';
 const publicConfig=publishedSearchConfig(listing);
 if(publicConfig){
 const incoming=await fetchPublicInventory(publicConfig);if(!incoming.length)throw new Error('Empty public inventory; previous valid inventory retained');
 // Validate every imported VDP against the source's own Car JSON-LD. This also confirms CAD currency.
 for(const v of incoming){if(!allowed(v.source_vehicle_url))throw new Error('Source robots disallows a vehicle page');const parsed=parseVehicle(await getSource(v.source_vehicle_url),v.source_vehicle_url);if(!parsed||parsed.availability!=='available'||parsed.price_cad!==v.price_cad||parsed.mileage_km!==v.mileage_km||(parsed.vin&&v.vin&&parsed.vin!==v.vin))throw new Error('Source detail/search disagreement at '+v.source_vehicle_url);}
 // Full, count-verified endpoint responses support consecutive missing observations.
 // Before marking an absent record, check for an explicit sold state on its detail page.
 for(const old of vehicles()){if(incoming.some(v=>v.id===old.id)||old.availability==='sold'||!allowed(old.source_vehicle_url))continue;try{const detail=parseVehicle(await getSource(old.source_vehicle_url),old.source_vehicle_url);if(detail?.availability==='sold')incoming.push({...old,availability:'sold'});}catch(e){if(!(e instanceof SourceHTTPError&&[404,410].includes(e.status)))console.warn('Absent detail verification failed; complete public listing remains authoritative');}}
 applyInventory(incoming,true);
 const snapshot={version:1,source:'https://ultimatemotor.ca',observed_at:new Date().toISOString(),vehicles:incoming};
 if(!process.env.DISABLE_SNAPSHOT_WRITE)writeFileSync(resolve(dirname(process.env.DATABASE_PATH||'./data/inventory.sqlite'),'inventory.snapshot.json'),JSON.stringify(snapshot,null,2)+'\n');
 db.prepare('UPDATE sync_runs SET finished_at=?,status=?,count=? WHERE id=?').run(new Date().toISOString(),'success',incoming.length,row.lastInsertRowid);return {count:incoming.length,complete:true,adapter:'zop-public-search+vdp-jsonld'};
 }
 const sitemapURLs=[...robotsText.matchAll(/^Sitemap:\s*(\S+)/gmi)].map(x=>x[1]);if(!sitemapURLs.length)sitemapURLs.push(new URL('/sitemap.xml',base).href);
 const pages=new Set<string>();let sitemapComplete=true;const seen=new Set<string>();
 async function sitemap(url:string,depth=0){if(depth>3||seen.size>=30||!allowed(url)){sitemapComplete=false;return;}if(seen.has(url))return;seen.add(url);const xml=await getSource(url);const $=cheerio.load(xml,{xml:true});if(!$('urlset,sitemapindex').length)throw new Error('Invalid sitemap XML');const locs=$('loc').map((_,e)=>$(e).text().trim()).get();if($('sitemapindex').length){for(const loc of locs)await sitemap(loc,depth+1);}else for(const loc of locs)if(allowed(loc))pages.add(loc);}
 for(const url of sitemapURLs){try{await sitemap(url);}catch(e){sitemapComplete=false;console.warn(String(e));}}
 for(const url of [base.href,new URL('/inventory',base).href])if(allowed(url)){try{const html=await getSource(url);const $=cheerio.load(html);$('a[href]').each((_,e)=>{try{const link=new URL($(e).attr('href')!,base).href;if(allowed(link)&&/vehicle|inventory|used-|cars\//i.test(new URL(link).pathname))pages.add(link);}catch{}});}catch(e){console.warn(String(e));}}
 const candidates=[...pages].filter(url=>/vehicle|inventory|used-|cars\//i.test(new URL(url).pathname));if(!candidates.length)throw new Error('No vehicle URLs discovered; previous inventory retained');if(candidates.length>300)throw new Error('Discovery exceeds safe fetch limit; refine adapter');
 const parsed=[];let failures=0;const notFound=new Set<string>();
 for(const url of candidates){try{const v=parseVehicle(await getSource(url),url);if(v)parsed.push(v);}catch(e){if(e instanceof SourceHTTPError&&[404,410].includes(e.status))notFound.add(url);else failures++;console.warn(String(e));}}
 const ids=new Set(parsed.map(v=>v.id));const confirmedMissing=new Set<string>();
 // Disappearance from a listing alone never changes availability. Verify old detail pages.
 for(const old of vehicles()){if(ids.has(old.id)||old.availability==='sold')continue;if(!allowed(old.source_vehicle_url)){failures++;continue;}
 try{if(notFound.has(old.source_vehicle_url)){confirmedMissing.add(old.id);continue;}const v=parseVehicle(await getSource(old.source_vehicle_url),old.source_vehicle_url);if(v)parsed.push(v);else failures++;}catch(e){if(e instanceof SourceHTTPError&&[404,410].includes(e.status))confirmedMissing.add(old.id);else failures++;}}
 const unique=[...new Map(parsed.map(v=>[v.id,v])).values()];const complete=sitemapComplete&&failures===0;
 // An empty result is treated as a failed run, even if old pages disappear simultaneously.
 applyInventory(unique,complete,confirmedMissing);db.prepare('UPDATE sync_runs SET finished_at=?,status=?,count=? WHERE id=?').run(new Date().toISOString(),complete?'success':'partial',unique.length,row.lastInsertRowid);return {count:unique.length,complete,confirmed_missing:confirmedMissing.size};
 }catch(e){db.prepare('UPDATE sync_runs SET finished_at=?,status=?,error=? WHERE id=?').run(new Date().toISOString(),'failed',String(e),row.lastInsertRowid);throw e;}finally{running=false;closeSync(lockFd);unlinkSync(lock);}}

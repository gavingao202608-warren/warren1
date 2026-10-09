import {EnvHttpProxyAgent,fetch as proxyFetch} from 'undici';
// Honor the platform HTTPS proxy. No direct egress fallback, TLS bypass or login circumvention.
const dispatcher=new EnvHttpProxyAgent();
export class SourceHTTPError extends Error{constructor(public status:number,public url:string){super(`Source HTTP ${status} at ${url}`);}}
export const authorizedURL=(url:string)=>{try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&['ultimatemotor.ca','www.ultimatemotor.ca'].includes(u.hostname)&&(!u.port||u.port==='443');}catch{return false;}};
let lastRequest=0;let delay=1500;
export function setCrawlDelay(seconds:number){delay=Math.max(1500,Math.min(60000,seconds*1000));if(seconds>60)throw new Error('Source crawl delay exceeds safe interactive sync duration; use a scheduled adapter');}
export async function getSource(url:string):Promise<string>{
 for(let redirects=0;redirects<6;redirects++){
 if(!authorizedURL(url))throw new Error('Source URL is outside the authorized HTTPS hosts');
 const wait=Math.max(0,delay-(Date.now()-lastRequest));if(wait)await new Promise(r=>setTimeout(r,wait));lastRequest=Date.now();
 const r=await proxyFetch(url,{dispatcher,headers:{'User-Agent':'UltimateDiscoveryGateway/1.0'},signal:AbortSignal.timeout(25000),redirect:'manual'});
 if([301,302,303,307,308].includes(r.status)){const location=r.headers.get('location');await r.body?.cancel();if(!location)throw new Error('Source redirect without location');url=new URL(location,url).href;continue;}
 if(!r.ok){await r.body?.cancel();throw new SourceHTTPError(r.status,url);}
 if(Number(r.headers.get('content-length')||0)>4000000){await r.body?.cancel();throw new Error('Source response too large');}
 const reader=r.body?.getReader();if(!reader)return '';let size=0;const chunks:Uint8Array[]=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>4000000){await reader.cancel();throw new Error('Source response exceeded size limit');}chunks.push(value);}
 return Buffer.concat(chunks).toString('utf8');
 }throw new Error('Source redirect limit exceeded');
}

export async function getPublicSearch(url:string,key:string):Promise<any>{
 const u=new URL(url);if(u.hostname!=='v6eba1srpfohj89dp-1.a1.typesense.net'||u.protocol!=='https:'||!/^\/collections\/[a-f0-9]{32}\/documents\/search$/.test(u.pathname))throw new Error('Unapproved public search destination');
 const wait=Math.max(0,delay-(Date.now()-lastRequest));if(wait)await new Promise(r=>setTimeout(r,wait));lastRequest=Date.now();
 const r=await proxyFetch(url,{dispatcher,headers:{'X-TYPESENSE-API-KEY':key,'User-Agent':'UltimateDiscoveryGateway/1.0'},signal:AbortSignal.timeout(25000),redirect:'error'});
 if(!r.ok){await r.body?.cancel();throw new SourceHTTPError(r.status,u.origin+u.pathname);}
 const reader=r.body?.getReader();if(!reader)throw new Error('Empty public search response');const chunks:Uint8Array[]=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>10000000){await reader.cancel();throw new Error('Public search response too large');}chunks.push(value);}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

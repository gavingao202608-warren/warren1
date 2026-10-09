import {createHmac,timingSafeEqual} from 'node:crypto';
const limits=new Map<string,{n:number;until:number}>();
export function rateLimit(key:string,max=60){const now=Date.now();if(limits.size>10000)for(const[k,v]of limits)if(v.until<now)limits.delete(k);let r=limits.get(key);if(!r||r.until<now){r={n:0,until:now+60000};limits.set(key,r);}return ++r.n<=max;}
export function safeEqual(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
export function adminToken(expiry:number){return expiry+'.'+createHmac('sha256',process.env.ADMIN_PASSWORD||'disabled').update('admin:'+expiry).digest('hex');}
export function validAdmin(token?:string){if(!process.env.ADMIN_PASSWORD||!token)return false;const expiry=Number(token.split('.')[0]);return expiry>Date.now()&&safeEqual(token,adminToken(expiry));}
export function sameOrigin(req:Request){
 try{const origin=req.headers.get('origin');if(!origin)return false;
 const requestURL=new URL(req.url);const host=req.headers.get('host')||requestURL.host;
 const protocol=(req.headers.get('x-forwarded-proto')||requestURL.protocol.replace(':','')).split(',')[0].trim();
 if(!['http','https'].includes(protocol))return false;
 return new URL(origin).origin===new URL(protocol+'://'+host).origin;
 }catch{return false;}
}
export const sources=['google','bing','chatgpt','copilot','muse','facebook','instagram','xiaohongshu','autotrader','direct','unknown'];
export function sourceFrom(url:URL,referrer=''){const explicit=url.searchParams.get('source')||url.searchParams.get('utm_source');if(explicit)return sources.includes(explicit.toLowerCase())?explicit.toLowerCase():'unknown';if(!referrer)return 'direct';let host='';try{host=new URL(referrer).hostname;}catch{return 'unknown';}if(/(^|\.)google\.(com|ca|co\.uk|com\.au|de|fr|co\.jp|co\.in)$/.test(host))return 'google';if(host==='copilot.microsoft.com')return 'copilot';if(host==='chat.openai.com')return 'chatgpt';for(const name of ['bing','chatgpt','copilot','facebook','instagram','autotrader'])if(host===name+'.com'||host.endsWith('.'+name+'.com'))return name;return 'unknown';}

export function validationToken(){return createHmac('sha256',process.env.ADMIN_PASSWORD||'disabled').update('controlled-validation').digest('hex');}
export function controlledValidation(req:Request){return !!process.env.ADMIN_PASSWORD&&safeEqual(req.headers.get('x-validation-token')||'',validationToken());}

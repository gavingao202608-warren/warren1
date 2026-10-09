// Request construction adapted from bojieyang/indexnow-action v3.0.0 (MIT).
// Changes: plain URL inputs, strict same-origin validation, deduplication.
// Original license is retained in licenses/IndexNow-Action-MIT.txt.
export function indexNowBody(origin:string,key:string,urls:string[]){
 const site=new URL(origin);
 if(site.protocol!=='https:'||site.username||site.password||site.port||['localhost','127.0.0.1','::1'].includes(site.hostname)||/(^|\.)ultimatemotor\.ca$/.test(site.hostname))throw new Error('Submit only the independent public HTTPS site');
 if(!/^[a-zA-Z0-9-]{8,128}$/.test(key))throw new Error('Invalid IndexNow verification key');
 const urlList=[...new Set(urls)];if(!urlList.length||urlList.length>10000)throw new Error('Invalid submission size');
 for(const value of urlList){const u=new URL(value);if(u.origin!==site.origin||u.username||u.password||u.hash)throw new Error('All submitted URLs must belong to our site');}
 return {host:site.hostname,key,keyLocation:site.origin+'/'+key+'.txt',urlList};
}

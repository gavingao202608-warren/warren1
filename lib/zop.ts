import * as cheerio from 'cheerio';
import {parsePrice,parseMileage,parseVin} from './parser';
import {authorizedURL,getPublicSearch} from './source-http';
import type {Vehicle} from './model';
export interface PublicSearchConfig{IMAGE_DOMAIN:string;COLLECTION:string;API_KEY:string;TYPESENSE_HOST:string}
export function publishedSearchConfig(html:string):PublicSearchConfig|null{
 // Parse a literal public browser configuration. Never evaluate source JavaScript.
 const match=html.match(/function globalZDProperties\(\)\s*{\s*return\s*({[\s\S]*?})\s*}/);if(!match)return null;let p;try{p=JSON.parse(match[1]);}catch{return null;}
 if(p.TYPESENSE_HOST!=='v6eba1srpfohj89dp-1.a1.typesense.net'||!/^https:\/\/zopsoftware-asset\.b-cdn\.net\/?$/.test(p.IMAGE_DOMAIN)||!/^[a-f0-9]{32}$/.test(p.COLLECTION)||typeof p.API_KEY!=='string')throw new Error('Published search configuration changed; adapter review required');return p;
}
const text=(x:unknown):string|null=>{if(typeof x!=='string'&&typeof x!=='number')return null;const $=cheerio.load(String(x));$('script,style').remove();const value=$.text().replace(/\uFEFF/g,'').replace(/\s+/g,' ').trim();return value||null;};
function url(x:unknown,base:string){if(typeof x!=='string')return null;try{const u=new URL(x.trim(),base);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
export function parsePublicDocument(d:any,config:PublicSearchConfig,sourceBase='https://www.ultimatemotor.ca'):Vehicle{
 if(!d||!d.inventory_id||String(d.status).toLowerCase()!=='instock'||Number(d.visibility)<=0||Number(d.deleted_at)!==0)throw new Error('Public document is not explicitly visible in-stock inventory');
 const source=url(d.page_url,sourceBase);if(!source||!authorizedURL(source)||!new URL(source).pathname.startsWith('/inventory/'))throw new Error('Invalid source vehicle URL');
 const stock=text(d.stock_no);const id=stock?stock.toLowerCase().replace(/[^a-z0-9-]/g,'-'):'source-'+d.inventory_id;
 const raw:unknown[]=typeof d.image_urls==='string'?d.image_urls.split(';'):Array.isArray(d.image_urls)?d.image_urls:[];const images:string[]=[...new Set<string>(raw.map((x:unknown)=>url(x,config.IMAGE_DOMAIN)).filter((x:string|null):x is string=>!!x))];
 const carfaxText=typeof d.files==='string'?d.files:JSON.stringify(d.files||{});const carfaxMatch=carfaxText.match(/https:\/\/(?:[a-z0-9-]+\.)?carfax\.ca\/[^\s"<>]+/i);
 const basePrice=parsePrice(d.price);const discounted=Number(d.special_price_on)===1&&parsePrice(d.special_price)!==null&&Number(d.special_price)>0;
 const price=Number(d.hide_price)===1||basePrice===0?null:discounted?parsePrice(d.special_price):parsePrice(d.selling_price??d.price);
 const year=Number(d.year);const now=new Date().toISOString();return {id,stock_number:stock,vin:String(d.vindisplay)==='1'?parseVin(d.vin):null,year:Number.isInteger(year)&&year>=1900&&year<=2100?year:null,make:text(d.make),model:text(d.model),trim:text(d.trim),price_cad:price,mileage_km:String(d.km_miles).toUpperCase()==='KM'?parseMileage(d.odometer):null,body_style:text(d.body_type),drivetrain:text(d.drivetrain),transmission:text(d.transmission),engine:[text(d.litres)?text(d.litres)+'L':null,text(d.engine)].filter(Boolean).join(' ')||null,fuel_type:text(d.fuel_type),exterior_color:text(d.exterior_color),interior_color:text(d.interior_color),accident_status:null,carfax_url:carfaxMatch?url(carfaxMatch[0],source):null,description:text(d.vehicle_description),primary_image:images[0]||null,image_urls:images,source_vehicle_url:source,availability:'available',dealer_name:'Ultimate Motors',region:'Greater Toronto Area / Ontario / Canada',last_seen_at:now,updated_at:now};
}
export async function fetchPublicInventory(config:PublicSearchConfig){const records:Vehicle[]=[];let found:number|undefined;
 for(let page=1;page<=10;page++){
 const u=new URL('/collections/'+config.COLLECTION+'/documents/search','https://'+config.TYPESENSE_HOST);u.searchParams.set('q','*');u.searchParams.set('per_page','100');u.searchParams.set('page',String(page));
 // Use precisely the public search-only key published by this dealer. Its embedded filters are never widened.
 const data=await getPublicSearch(u.href,config.API_KEY);if(!Number.isInteger(data.found)||data.found<0||!Array.isArray(data.hits))throw new Error('Invalid public search response');if(found===undefined)found=data.found;else if(data.found!==found)throw new Error('Inventory changed during pagination; retry later');
 records.push(...data.hits.map((h:any)=>parsePublicDocument(h.document,config)));
 if(records.length>=data.found){if(records.length!==data.found||new Set(records.map(v=>v.id)).size!==records.length)throw new Error('Public inventory duplicate/count mismatch');return records;}
 if(!data.hits.length)throw new Error('Incomplete public search pagination');
 }throw new Error('Public inventory exceeds safe pagination limit');
}

import * as cheerio from 'cheerio';
import {createHash} from 'node:crypto';
import type {Vehicle} from './model';
export function parsePrice(value:unknown):number|null{
 if(typeof value==='number')return Number.isFinite(value)&&value>=0?value:null;
 if(typeof value!=='string')return null;const s=value.trim();
 if(!s||/call|contact|bi.?week|month|week|finance|lease|from/i.test(s))return null;
 const match=s.match(/^(?:CAD\s*|CA\s*)?\$?\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)\s*(?:CAD|\$)?$/i);
 return match?Number(match[1].replaceAll(',','')):null;
}
export function parseMileage(value:unknown):number|null{if(typeof value==='number')return Number.isFinite(value)&&value>=0?Math.round(value):null;if(typeof value!=='string'||/mile|\bmi\b/i.test(value))return null;const s=value.replace(/\s*(?:km|kilomet(?:er|re)s?)\s*$/i,'');const n=parsePrice(s);return n===null?null:Math.round(n);}
export function parseVin(value:unknown):string|null{const m=String(value||'').toUpperCase().match(/\b[A-HJ-NPR-Z0-9]{17}\b/);return m?.[0]||null;}
export function parseStock(value:unknown):string|null{const m=String(value||'').match(/(?:stock(?:\s*(?:number|no\.?|#))?\s*[:#]?\s*)([A-Z0-9-]+)/i);return m?.[1]||null;}
function nodes(x:any):any[]{if(Array.isArray(x))return x.flatMap(nodes);if(x&&typeof x==='object')return [x,...nodes(x['@graph']||[])];return [];}
function str(x:any):string|null{return typeof x==='string'&&x.trim()?x.trim():typeof x==='object'&&x?str(x.name):null;}
function safeURL(x:unknown,base:string):string|null{if(typeof x!=='string')return null;try{const u=new URL(x,base);return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}}
function titleParts(name:string){const year=name.match(/^\s*(19\d{2}|20\d{2})\s+/)?.[1];if(!year)return {year:null,make:null,model:null};const rest=name.replace(/^\s*\d{4}\s+/,'');const makes=['Mercedes-Benz','Land Rover','Alfa Romeo','Aston Martin','Rolls-Royce','Toyota','Honda','Lexus','Acura','Mazda','Nissan','Infiniti','Ford','Chevrolet','GMC','Buick','Cadillac','Dodge','Chrysler','Jeep','Ram','Hyundai','Kia','Genesis','BMW','Audi','Volkswagen','Volvo','Subaru','Mitsubishi','Tesla','Porsche','MINI','Fiat','Jaguar','Bentley','Ferrari','Maserati'];const make=makes.find(m=>rest.toLowerCase().startsWith(m.toLowerCase()+' '));return {year:Number(year),make:make||null,model:null};}
export function parseVehicle(html:string,url:string):Vehicle|null{
 const $=cheerio.load(html);const all:any[]=[];$('script[type="application/ld+json"]').each((_,el)=>{try{all.push(...nodes(JSON.parse($(el).text())));}catch{}});
 const candidates=all.filter(x=>[x['@type']].flat().some(t=>['Car','Vehicle','Product'].includes(t)));
 // Multiple vehicle objects indicate a listing, not a uniquely identified detail page.
 if(candidates.length>1)return null;
 const data=candidates[0];const scope=$('main').length?$('main'):$('body');
 const text=scope.text();const heading=$('h1').first().text().trim();const name=str(data?.name)||heading;const parts=titleParts(name);
 const specs=new Map<string,string>();const normalize=(s:string)=>s.trim().replace(/[:#]+$/,'').replace(/\s+/g,' ').toLowerCase();
 scope.find('tr').each((_,el)=>{const cells=$(el).find('th,td');if(cells.length===2)specs.set(normalize(cells.eq(0).text()),cells.eq(1).text().trim());});
 scope.find('dt').each((_,el)=>{specs.set(normalize($(el).text()),$(el).next('dd').text().trim());});
 const label=(...keys:string[]):string|null=>{for(const key of keys){const found=specs.get(normalize(key));if(found)return found;const escaped=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const m=text.match(new RegExp('(?:^|[\\n\\r])\\s*'+escaped+'\\s*[:\\n]\\s*([^\\n\\r]+)','i'));if(m?.[1]?.trim())return m[1].trim();}return null;};
 const stock=str(data?.sku)||label('Stock','Stock #','Stock number','Stock no.')||parseStock(text);const vin=parseVin(data?.vehicleIdentificationNumber)||parseVin(label('VIN'));
 const type=[data?.['@type']].flat();const isVehicle=type.includes('Car')||type.includes('Vehicle');
 if((!isVehicle&&!parts.year)||(!stock&&!vin))return null;
 const yearValue=String(data?.vehicleModelDate||label('Year')||parts.year||'');const year=/^(19\d{2}|20\d{2})$/.test(yearValue)?Number(yearValue):null;
 const make=str(data?.brand)||label('Make')||parts.make;const model=str(data?.model)||label('Model');
 // The title is displayed as source description when model is unavailable; no guessed trim/model.
 const offers=Array.isArray(data?.offers)?data.offers[0]:data?.offers;
 const rawImages=data?.image;const images=[...new Set((Array.isArray(rawImages)?rawImages:[rawImages]).map(x=>safeURL(x?.url||x,url)).filter((x):x is string=>!!x))];
 if(!images.length){const image=safeURL($('meta[property="og:image"]').attr('content'),url);if(image)images.push(image);}
 const id=(stock||vin||createHash('sha256').update(url).digest('hex').slice(0,16)).toLowerCase().replace(/[^a-z0-9-]/g,'-');
 const availability=String(offers?.availability||'');const status=label('Availability','Status');const sold=/SoldOut/i.test(availability)||/^sold$/i.test(status||'')||/\b(?:vehicle (?:is )?sold|sold vehicle)\b/i.test(heading);const unavailable=/OutOfStock|Discontinued/i.test(availability)||/^unavailable$/i.test(status||'');
 const now=new Date().toISOString();const currency=offers?.priceCurrency||$('meta[property="product:price:currency"]').attr('content');
 const rawPrice=offers?.price??$('meta[property="product:price:amount"]').attr('content')??label('Price','Price CAD');const price=currency==='CAD'||(typeof rawPrice==='string'&&/CAD/i.test(rawPrice))?parsePrice(rawPrice):null;
 const odometer=data?.mileageFromOdometer;const unit=odometer?.unitCode||odometer?.unitText;const mileage=odometer&&['KMT','km','KM'].includes(unit)?parseMileage(odometer.value):parseMileage(label('Mileage (km)','Mileage','Odometer'));
 const carfax=safeURL($('a[href*="carfax"]').first().attr('href'),url);
 return {source_title:name,id,stock_number:stock,vin,year,make,model,trim:str(data?.vehicleConfiguration)||label('Trim'),price_cad:price,mileage_km:mileage,body_style:str(data?.bodyType)||label('Body Style'),drivetrain:str(data?.driveWheelConfiguration)||label('Drivetrain','Drive Type'),transmission:str(data?.vehicleTransmission)||label('Transmission'),engine:str(data?.vehicleEngine)||label('Engine'),fuel_type:str(data?.fuelType)||label('Fuel Type'),exterior_color:str(data?.color)||label('Exterior Color','Exterior Colour'),interior_color:label('Interior Color','Interior Colour'),accident_status:label('Accident History','Accident Status'),carfax_url:carfax,description:str(data?.description)||$('meta[name="description"]').attr('content')||name||null,primary_image:images[0]||null,image_urls:images,source_vehicle_url:url,availability:sold?'sold':unavailable?'unavailable':/InStock|LimitedAvailability/i.test(availability)||/^(available|in stock)$/i.test(status||'')?'available':'unknown',dealer_name:'Ultimate Motors',region:'Greater Toronto Area / Ontario / Canada',last_seen_at:now,updated_at:now};
}

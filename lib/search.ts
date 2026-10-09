import type {Vehicle} from './model';
import {driveCode} from './drivetrain';
export interface Filters {year?:number;minYear?:number;maxPrice?:number;maxMileage?:number;drivetrain?:string;terms:string[]}
export function parseSearch(query:string):Filters{
 let s=query.toLowerCase();const f:Filters={terms:[]};const year=s.match(/\b(19\d{2}|20\d{2})(\+)?(?!\d)/);if(year){if(year[2])f.minYear=+year[1];else f.year=+year[1];s=s.replace(year[0],' ');}
 s=s.replace(/(?:under|max(?:imum)?|below|less than)\s*\$?([\d,]+(?:\.\d+)?)(k)?\s*(km|kilometers?|kilometres?)?/g,(_,n,k,km)=>{const value=Number(n.replaceAll(',',''))*(k?1000:1);if(km)f.maxMileage=value;else f.maxPrice=value;return ' ';});
 const drive=s.match(/\b(awd|4wd|fwd|rwd)\b/);if(drive){f.drivetrain=drive[0];s=s.replace(drive[0],' ');}
 f.terms=s.replace(/[^a-z0-9 -]/g,' ').split(/\s+/).filter(t=>t&&!['and','a','car','vehicle','used','with','for'].includes(t));return f;
}
export function search(inventory:Vehicle[],query:string){const filters=parseSearch(query);const fits=(v:Vehicle)=>{
 const body=(v.body_style||'').toLowerCase();const text=[v.make,v.model,v.trim,body,/sport utility|suv|crossover/.test(body)?'suv':''].join(' ').toLowerCase();return (!filters.year||v.year===filters.year)&&(!filters.minYear||(v.year!==null&&v.year>=filters.minYear))&&(filters.maxPrice===undefined||(v.price_cad!==null&&v.price_cad<=filters.maxPrice))&&(filters.maxMileage===undefined||(v.mileage_km!==null&&v.mileage_km<=filters.maxMileage))&&(!filters.drivetrain||driveCode(v.drivetrain)===filters.drivetrain)&&filters.terms.every(t=>text.includes(t));};
 const exact=inventory.filter(fits);const score=(v:Vehicle)=>filters.terms.reduce((n,t)=>n+([v.make,v.model,v.trim,v.body_style].join(' ').toLowerCase().includes(t)?10:0),0)+(filters.drivetrain&&driveCode(v.drivetrain)===filters.drivetrain?5:0)-(filters.year&&v.year?Math.abs(v.year-filters.year):0);
 return {filters,exact:exact.length>0||!query.trim(),results:exact.length?exact:[...inventory].sort((a,b)=>score(b)-score(a)).slice(0,6)};
}

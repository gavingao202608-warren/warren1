export type Availability = 'available'|'missing'|'unavailable'|'sold'|'unknown';
export interface Vehicle {
 source_title?:string; id:string; stock_number:string|null; vin:string|null; year:number|null; make:string|null; model:string|null; trim:string|null; price_cad:number|null; mileage_km:number|null; body_style:string|null; drivetrain:string|null; transmission:string|null; engine:string|null; fuel_type:string|null; exterior_color:string|null; interior_color:string|null; accident_status:string|null; carfax_url:string|null; description:string|null; primary_image:string|null; image_urls:string[]; source_vehicle_url:string; availability:Availability; dealer_name:string; region:string; last_seen_at:string; updated_at:string;
}
export const title=(v:Vehicle)=>(v.make&&v.model?[v.year,v.make,v.model,v.trim].filter(Boolean).join(' '):v.source_title||[v.year,v.make,v.model,v.trim].filter(Boolean).join(' ')) || 'Vehicle details';
export const money=(n:number|null)=>n===null?'Not provided':new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(n)+' CAD';
export const mileage=(n:number|null)=>n===null?'Not provided':n.toLocaleString('en-CA')+' km';
export const slug=(v:Vehicle)=>v.id;
export const base=()=> (process.env.PUBLIC_BASE_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000').replace(/\/$/,'');
export const vehicleUrl=(v:Vehicle)=>base()+'/v/'+encodeURIComponent(slug(v));

import {vehicles} from '@/lib/db';import {customerDB} from '@/lib/customer-store';
export const dynamic='force-dynamic';
export async function GET(){try{await customerDB.prepare('SELECT 1 AS ready').get();if(!vehicles(true).length)return Response.json({status:'inventory_unavailable'},{status:503});return Response.json({status:'ok',inventory_count:vehicles(true).length,customer_storage:process.env.DATABASE_URL?'postgresql':'sqlite'},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({status:'storage_unavailable'},{status:503});}}

import {customerDB} from '@/lib/customer-store';
import {cookies} from 'next/headers';
import {db} from '@/lib/db';
import {validAdmin,sameOrigin,rateLimit} from '@/lib/security';
import {readText,BodyError} from '@/lib/request';
import {canQualify,leadStatuses} from '@/lib/leads';
export async function POST(req:Request){
 if(!sameOrigin(req)||!validAdmin((await cookies()).get('um_admin')?.value))return new Response('Unauthorized',{status:403});
 if(!rateLimit('lead-admin',30))return new Response('Rate limited',{status:429});
 try{
 const form=new URLSearchParams(await readText(req));const id=form.get('inquiry_id')||'';const status=form.get('status')||'';
 if(!id||id.length>80)return new Response('Invalid inquiry ID',{status:400});
 const lead=await customerDB.prepare('SELECT * FROM inquiries WHERE inquiry_id=?').get(id);
 if(!lead)return new Response('Inquiry not found',{status:404});
 if(status==='delete')await customerDB.prepare('DELETE FROM inquiries WHERE inquiry_id=?').run(id);
 else{if(!leadStatuses.includes(status as typeof leadStatuses[number]))return new Response('Invalid status',{status:400});
 if(status==='qualified'&&!canQualify(lead as {is_test:unknown;consent:unknown;contact_value:unknown}))return new Response('A qualified lead must be a non-test inquiry with consented contact details',{status:400});
 await customerDB.prepare('UPDATE inquiries SET lead_status=? WHERE inquiry_id=?').run(status,id);}
 return Response.redirect(new URL('/admin',req.url),303);
 }catch(e){return new Response('Unable to update inquiry',{status:e instanceof BodyError?e.status:400});}
}

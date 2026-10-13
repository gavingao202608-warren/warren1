import {cookies} from 'next/headers';import {randomUUID} from 'node:crypto';import {buyerRequestSchema,buyerQuestion} from '@/lib/buyer-intake';import {readJSON,BodyError} from '@/lib/request';import {sameOrigin,rateLimit,sources,controlledValidation} from '@/lib/security';import {saveInquiry} from '@/lib/db';
export async function POST(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Invalid origin'},{status:403});
 const c=await cookies();const session=c.get('um_session')?.value||randomUUID();
 if(!rateLimit('buyer:'+session,5)||!rateLimit('buyer-ip:'+(req.headers.get('x-forwarded-for')||'local'),20))return Response.json({error:'Please wait before submitting again'},{status:429});
 try{const parsed=buyerRequestSchema.safeParse(await readJSON(req));if(!parsed.success)return Response.json({error:parsed.error.issues[0].message},{status:400});const x=parsed.data;
 const source=x.source&&sources.includes(x.source)?x.source:c.get('um_source')?.value||'direct';
 const id=await saveInquiry({session_id:session,vehicle_id:x.vehicle_id||null,source,question:buyerQuestion(x),contact_method:x.contact_method,contact_value:x.contact_value,consent:true,is_test:controlledValidation(req)});
 c.set('um_session',session,{httpOnly:true,sameSite:'lax',secure:req.headers.get('x-forwarded-proto')==='https'||new URL(req.url).protocol==='https:',path:'/',maxAge:2592000});
 return Response.json({inquiry_id:id,status:'request_saved',message:'The independent site operator received your request. It is not a booking, seller confirmation or financing application.'},{status:201});
 }catch(e){return Response.json({error:e instanceof BodyError?e.message:'Could not save the request. Please try again.'},{status:e instanceof BodyError?e.status:400});}
}

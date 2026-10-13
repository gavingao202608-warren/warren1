import {cookies} from 'next/headers';import {createHash} from 'node:crypto';import {customerDB} from '@/lib/customer-store';import {leadImportSchema,importedQuestion} from '@/lib/buyer-intake';import {sameOrigin,validAdmin,rateLimit} from '@/lib/security';import {readText,BodyError} from '@/lib/request';
export async function POST(req:Request){
 if(!sameOrigin(req)||!validAdmin((await cookies()).get('um_admin')?.value))return Response.json({error:'Unauthorized'},{status:403});
 if(!rateLimit('lead-import',5))return Response.json({error:'Please wait before importing again'},{status:429});
 let inserted=0,duplicates=0;
 try{if(!req.headers.get('content-type')?.includes('application/json'))throw new BodyError('JSON required',415);let input;try{input=JSON.parse(await readText(req,60000));}catch(e){if(e instanceof BodyError)throw e;throw new BodyError('Invalid JSON');}
 const parsed=leadImportSchema.safeParse(input);if(!parsed.success)return Response.json({error:parsed.error.issues[0].message},{status:400});
 // Validate the whole batch before writing. Stable IDs make retries idempotent, including partial database failures.
 for(const x of parsed.data.records){const id='import-'+createHash('sha256').update((parsed.data.controlled_test?'test:':'real:')+x.source+'\0'+x.external_id).digest('hex');
 const contact=x.contact_method==='Phone'?x.contact_value.replace(/[^\d+]/g,''):x.contact_value;
 const result=await customerDB.prepare('INSERT INTO inquiries(inquiry_id,session_id,vehicle_id,source,question,created_at,contact_method,contact_value,consent,is_test,lead_status) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(inquiry_id) DO NOTHING').run(id,'authorized-import',null,x.source,importedQuestion(x),new Date().toISOString(),x.contact_method,contact,1,parsed.data.controlled_test?1:0,'new') as {changes?:number|bigint;rowCount?:number};
 if(Number(result.rowCount??result.changes??0)>0)inserted++;else duplicates++;}
 return Response.json({inserted,duplicates,controlled_test:parsed.data.controlled_test,source_evidence:'operator_supplied_not_platform_verified'},{status:200});
 }catch(e){return Response.json({error:e instanceof BodyError?e.message:'Import could not complete. Retry is safe for the same source and external IDs.',inserted,duplicates},{status:e instanceof BodyError?e.status:503});}
}

import {cookies} from 'next/headers';import {validAdmin,sameOrigin,rateLimit} from '@/lib/security';import {saveInquiry,vehicles} from '@/lib/db';
export async function POST(req:Request){
 if(!sameOrigin(req)||!validAdmin((await cookies()).get('um_admin')?.value))return new Response('Unauthorized',{status:403});
 if(!rateLimit('admin-test-inquiry',3))return new Response('Rate limited',{status:429});
 try{const inquiry_id=await saveInquiry({session_id:'admin-validation',vehicle_id:vehicles(true)[0]?.id||null,source:'direct',question:'TEST: independent site end-to-end validation '+new Date().toISOString(),is_test:true});
 if(req.headers.get('accept')?.includes('application/json'))return Response.json({inquiry_id,is_test:true},{status:201});
 return Response.redirect(new URL('/admin',req.headers.get('origin')!),303);
 }catch{return Response.json({error:'Could not save a test inquiry'},{status:503});}
}

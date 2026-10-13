import {z} from 'zod';import {inquirySchema} from './inquiry-schema';
export const buyerRequestSchema=z.object({
 city:z.string().trim().min(2).max(80),budget_cad:z.number().finite().min(0).max(1000000),
 intended_use:z.string().trim().min(2).max(200),preferred_vehicle:z.string().trim().max(120).optional(),
 timeframe:z.enum(['within_30_days','within_90_days','later','researching']),
 intent:z.enum(['buy','compare','trade_in']),vehicle_id:z.string().max(80).nullable().optional(),
 question:z.string().trim().max(600).optional(),contact_method:z.enum(['Email','Phone']),contact_value:z.string().trim().min(1).max(200),
 consent:z.literal(true),source:z.string().max(30).optional()
}).strict().superRefine((x,ctx)=>{const contact=inquirySchema.safeParse({question:'buyer request',contact_method:x.contact_method,contact_value:x.contact_value,consent:x.consent});if(!contact.success)for(const issue of contact.error.issues)ctx.addIssue({code:'custom',path:issue.path,message:issue.message});});
export const intakeSourceNames=['facebook','google','autotrader','cargurus','kijiji','51','yorkbbs','partner','offline','website'] as const;
const evidenceURL=z.url().max(600).refine(s=>{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password;},'Use an HTTPS source or consent record URL, without credentials');
export const importedLeadSchema=z.object({
 external_id:z.string().trim().min(1).max(120),source:z.enum(intakeSourceNames),
 consent:z.literal(true),consent_recorded_at:z.iso.datetime({offset:true}),evidence_url:evidenceURL,
 contact_method:z.enum(['Email','Phone']),contact_value:z.string().trim().min(1).max(200),
 city:z.string().trim().max(80).optional(),budget_cad:z.number().finite().min(0).max(1000000).optional(),
 timeframe:z.enum(['within_30_days','within_90_days','later','researching']).optional(),question:z.string().trim().min(1).max(600)
}).strict().superRefine((x,ctx)=>{if(Date.parse(x.consent_recorded_at)>Date.now()+300000)ctx.addIssue({code:'custom',path:['consent_recorded_at'],message:'Consent cannot be recorded in the future'});const contact=inquirySchema.safeParse({question:x.question,contact_method:x.contact_method,contact_value:x.contact_value,consent:x.consent});if(!contact.success)for(const issue of contact.error.issues)ctx.addIssue({code:'custom',path:issue.path,message:issue.message});});
export const leadImportSchema=z.object({authorized:z.literal(true),controlled_test:z.boolean().optional().default(false),records:z.array(importedLeadSchema).min(1).max(25)}).strict();
export function buyerQuestion(x:z.infer<typeof buyerRequestSchema>){return ['Buyer interest request / 主动意向请求','Intent: '+x.intent,'City: '+x.city,'Budget CAD: '+x.budget_cad,'Timeframe: '+x.timeframe,'Intended use: '+x.intended_use,'Preferred vehicle: '+(x.preferred_vehicle||'Not specified'),'Question: '+(x.question||'Not specified'),'Self-reported interest only. Requires human verification; not a booked appointment or financing application.'].join('\n');}
export function importedQuestion(x:z.infer<typeof importedLeadSchema>){return ['Imported inquiry / 授权导入询盘','Source: '+x.source,'External record: '+x.external_id,'Consent recorded: '+x.consent_recorded_at,'Operator-provided evidence URL: '+x.evidence_url,'City: '+(x.city||'Not supplied'),'Budget CAD: '+(x.budget_cad??'Not supplied'),'Timeframe: '+(x.timeframe||'Not supplied'),'Question: '+x.question,'Source and consent evidence were supplied by the importing operator, not independently verified by a platform API. Import does not establish purchase intent or renewed contact permission.'].join('\n');}

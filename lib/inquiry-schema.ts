import {z} from 'zod';
export const inquirySchema=z.object({
 vehicle_id:z.string().max(80).nullable().optional(),
 source:z.string().max(30).optional(),
 question:z.string().trim().min(1,'Please enter your question').max(2000,'Question must be at most 2000 characters'),
 contact_method:z.enum(['','Email','Phone']).nullable().optional(),
 contact_value:z.string().trim().max(200).nullable().optional(),
 consent:z.boolean().optional().default(false)
}).strict().superRefine((x,ctx)=>{
 if(!x.contact_value)return;
 if(!x.consent)ctx.addIssue({code:'custom',path:['consent'],message:'Please consent to being contacted'});
 if(!x.contact_method)ctx.addIssue({code:'custom',path:['contact_method'],message:'Choose Email or Phone'});
 if(x.contact_method==='Email'&&!z.email().safeParse(x.contact_value).success)ctx.addIssue({code:'custom',path:['contact_value'],message:'Please enter a valid email address'});
 if(x.contact_method==='Phone'&&(!/^[+\d\s().-]+$/.test(x.contact_value)||!/^\d{7,15}$/.test(x.contact_value.replace(/\D/g,''))))ctx.addIssue({code:'custom',path:['contact_value'],message:'Please enter a valid phone number'});
});

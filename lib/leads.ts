export const leadStatuses=['new','contacted','qualified','closed','spam'] as const;
export function canQualify(lead:{is_test:unknown;consent:unknown;contact_value:unknown}){return lead.is_test===0&&lead.consent===1&&typeof lead.contact_value==='string'&&lead.contact_value.trim().length>0;}

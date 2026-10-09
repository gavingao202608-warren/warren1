import {rateLimit} from './security';
export function publicResponse(req:Request,data:unknown){if(!rateLimit('read:'+(req.headers.get('x-forwarded-for')||'local')))return Response.json({error:'Rate limit exceeded'},{status:429});return Response.json(data,{headers:{'Cache-Control':'public, max-age=60, stale-while-revalidate=120'}});}

export const dynamic='force-dynamic';
import {base} from '@/lib/model';import type {MetadataRoute} from 'next';export default function robots():MetadataRoute.Robots{return {rules:[{userAgent:['*','Googlebot','Bingbot','OAI-SearchBot'],allow:['/','/inventory','/v/','/feed/','/api/vehicles'],disallow:['/admin','/api/admin','/api/inquiries','/api/track','/ask']}],sitemap:base()+'/sitemap.xml'};}

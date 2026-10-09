import {vehicles} from '@/lib/db';import {sitemapEntries} from '@/lib/feed';export const dynamic='force-dynamic';export default function sitemap(){return sitemapEntries(vehicles(true));}

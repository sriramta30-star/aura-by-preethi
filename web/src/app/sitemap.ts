import type {MetadataRoute} from "next";
import {demoProducts} from "@/lib/products";
export default function sitemap():MetadataRoute.Sitemap{
 const site=process.env.NEXT_PUBLIC_SITE_URL;
 if(!site)return [];
 const paths=["","/made-to-stitch",...demoProducts.map(p=>"/products/"+p.slug)];
 return paths.map(path=>({url:site.replace(/\/$/,"")+path,lastModified:new Date(),changeFrequency:"weekly" as const,priority:path===""?1:.7}));
}
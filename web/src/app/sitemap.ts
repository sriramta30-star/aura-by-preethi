import type {MetadataRoute} from "next";
import {demoProducts} from "@/lib/products";
export default function sitemap():MetadataRoute.Sitemap{
 const site=process.env.NEXT_PUBLIC_SITE_URL||"https://example.invalid";
 return ["","/#shop","/made-to-stitch","/login","/cart","/wishlist",...demoProducts.map(p=>"/products/"+p.slug)].map(path=>({url:site+path,lastModified:new Date(),changeFrequency:"weekly" as const,priority:path===""?1:.7}));
}

import type {MetadataRoute} from "next";
import {createClient} from "@supabase/supabase-js";
import {demoProducts} from "@/lib/products";
export const revalidate=3600;

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const site=process.env.NEXT_PUBLIC_SITE_URL;
 if(!site)return [];
 let slugs=demoProducts.map(p=>p.slug);
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(url&&service){
  try{
   const db=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
   const {data,error}=await db.from("products").select("slug").eq("active",true);
   if(!error&&data)slugs=data.map(row=>row.slug);
  }catch{/* Keep the public demo sitemap until the catalogue is available. */}
 }
 const paths=["","/made-to-stitch",...slugs.map(slug=>"/products/"+slug)];
 return paths.map(path=>({url:site.replace(/\/$/,"")+path,lastModified:new Date(),changeFrequency:"weekly" as const,priority:path===""?1:.7}));
}
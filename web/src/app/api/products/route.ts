import {NextResponse} from "next/server";
import {demoProducts} from "@/lib/products";
import {createClient} from "@supabase/supabase-js";
export const revalidate=60;
export async function GET(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({products:demoProducts,mode:"preview"});
 try{
  const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data,error}=await db.from("products").select("id,slug,name,category,price,compare_at,description,fabric,colors,sizes,stock,image,badge").eq("active",true).order("created_at",{ascending:false});
  if(error)throw error;
  const products=(data||[]).map(p=>({id:p.id,slug:p.slug,name:p.name,category:p.category,price:Number(p.price),compareAt:p.compare_at?Number(p.compare_at):undefined,description:p.description,fabric:p.fabric,colors:p.colors||[],sizes:p.sizes||[],stock:p.stock,image:p.image,badge:p.badge||undefined}));
  return NextResponse.json({products,mode:"live"},{headers:{"Cache-Control":"s-maxage=60, stale-while-revalidate=300"}});
 }catch{return NextResponse.json({error:"Catalogue is temporarily unavailable."},{status:503});}
}

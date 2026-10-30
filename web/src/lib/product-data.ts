import {demoProducts,type Product} from "@/lib/products";
import {createServerSupabase} from "@/lib/supabase-server";

export async function getProductBySlug(slug:string):Promise<Product|null>{
 const preview=demoProducts.find(item=>item.slug===slug)||null;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return preview;
 try{
  const db=await createServerSupabase();
  const {data,error}=await db.from("products")
   .select("id,slug,name,category,price,compare_at,description,fabric,colors,sizes,stock,image,badge")
   .eq("slug",slug).eq("active",true).maybeSingle();
  if(error||!data)return null;
  return {
   id:data.id,slug:data.slug,name:data.name,
   category:data.category as Product["category"],
   price:Number(data.price),
   compareAt:data.compare_at?Number(data.compare_at):undefined,
   description:data.description||"",fabric:data.fabric||"",
   colors:data.colors||[],sizes:data.sizes||[],stock:Number(data.stock)||0,
   image:data.image,badge:data.badge||undefined
  };
 }catch{return preview;}
}
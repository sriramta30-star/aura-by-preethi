import {NextResponse} from "next/server";
import {createClient as createSupabaseClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export async function POST(request:Request){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"The enquiry service is not connected yet. Please contact the store directly."},{status:503});
 try{
  const body=await request.json() as Record<string,unknown>;
  const name=typeof body.name==="string"?body.name.trim():"",email=typeof body.email==="string"?body.email.trim().toLowerCase():"",phone=typeof body.phone==="string"?body.phone.trim():"";
  const neckline=typeof body.neckline==="string"?body.neckline:"",sleeves=typeof body.sleeves==="string"?body.sleeves:"",back=typeof body.back==="string"?body.back:"",notes=typeof body.notes==="string"?body.notes.slice(0,2000):"";
  if(name.length<2||name.length>100||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||phone.length<7||phone.length>20||!["Sweetheart","Boat neck","V-neck","Square neck","High neck"].includes(neckline)||!["Sleeveless","Short sleeve","Elbow length","Full sleeve"].includes(sleeves)||!["Classic","Tie-back","Deep back","Button detail"].includes(back))return NextResponse.json({error:"Please check the name, email, phone and design options."},{status:400});
  const db=createSupabaseClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
  const {error}=await db.from("enquiries").insert({name,email,phone,neckline,sleeves,back,notes});
  if(error)return NextResponse.json({error:"Your enquiry couldn't be saved. Please contact the store."},{status:500});
  return NextResponse.json({ok:true},{status:201});
 }catch{return NextResponse.json({error:"Enquiry could not be submitted."},{status:400});}
}

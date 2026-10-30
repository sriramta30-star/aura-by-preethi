import {NextResponse} from "next/server";
import {createServerSupabase} from "@/lib/supabase-server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
async function adminDb(){
 const auth=await createServerSupabase();const {data:{user}}=await auth.auth.getUser();
 if(!user)return {response:NextResponse.json({error:"Sign in first."},{status:401})};
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return {response:NextResponse.json({error:"Admin database is not configured."},{status:503})};
 const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data:profile,error}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();
 if(error||profile?.role!=="admin")return {response:NextResponse.json({error:"Administrator access required."},{status:403})};
 return {db};
}
export async function GET(){
 try{const gate=await adminDb();if("response" in gate)return gate.response;
 const {data,error}=await gate.db.from("products").select("*").order("created_at",{ascending:false});if(error)throw error;
 return NextResponse.json({products:data||[]},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Admin catalogue is unavailable."},{status:503});}
}
export async function POST(request:Request){
 try{const gate=await adminDb();if("response" in gate)return gate.response;const body=await request.json();
 const name=typeof body.name==="string"?body.name.trim():"",slug=typeof body.slug==="string"?body.slug.trim().toLowerCase():"",category=typeof body.category==="string"?body.category:"",price=Number(body.price),stock=Number(body.stock),image=typeof body.image==="string"?body.image.trim():"";
 if(name.length<2||name.length>140||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!["Sarees","Ready-made Blouses","Made-to-stitch"].includes(category)||!Number.isFinite(price)||price<=0||!Number.isInteger(stock)||stock<0||!/^https:\/\//.test(image))return NextResponse.json({error:"Check product name, URL slug, category, price, stock and HTTPS image URL."},{status:400});
 const {data,error}=await gate.db.from("products").insert({id:slug,name,slug,category,price,stock,image,description:typeof body.description==="string"?body.description.slice(0,2000):"",fabric:typeof body.fabric==="string"?body.fabric.slice(0,120):"",colors:Array.isArray(body.colors)?body.colors.slice(0,8):["Maroon"],sizes:Array.isArray(body.sizes)?body.sizes.slice(0,10):[],active:true}).select("*").single();
 if(error)return NextResponse.json({error:error.code==="23505"?"Product slug already exists.":"Product could not be saved."},{status:400});
 return NextResponse.json({product:data},{status:201});
 }catch{return NextResponse.json({error:"Product could not be saved."},{status:503});}
}
export async function DELETE(request:Request){
 try{const gate=await adminDb();if("response" in gate)return gate.response;const body=await request.json();if(typeof body.id!=="string"||!body.id)return NextResponse.json({error:"Product id is required."},{status:400});
 const {error}=await gate.db.from("products").update({active:false}).eq("id",body.id);if(error)return NextResponse.json({error:"Product could not be deactivated."},{status:400});
 return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Product could not be deactivated."},{status:503});}
}
